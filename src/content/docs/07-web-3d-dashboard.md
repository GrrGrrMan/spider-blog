---
title: "3D digital twin and web simulation"
description: "Browser-based WebGL kinematics digital twin, Web Worker offloading, and WebSocket MQTT telemetry."
section: "06 Simulation & web"
order: 7
---

The **Web UI** serves as the primary human-machine interface (HMI) and virtual kinematics simulator for the Hexapod V2 platform. Built with React and Plotly.js, it synchronizes physical hardware telemetry with an interactive 3D digital twin over WebSockets.

## 1. Frontend architecture topology

```mermaid
flowchart TD
    subgraph BrowserEngine ["Client Browser Runtime (React 16.13)"]
        CTX["RobotContext (Global State Provider)"]
        
        subgraph ComputeWorkers ["Background Web Workers"]
            WORKER["Web Worker Pool (workerPool.js)<br/>• Async Trajectory Generation<br/>• Multi-Keyframe Choreography Synthesis<br/>• Omnidirectional Walk Path Solving"]
        end

        subgraph Visualizers ["Rendering & Perception Pipelines"]
            PLOTLY["Plotly.js WebGL 3D Canvas<br/>(60 FPS Hardware-Accelerated Rendering)"]
            VAD["Browser Voice Activity Detection<br/>(@ricky0123/vad-web + Silero ONNX Runtime)"]
            CAM_VIEW["Dual-Stage Video Viewport<br/>(Live MJPEG Stream + State Watchdog)"]
        end

        subgraph CommsHook ["Network Communications Layer"]
            MQTT_HOOK["useMqtt Hook<br/>(WebSocket Client Port 9001)"]
            AI_HOOK["useAiChat Hook<br/>(State Tracking & Action Directives)"]
        end
    end

    subgraph PiGateway ["Pi-Hub Host Ingress"]
        WS_BROKER["Mosquitto WebSocket Broker (:9001)"]
        CAM_PROXY["Nginx Camera Proxy (:8088 /cam-stream)"]
    end

    CTX <--> WORKER
    CTX <--> PLOTLY
    CTX <--> CAM_VIEW
    VAD --> AI_HOOK
    AI_HOOK <--> MQTT_HOOK
    
    MQTT_HOOK <-->|10 Hz JSON Telemetry / Commands| WS_BROKER
    CAM_VIEW <-->|HTTP Multipart MJPEG Stream| CAM_PROXY
```

---

## 2. Teleoperation and 3D state synchronization

When an operator adjusts kinematic sliders or when the physical robot traverses terrain, state synchronization executes with sub-50ms latency:

```mermaid
sequenceDiagram
    actor Operator
    participant UI as Control Dashboard (React)
    participant Solver as Linkage IK Solver
    participant Worker as Motion Web Worker
    participant WebGL as Plotly 3D Viewport
    participant MQTT as WebSocket Client (Port 9001)
    participant S3 as ESP32-S3 Hardware

    Operator->>UI: Adjust Stance / Translation Sliders (tx, ty, rz)
    UI->>Solver: solveInverseKinematics(tx, ty, rz, stance)
    Solver-->>UI: 18 Computed Joint Angles (Alpha, Beta, Gamma)
    
    par Virtual Rendering Loop (60 FPS)
        UI->>WebGL: Update Coordinate Traces (Body Mesh, Leg Links)
        WebGL-->>Operator: Real-Time 3D Mesh Deformation
    and Physical Teleoperation Stream (10 Hz Throttled)
        UI->>MQTT: Publish hexapod/{id}/cmd (JSON Lease)
        MQTT->>S3: Commit Staggered PWM Angles
        S3-->>Operator: Physical Leg Actuation
    end
```

---

## 3. Background motion offloading and worker pool

To prevent the browser main UI thread from dropping frames during intensive trigonometric calculations, heavy choreographies are delegated to dedicated Web Workers:

```mermaid
flowchart LR
    MAIN["React Main Thread<br/>(User Input & DOM Updates)"] -->|Dispatches Action Payload| POOL["Web Worker Pool (workerPool.js)"]
    
    subgraph BackgroundCalculations ["Parallel Background Execution"]
        IK_CALC["VirtualHexapod.js & Linkage.js<br/>(6-DoF Body Orientation Matrices)"]
        EASING_CALC["interpolation.js<br/>(Quintic Minimum-Jerk Splines)"]
        WALK_SOLVER["walkSequenceSolver.js<br/>(Discrete Foot Stride Paths)"]
    end

    POOL --> BackgroundCalculations
    BackgroundCalculations -->|Returns Interpolated Pose Arrays| MAIN
```

1. **Virtual hexapod geometry:** Analytically calculates body mounting vertices, center-of-gravity projections, and foot-ground intersection vectors (`VirtualHexapod.js`, `Vector.js`).
2. **Trajectory splines:** Generates smooth Bezier and quintic minimum-jerk keyframe transitions for complex gestures (`interpolation.js`).
3. **Walk path solver:** Dynamically compiles phase offsets, step heights, and hip splay angles for tripod and ripple gaits (`walkSequenceSolver.js`).

---

## 4. Browser-based voice activity detection

The Web UI functions as a distributed smart speaker without requiring third-party audio recording daemons:

```mermaid
flowchart TD
    MIC["User Microphone Stream (Web Audio API)"] --> VAD_ENGINE["Silero ONNX Neural VAD Runtime"]
    
    VAD_ENGINE -->|Speech Segment Detected| BUFFER["Audio Chunk Buffer (16 kHz Float32)"]
    
    BUFFER -->|Speech End Boundary| ENCODER["WAV Audio Encoder (Base64)"]
    
    ENCODER -->|Publishes Audio Event| MQTT_MSG["hexapod/{id}/ai Topic"]
    
    MQTT_MSG --> PI_AI["Pi-Hub AI Ingress (Vosk / Whisper STT)"]
```

* **Zero-cloud audio preprocessing:** Speech boundary detection executes 100% locally in the browser utilizing `@ricky0123/vad-web` and an optimized WebAssembly/ONNX runtime.
* **Bandwidth optimization:** Audio transmits over WebSockets only when active speech is validated, eliminating continuous microphone streaming overhead.

---

## 5. Core interface modules and capabilities

| Module name | Source files | Functional capabilities |
| :--- | :--- | :--- |
| **Dual-stage viewport** | `src/components/viewport/` | Split-screen container hosting WebGL 3D model alongside live ESP32-CAM MJPEG stream. |
| **Inverse kinematics tuner** | `src/components/pages/PageIK.js` | Direct manipulation of body translation $(t_x, t_y, t_z)$ and Euler rotation $(\phi, \theta, \psi)$. |
| **Gait selector and sequencer** | `src/components/pages/PageGait.js` | Modulates step height, stride velocity $(V_x, V_y)$, turning rate $\omega$, and gait duty cycles. |
| **AI copilot terminal** | `src/components/ai/AiChatModal.js` | Visualizes real-time LLM reasoning chains, tokens-per-second metrics, and active skills. |
| **Long-term memory manager** | `src/components/hub/MemoryManager.js` | Interface for inspecting and mutating stored contextual facts in `memory_pool.json`. |

---

## 6. Local development and build workflow

```bash
# 1. Enter web UI directory and install dependencies
cd spiderbot-mithi-web
npm install

# 2. Build Tailwind CSS stylesheet assets
npm run tailwind:build

# 3. Start local development server (React 16.13)
npm start

# 4. Compile optimized production static build
npm run build
```