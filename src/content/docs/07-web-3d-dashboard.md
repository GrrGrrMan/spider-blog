---
title: "React & Plotly 3D Web Simulator"
description: "Browser-based WebGL kinematics digital twin, Web Worker offloading, and WebSocket MQTT telemetry."
section: "06 Simulation & Web"
order: 7
---

The **Web UI** serves as the primary human-machine interface (HMI) and virtual kinematics simulator for the Hexapod V2 platform. Built with React and Plotly.js, it synchronizes physical hardware telemetry with an interactive 3D digital twin over WebSockets.

## Frontend Architecture Topology

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

## Real-Time Teleoperation & 3D State Synchronization

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

## Background Motion Offloading & Worker Pool

To prevent the browser main UI thread from dropping frames during intensive trigonometric calculations, heavy choreographies are delegated to dedicated Web Workers:

```mermaid
flowchart LR
    MAIN["React Main Thread<br/>(User Input & DOM Updates)"] -->|Dispatches Action Payload| POOL["Web Worker Pool (workerPool.js)"]
    
    subgraph BackgroundCalculations ["Parallel Background Execution"]
        IK_CALC["VirtualHexapod.js & Linkage.js<br/>(6-DOF Body Orientation Matrices)"]
        EASING_CALC["interpolation.js<br/>(Quintic Minimum-Jerk Splines)"]
        WALK_SOLVER["walkSequenceSolver.js<br/>(Discrete Foot Stride Paths)"]
    end

    POOL --> BackgroundCalculations
    BackgroundCalculations -->|Returns Interpolated Pose Arrays| MAIN
```

1. **Virtual Hexapod Geometry:** Analytically calculates body mounting vertices, center-of-gravity projections, and foot-ground intersection vectors (`VirtualHexapod.js`, `Vector.js`).
2. **Trajectory Splines:** Generates smooth Bezier and quintic minimum-jerk keyframe transitions for complex gestures (e.g., wave, push-ups, dance) (`interpolation.js`).
3. **Walk Path Solver:** Dynamically compiles phase offsets, step heights, and hip splay angles for tripod and ripple gaits (`walkSequenceSolver.js`).

---

## Browser-Based Voice Activity Detection (VAD)

The Web UI functions as a distributed smart speaker without requiring third-party audio recording daemons:

```mermaid
flowchart TD
    MIC["User Microphone Stream (Web Audio API)"] --> VAD_ENGINE["Silero ONNX Neural VAD Runtime"]
    
    VAD_ENGINE -->|Speech Segment Detected| BUFFER["Audio Chunk Buffer (16 kHz Float32)"]
    
    BUFFER -->|Speech End Boundary| ENCODER["WAV Audio Encoder (Base64)"]
    
    ENCODER -->|Publishes Audio Event| MQTT_MSG["hexapod/{id}/ai Topic"]
    
    MQTT_MSG --> PI_AI["Pi-Hub AI Ingress (Whisper STT)"]
```

* **Zero-Cloud Audio Preprocessing:** Speech boundary detection executes 100% locally in the browser utilizing `@ricky0123/vad-web` and an optimized WebAssembly/ONNX runtime.
* **Bandwidth Optimization:** Audio transmits over WebSockets only when active speech is validated, eliminating continuous microphone streaming overhead.

---

## Core UI Modules & Capabilities

| Module Name | Source Files | Functional Capabilities |
| :--- | :--- | :--- |
| **Dual-Stage Viewport** | `src/components/viewport/` | Split-screen container hosting WebGL 3D model alongside live ESP32-CAM MJPEG stream. |
| **Inverse Kinematics Tuner** | `src/components/pages/PageIK.js` | Direct manipulation of body translation $(t_x, t_y, t_z)$ and Euler rotation $(\phi, \theta, \psi)$. |
| **Gait Selector & Sequencer** | `src/components/pages/PageGait.js` | Modulates step height, stride velocity $(V_x, V_y)$, turning rate $\omega$, and gait duty cycles. |
| **AI Copilot Terminal** | `src/components/ai/AiChatModal.js` | Visualizes real-time LLM reasoning chains, tokens-per-second metrics, and active skills. |
| **Long-Term Memory Manager** | `src/components/hub/MemoryManager.js` | Interface for inspecting and pruning stored contextual facts in `memory_pool.json`. |

---

## Frontend Setup & Development

```bash
# 1. Enter web UI directory and install dependencies
cd spiderbot-mithi-web
npm install

# 2. Start local development server (React 16.13)
npm start

# 3. Compile optimized production static build
npm run build
```