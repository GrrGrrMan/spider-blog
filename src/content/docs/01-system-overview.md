---
title: "System topology and multi-tier architecture"
description: "Distributed compute hierarchy, inter-tier network matrix, hardware isolation guarantees, and Diátaxis documentation structure."
section: "01 System overview"
order: 1
badge: "Core"
---

The **Hexapod V2** platform decouples high-frequency deterministic motion control, digital audio conversion, real-time video streaming, and cognitive intelligence across four distinct compute tiers.

## 1. Multi-tier distributed compute hierarchy

```mermaid
flowchart TD
    subgraph Tier1 ["1. Client Tier (Operator Interface)"]
        UI["React / Plotly 3D Web Dashboard & Mobile UI<br/>(HTTPS / WSS Ingress via Reverse Proxy Nginx)"]
    end

    subgraph Tier2 ["2. Gateway & Cognitive Tier (Pi-Hub Host)"]
        direction TB
        PI_HOST["Raspberry Pi 4B Host Gateway (4GB/8GB RAM)"]
        MQTT["Mosquitto MQTT Broker<br/>(TCP 1883 / WS 9001)"]
        AI_SVC["Hexapod AI Service<br/>• Offline Vosk / Faster-Whisper STT<br/>• Piper Embedded TTS Engine<br/>• Embodied Task Planner & Action Matrix<br/>• OmniRoute LLM Proxy (:20128)"]
        CAM_RELAY["Camera Relay Service<br/>(Asyncio 1-to-N Fanout :8088)"]
        
        PI_HOST --- MQTT
        MQTT <--> AI_SVC
        AI_SVC <--> CAM_RELAY
    end

    subgraph Tier3 ["3. Embedded Dual-Node Controllers"]
        direction LR
        subgraph S3_Box ["Motion Controller (s3-main)"]
            S3["ESP32-S3-DevKitC-1-N16R8<br/>• Core 0: Network, Telemetry, Audio DMA<br/>• Core 1: 100Hz Hard RTOS IK Loop<br/>• MAX98357A I2S Class-D Amp (3W Speaker)"]
        end
        subgraph CAM_Box ["Vision Node (cam-main)"]
            CAM["AI-Thinker ESP32-CAM<br/>• OV2640 2MP Image Sensor<br/>• Non-blocking MJPEG Stream Host (:81)<br/>• 5 kHz PWM Flashlight LED (GPIO 4)"]
        end
    end

    subgraph Tier4 ["4. 18-DoF Actuation Matrix"]
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

---

## 2. Inter-tier communication matrix

| Source node | Target node | Physical / network layer | Payload type & frequency |
| :--- | :--- | :--- | :--- |
| **Client web UI** | **Pi-Hub (Nginx)** | TCP 80 / 443 (WSS) | React SPA assets & WebSockets |
| **Client web UI** | **Pi-Hub (Mosquitto)** | WebSocket Port 9001 | Ingress teleoperation & AI chat directives |
| **Client web UI** | **Pi-Hub (Cam relay)** | HTTP Port 8088 | Multipart MJPEG broadcast stream |
| **Pi-Hub (ai-service)** | **ESP32-S3 (s3-main)** | MQTT TCP Port 1883 | 22.05 kHz 10-byte framed raw PCM stream |
| **Pi-Hub (ai-service)** | **ESP32-S3 (s3-main)** | MQTT TCP Port 1883 | 20 Hz command leases (`hexapod/{id}/cmd`) |
| **ESP32-S3 (s3-main)** | **Pi-Hub (Mosquitto)** | MQTT TCP Port 1883 | 10 Hz telemetry & operational state |
| **ESP32-CAM (cam-main)** | **Pi-Hub (Cam relay)** | HTTP Port 81 (`/stream`) | 10–15 FPS raw MJPEG ingest |
| **ESP32-CAM (cam-main)** | **Pi-Hub (Mosquitto)** | MQTT TCP Port 1883 | 1 Hz discovery & camera heartbeat |
| **ESP32-S3 (s3-main)** | **Dual PCA9685** | I2C (GPIO 41 / GPIO 42) | 400 kHz 12-bit staggered PWM pulse writes |
| **ESP32-S3 (s3-main)** | **MAX98357A DAC** | I2S (GPIO 38 / 39 / 40) | 705.6 kHz BCLK DMA mono audio stream |

---

## 3. Real-time hardware and logic isolation guarantees

```mermaid
flowchart LR
    subgraph PowerIsolation ["Power Domain Isolation"]
        SUPPLY["5.30V / 8A Step-Down Buck"] -->|High-Current Actuation Rail| SERVOS["18x MG90S Servos"]
        USB_LDO["5.0V Logic Rail / AMS1117"] -->|Isolated Low-Noise Supply| MCU["ESP32-S3 & ESP32-CAM"]
    end

    subgraph CoreIsolation ["ESP32-S3 Dual-Core SMP Isolation"]
        C0["Core 0: Asynchronous Tasks<br/>• Wi-Fi / MQTT Ingress<br/>• 22.05 kHz I2S DMA Audio Feed"]
        C1["Core 1: Deterministic Tasks<br/>• 100 Hz Hard RTOS Loop<br/>• 3-DoF Analytical IK Math<br/>• 400 kHz I2C Burst Writes"]
    end
```

1. **Deterministic control loop:** High-frequency inverse kinematics calculations and I2C servo commits run on FreeRTOS Core 1 on a strict $10.0\text{ ms}$ interval (`vTaskDelayUntil`). Wi-Fi interrupts and TCP streaming on Core 0 cannot preempt or delay physical stepping.
2. **Current surge decoupling:** Actuation power is separated from microcontroller logic using dedicated 300W buck regulation and 1000µF reservoir capacitors, preventing inrush brownouts during synchronized gait transitions.

---

## 4. Diátaxis documentation taxonomy

The technical documentation is organized using the **Diátaxis Framework**, structuring technical assets across four core learning and operational modes:

```mermaid
flowchart TD
    subgraph Practical ["Practical Experience"]
        direction LR
        TUT["Tutorials<br/>• Step-by-step hardware build<br/>• ESP32 firmware flashing<br/>• Pi-Hub clean OS setup"]
        HOW["How-To Guides<br/>• 5.30V power rail tuning<br/>• Zero-wrap phase staggering<br/>• Audio prebuffer configuration"]
    end

    subgraph Theoretical ["Theoretical Knowledge"]
        direction LR
        REF["Reference<br/>• Complete bill of materials (BOM)<br/>• ESP32 & FreeRTOS pinout matrix<br/>• MQTT topic & binary audio protocols"]
        EXP["Explanation<br/>• Mission rationale & scope<br/>• 3-DoF analytical inverse kinematics<br/>• 1.31kg mass vs actuator torque physics"]
    end

    TUT --- HOW
    REF --- EXP
    Practical --- Theoretical
```

1. **Tutorials (learning-oriented):** Step-by-step assembly guides, PlatformIO flashing workflows, and gateway deployment scripts.
2. **How-to guides (problem-oriented):** Tuning 5.30V buck regulators, eliminating current ripple via phase staggering, and configuring low-latency audio prebuffering.
3. **Reference (information-oriented):** Exact hardware pinout matrices, Bill of Materials with MPNs, MQTT JSON/Binary contracts, and register addresses.
4. **Explanation (understanding-oriented):** Tactical mission scope, analytical Inverse Kinematics derivations, 6-DoF Euler pose transformations, and mass-versus-torque mechanical physics.