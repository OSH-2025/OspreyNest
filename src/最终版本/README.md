graph TD
    subgraph "用户交互"
        A[用户语音指令]
    end
    subgraph "前端浏览器"
        B[语音识别模块]
        C{是否检测到唤醒词?}
        D[大模型API调用]
        E[构建提示词]
        F[接收标准化指令]
        G[WASM模块加载]
        H[解析指令生成GPIO命令]
    end
    subgraph "网络通信"
        I[WebSocket连接]
    end
    subgraph "树莓派边缘设备"
        J[接收GPIO命令]
        K[GPIO控制模块]
        L[硬件设备状态]
    end  
    subgraph "反馈系统"
        M[状态更新推送]
        N[UI界面反馈]
    end 
    A --> B
    B --> C
    C -->|否| B
    C -->|是| D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    %% 装饰元素
    style 前端浏览器 fill:#E5F6FF,stroke:#73A6FF,stroke-width:2px
    style 树莓派边缘设备 fill:#FFF6CC,stroke:#FFBC52,stroke-width:2px
    style 用户交互 fill:#E5F6FF,stroke:#73A6FF,stroke-width:2px
    style 反馈系统 fill:#E5F6FF,stroke:#73A6FF,stroke-width:2px
    style 网络通信 fill:#FFEBEB,stroke:#E68994,stroke-width:2px
    L --> M
    M --> N
    N --> B
    
