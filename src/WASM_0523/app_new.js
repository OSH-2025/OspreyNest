// app.js
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const startRecognitionButton = document.getElementById('start-recognition');
    const listeningStatus = document.getElementById('listening-status');
    const transcription = document.getElementById('transcription');
    const commandResult = document.getElementById('command-result');
    const lightStatus = document.getElementById('light-status');
    const logContent = document.getElementById('log-content');
    const logContainer = document.getElementById('log-container');
    const toggleLog = document.getElementById('toggle-log');
    
    // 检查Web Speech API是否可用
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        startRecognitionButton.addEventListener('click', function() {
            if (recognition.start) {
                startRecognitionButton.disabled = true;
                startRecognitionButton.textContent = '正在监听...';
                listeningStatus.textContent = '请说出您的指令...';
                logMessage('开始监听语音指令', 'listening');
                
                recognition.start();
            }
        });
        
        recognition.onstart = function() {
            startRecognitionButton.classList.add('listening');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            transcription.textContent = `识别结果: "${transcript}"`;
            logMessage(`语音识别结果: ${transcript}`, 'processing');
            
            // 使用WASM解析指令
            parseCommand(transcript).then(command => {
                if (command) {
                    commandResult.textContent = `解析结果: ${command.action} ${command.target}`;
                    
                    // 发送指令到树莓派
                    sendCommandToRaspberryPi(command).then(response => {
                        logMessage(`指令发送成功: ${JSON.stringify(command)}`, 'sending');
                        updateDeviceStatus(command, response);
                    }).catch(error => {
                        logMessage(`指令发送失败: ${error}`, 'error');
                    });
                } else {
                    commandResult.textContent = '无法解析指令，请重试';
                    logMessage('无法解析指令', 'error');
                }
            }).catch(error => {
                commandResult.textContent = `解析错误: ${error}`;
                logMessage(`解析错误: ${error}`, 'error');
            });
        };
        
        recognition.onerror = function(event) {
            logMessage(`语音识别错误: ${event.error}`, 'error');
            listeningStatus.textContent = `语音识别错误: ${event.error}`;
        };
        
        recognition.onend = function() {
            startRecognitionButton.classList.remove('listening');
            startRecognitionButton.disabled = false;
            startRecognitionButton.textContent = '开始语音';
            listeningStatus.textContent = '等待指令...';
        };
    } else {
        listeningStatus.textContent = '您的浏览器不支持语音识别';
        startRecognitionButton.disabled = true;
        logMessage('您的浏览器不支持Web Speech API', 'error');
    }
    
    // 切换日志显示
    toggleLog.addEventListener('click', function(e) {
        e.preventDefault();
        if (logContainer.style.display === 'block') {
            logContainer.style.display = 'none';
            toggleLog.textContent = '显示日志';
        } else {
            logContainer.style.display = 'block';
            toggleLog.textContent = '隐藏日志';
        }
    });
    
    // 辅助函数：记录日志
    function logMessage(message, type = 'info') {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const logEntry = `[${timeString}] ${message}`;
        
        // 添加到日志容器
        logContent.textContent = logEntry + '\n' + logContent.textContent;
        
        // 滚动到底部
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    // 辅助函数：更新设备状态
    function updateDeviceStatus(command, response) {
        if (command.target === '灯' && response.success) {
            const status = command.action === '打开' ? '开启' : '关闭';
            lightStatus.textContent = status;
        }
    }
});
/*
// 与WASM模块交互的函数
async function parseCommand(text) {
    // 加载WASM模块
    const nlpParser = await import('./nlp-parser.js');
    
    // 调用WASM函数解析指令
    const command = nlpParser.parseCommand(text);
    return command;
}
*/
/*
// 与WASM模块交互的函数
async function parseCommand(text) {
    // 加载WASM模块
    const createNlpParserModule = await import('./nlp-parser.js');
    const nlpParser = await createNlpParserModule();

    // 调用WASM函数解析指令
    const jsonPtr = nlpParser._parseCommandAndReturnJSON(text);
    const jsonString = nlpParser.UTF8ToString(jsonPtr);
    const command = JSON.parse(jsonString);
    nlpParser._freeJSONResult(jsonPtr);

    return command;
}
*/
async function parseCommand(text) {
    // 加载WASM模块
    //为检查其余部分是否出错，暂将nlp-parse.js中的函数直接黏贴进入app.js中
    var createNlpParserModule = (() => {
  var _scriptName = typeof document != 'undefined' ? document.currentScript?.src : undefined;
  return (
async function(moduleArg = {}) {
  var moduleRtn;

var Module=moduleArg;var readyPromiseResolve,readyPromiseReject;var readyPromise=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject});var ENVIRONMENT_IS_WEB=typeof window=="object";var ENVIRONMENT_IS_WORKER=typeof WorkerGlobalScope!="undefined";var ENVIRONMENT_IS_NODE=typeof process=="object"&&process.versions?.node&&process.type!="renderer";if(ENVIRONMENT_IS_NODE){}var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};if(typeof __filename!="undefined"){_scriptName=__filename}else if(ENVIRONMENT_IS_WORKER){_scriptName=self.location.href}var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_NODE){var fs=require("fs");var nodePath=require("path");scriptDirectory=__dirname+"/";readBinary=filename=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename);return ret};readAsync=async(filename,binary=true)=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8");return ret};if(process.argv.length>1){thisProgram=process.argv[1].replace(/\\/g,"/")}arguments_=process.argv.slice(2);quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){try{scriptDirectory=new URL(".",_scriptName).href}catch{}{if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=async url=>{if(isFileURI(url)){return new Promise((resolve,reject)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){resolve(xhr.response);return}reject(xhr.status)};xhr.onerror=reject;xhr.send(null)})}var response=await fetch(url,{credentials:"same-origin"});if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)}}}else{}var out=console.log.bind(console);var err=console.error.bind(console);var wasmBinary;var wasmMemory;var ABORT=false;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAP64,HEAPU64,HEAPF64;var runtimeInitialized=false;var isFileURI=filename=>filename.startsWith("file://");function updateMemoryViews(){var b=wasmMemory.buffer;HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF32=new Float32Array(b);HEAPF64=new Float64Array(b);HEAP64=new BigInt64Array(b);HEAPU64=new BigUint64Array(b)}function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(onPreRuns)}function initRuntime(){runtimeInitialized=true;wasmExports["c"]()}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(onPostRuns)}var runDependencies=0;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)}function removeRunDependency(id){runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}var wasmBinaryFile;function findWasmBinary(){return locateFile("nlp-parser.wasm")}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}async function getWasmBinary(binaryFile){if(!wasmBinary){try{var response=await readAsync(binaryFile);return new Uint8Array(response)}catch{}}return getBinarySync(binaryFile)}async function instantiateArrayBuffer(binaryFile,imports){try{var binary=await getWasmBinary(binaryFile);var instance=await WebAssembly.instantiate(binary,imports);return instance}catch(reason){err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)}}async function instantiateAsync(binary,binaryFile,imports){if(!binary&&typeof WebAssembly.instantiateStreaming=="function"&&!isFileURI(binaryFile)&&!ENVIRONMENT_IS_NODE){try{var response=fetch(binaryFile,{credentials:"same-origin"});var instantiationResult=await WebAssembly.instantiateStreaming(response,imports);return instantiationResult}catch(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation")}}return instantiateArrayBuffer(binaryFile,imports)}function getWasmImports(){return{a:wasmImports}}async function createWasm(){function receiveInstance(instance,module){wasmExports=instance.exports;wasmMemory=wasmExports["b"];updateMemoryViews();removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){return receiveInstance(result["instance"])}var info=getWasmImports();if(Module["instantiateWasm"]){return new Promise((resolve,reject)=>{Module["instantiateWasm"](info,(mod,inst)=>{resolve(receiveInstance(mod,inst))})})}wasmBinaryFile??=findWasmBinary();try{var result=await instantiateAsync(wasmBinary,wasmBinaryFile,info);var exports=receiveInstantiationResult(result);return exports}catch(e){readyPromiseReject(e);return Promise.reject(e)}}class ExitStatus{name="ExitStatus";constructor(status){this.message=`Program terminated with exit(${status})`;this.status=status}}var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module)}};var onPostRuns=[];var addOnPostRun=cb=>onPostRuns.push(cb);var onPreRuns=[];var addOnPreRun=cb=>onPreRuns.push(cb);var noExitRuntime=true;var stackRestore=val=>__emscripten_stack_restore(val);var stackSave=()=>_emscripten_stack_get_current();var abortOnCannotGrowMemory=requestedSize=>{abort("OOM")};var _emscripten_resize_heap=requestedSize=>{var oldSize=HEAPU8.length;requestedSize>>>=0;abortOnCannotGrowMemory(requestedSize)};var getCFunc=ident=>{var func=Module["_"+ident];return func};var writeArrayToMemory=(array,buffer)=>{HEAP8.set(array,buffer)};var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}}heap[outIdx]=0;return outIdx-startIdx};var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);var stackAlloc=sz=>__emscripten_stack_alloc(sz);var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};var UTF8Decoder=typeof TextDecoder!="undefined"?new TextDecoder:undefined;var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead=NaN)=>{var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heapOrArray[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var UTF8ToString=(ptr,maxBytesToRead)=>ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";var ccall=(ident,returnType,argTypes,args,opts)=>{var toC={string:str=>{var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=stringToUTF8OnStack(str)}return ret},array:arr=>{var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string"){return UTF8ToString(ret)}if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func(...cArgs);function onDone(ret){if(stack!==0)stackRestore(stack);return convertReturnValue(ret)}ret=onDone(ret);return ret};var cwrap=(ident,returnType,argTypes,opts)=>{var numericArgs=!argTypes||argTypes.every(type=>type==="number"||type==="boolean");var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return(...args)=>ccall(ident,returnType,argTypes,args,opts)};var ALLOC_STACK=1;var allocate=(slab,allocator)=>{var ret;if(allocator==ALLOC_STACK){ret=stackAlloc(slab.length)}else{ret=_malloc(slab.length)}if(!slab.subarray&&!slab.slice){slab=new Uint8Array(slab)}HEAPU8.set(slab,ret);return ret};{if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(Module["print"])out=Module["print"];if(Module["printErr"])err=Module["printErr"];if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"]}Module["ccall"]=ccall;Module["cwrap"]=cwrap;Module["UTF8ToString"]=UTF8ToString;Module["stringToUTF8"]=stringToUTF8;Module["allocate"]=allocate;var wasmImports={a:_emscripten_resize_heap};var wasmExports=await createWasm();var ___wasm_call_ctors=wasmExports["c"];var _parseCommandAndReturnJSON=Module["_parseCommandAndReturnJSON"]=wasmExports["d"];var _malloc=wasmExports["e"];var _freeJSONResult=Module["_freeJSONResult"]=wasmExports["f"];var __emscripten_stack_restore=wasmExports["g"];var __emscripten_stack_alloc=wasmExports["h"];var _emscripten_stack_get_current=wasmExports["i"];function run(){if(runDependencies>0){dependenciesFulfilled=run;return}preRun();if(runDependencies>0){dependenciesFulfilled=run;return}function doRun(){Module["calledRun"]=true;if(ABORT)return;initRuntime();readyPromiseResolve(Module);Module["onRuntimeInitialized"]?.();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(()=>{setTimeout(()=>Module["setStatus"](""),1);doRun()},1)}else{doRun()}}function preInit(){if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].shift()()}}}preInit();run();moduleRtn=readyPromise;


  return moduleRtn;
}
);
})();
    const nlpParser = await createNlpParserModule();

    // 调用WASM函数解析指令
    const jsonPtr = nlpParser._parseCommandAndReturnJSON(text);
    const jsonString = nlpParser.UTF8ToString(jsonPtr);
    const command = JSON.parse(jsonString);
    nlpParser._freeJSONResult(jsonPtr);

    return command;
}

// 发送指令到树莓派的函数//192.168.36.179
async function sendCommandToRaspberryPi(command) {
    try {
        const response = await fetch('http://192.168.36.179:5000/api/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: command.action,
                target: command.target
            })
        });
        
        return await response.json();
    } catch (error) {
        throw new Error(`发送指令失败: ${error.message}`);
    }
}
