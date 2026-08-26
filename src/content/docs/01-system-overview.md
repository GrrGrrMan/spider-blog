---
title: "System Topology & Multi-Tier Architecture"
description: "Distributed compute hierarchy, network interconnects, and high-level hardware block diagram."
section: "01 System Overview"
order: 1
badge: "Core"
---

The **Hexapod V2** platform decouples high-frequency deterministic motion control, digital audio digital-to-analog conversion, real-time video streaming, and cognitive multimodal artificial intelligence across three distinct compute tiers.

## Multi-Tier Distributed Architecture

```mermaid
flowchart TD
    subgraph Tier1 ["1. CLIENT TIER"]
        UI["React / Plotly 3D Web Dashboard & Mobile UI<br/>(HTTPS / WSS Ingress via Reverse Proxy Nginx)"]
    end

    subgraph Tier2 ["2. GATEWAY & COGNITIVE TIER (Pi-Hub Host)"]
        direction TB
        PI_HOST["Raspberry Pi 4B Host Gateway (4GB/8GB RAM)"]
        MQTT["Mosquitto MQTT Broker<br/>(TCP 1883 / WS 9001)"]
        AI_SVC["Hexapod AI Service<br/>• faster-whisper STT<br/>• piper-tts / Cloud TTS<br/>• Embodied Task Planner<br/>• OmniRoute LLM Proxy (:20128)"]
        CAM_RELAY["Camera Relay Service<br/>(Asyncio 1-to-N Fanout :8088)"]
        
        PI_HOST --- MQTT
        MQTT <--> AI_SVC
        AI_SVC <--> CAM_RELAY
    end

    subgraph Tier3 ["3. EMBEDDED DUAL-NODE CONTROLLERS"]
        direction LR
        subgraph S3_Box ["Motion Controller (s3-main)"]
            S3["ESP32-S3-DevKitC-1-N16R8<br/>• Core 0: Network, Telemetry, Audio DMA<br/>• Core 1: 100Hz Hard RTOS IK Loop<br/>• MAX98357A I2S Class-D Amp (3W Speaker)"]
        end
        subgraph CAM_Box ["Vision Node (cam-main)"]
            CAM["AI-Thinker ESP32-CAM<br/>• OV2640 2MP Image Sensor<br/>• Non-blocking MJPEG Stream Host (:81)<br/>• 5 kHz PWM Flashlight LED (GPIO 4)"]
        end
    end

    subgraph Tier4 ["4. 18-DOF ACTUATION MATRIX"]
        direction LR
        PCA0["PCA9685 Board 0 (0x40)<br/>Right Legs (RF, RM, RR)"]
        PCA1["PCA9685 Board 1 (0x41)<br/>Left Legs (LR, LM, LF)"]
        SERVOS["18x Metal-Gear Micro Servos<br/>(Regulated 5.30V DC / 8A Rail)"]
        PCA0 --- SERVOS
        PCA1 --- SERVOS
    end

    Tier1 -->|Port 80 / 443 / 9001 WS| Tier2
    MQTT -->|20 Hz Motion Leases & Binary Audio| S3_Box
    CAM_RELAY -->|HTTP MJPEG Pull :81| CAM_Box
    S3_Box -->|I2C Fast-Mode 400 kHz| Tier4
```

## Inter-Tier Communication Matrix

| Source Node | Target Node | Physical / Network Layer | Payload Type & Frequency |
| :--- | :--- | :--- | :--- |
| **Client Web UI** | **Pi-Hub (Nginx)** | TCP 80 / 443 (WSS) | React SPA Assets & WebSockets |
| **Client Web UI** | **Pi-Hub (Mosquitto)** | WebSocket Port 9001 | Ingress Teleoperation & AI Chat Directives |
| **Client Web UI** | **Pi-Hub (Cam Relay)** | HTTP Port 8088 | Multipart MJPEG Broadcast Stream |
| **Pi-Hub (ai-service)** | **ESP32-S3 (s3-main)** | MQTT TCP Port 1883 | 22.05 kHz 10-byte Framed Raw PCM Stream |
| **Pi-Hub (ai-service)** | **ESP32-S3 (s3-main)** | MQTT TCP Port 1883 | 20 Hz Command Leases (`hexapod/{id}/cmd`) |
| **ESP32-S3 (s3-main)** | **Pi-Hub (Mosquitto)** | MQTT TCP Port 1883 | 10 Hz Telemetry & Operational State |
| **ESP32-CAM (cam-main)** | **Pi-Hub (Cam Relay)** | HTTP Port 81 (`/stream`) | 10–15 FPS Raw MJPEG Ingest |
| **ESP32-CAM (cam-main)** | **Pi-Hub (Mosquitto)** | MQTT TCP Port 1883 | 1 Hz Discovery & Camera Heartbeat |
| **ESP32-S3 (s3-main)** | **Dual PCA9685** | I2C (GPIO 41 / GPIO 42) | 400 kHz 12-Bit Staggered PWM Pulse Writes |
| **ESP32-S3 (s3-main)** | **MAX98357A Amp** | I2S (GPIO 38 / 39 / 40) | 705.6 kHz BCLK DMA Mono Audio Stream |

## Diátaxis System Framework

```mermaid
flowchart TD
    subgraph Practical ["PRACTICAL EXPERIENCE"]
        direction LR
        TUT["TUTORIALS<br/>• Step-by-Step Hardware Build<br/>• ESP32 Firmware Flashing<br/>• Pi-Hub Clean OS Setup"]
        HOW["HOW-TO GUIDES<br/>• 5.30V Power Rail Tuning<br/>• Zero-Wrap Phase Staggering<br/>• Audio Prebuffer Configuration"]
    end

    subgraph Theoretical ["THEORETICAL KNOWLEDGE"]
        direction LR
        REF["REFERENCE<br/>• Complete Bill of Materials (BOM)<br/>• ESP32 & FreeRTOS Pinout Matrix<br/>• MQTT Topic & Binary Audio Protocols"]
        EXP["EXPLANATION<br/>• 3-DOF Analytical Inverse Kinematics<br/>• FreeRTOS Dual-Core SMP Allocation<br/>• 1.31kg Mass vs Actuation Torque Physics"]
    end

    TUT --- HOW
    REF --- EXP
    Practical --- Theoretical
```

1. **Tutorials (Learning-Oriented):** Step-by-step assembly, flashing workflows, and gateway deployment guides.
2. **How-To Guides (Problem-Oriented):** Tuning 5.30V buck regulators, eliminating current ripple via phase staggering, and configuring low-latency audio prebuffering.
3. **Reference (Information-Oriented):** Exact hardware pinout matrices, Bill of Materials with MPNs, MQTT JSON/Binary contracts, and register addresses.
4. **Explanation (Understanding-Oriented):** Analytical Inverse Kinematics derivation, 6-DOF Euler pose transformations, and mass-versus-torque mechanical physics.