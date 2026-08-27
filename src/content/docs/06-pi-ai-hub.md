---
title: "Host gateway and voice AI engine"
description: "Raspberry Pi 4 network orchestrator, Faster-Whisper ASR, Piper TTS, multimodal agent contracts, and binary audio streaming."
section: "05 Host AI gateway"
order: 6
badge: "LLM"
---

The **Pi-Hub** executes on a Raspberry Pi 4B (or Linux host), coordinating local speech recognition, cloud vision-language models, dynamic camera relays, and low-latency binary audio streaming.

## 1. Cognitive pipeline and multimodal agent workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as Web-UI Client
    participant MQTT as Mosquitto Broker (:1883 / :9001)
    participant AI as Hexapod AI Service
    participant CAM_RELAY as Camera Relay (:8088)
    participant OMNI as OmniRoute Gateway (Llama 3.3)
    participant S3 as ESP32-S3 Controller

    User->>UI: Speak Command ("Walk forward and wave")
    UI->>MQTT: Publish hexapod/{id}/ai (Audio/Text)
    MQTT->>AI: Dispatch Payload
    AI->>AI: Speech-to-Text (Faster-Whisper int8)

    opt Visual Scene Grounding
        AI->>CAM_RELAY: GET /snapshot
        CAM_RELAY-->>AI: Cached JPEG Frame
    end

    AI->>OMNI: POST /v1/chat/completions (Prompt + Frame + Memory)
    OMNI-->>AI: Tool Calls / JSON Kinematic Plan & Spoken Text

    par Concurrent Audio Streaming
        AI->>MQTT: Stream 22.05kHz Binary Frames (hexapod/{id}/audio)
        MQTT->>S3: Forward Raw PCM Chunks
        S3-->>User: Acoustic Speech Output (I2S DAC)
    and Concurrent Motion Execution
        AI->>MQTT: Stream 20Hz Motion Leases (hexapod/{id}/cmd)
        MQTT->>S3: Execute Inverse Kinematics Loop
        S3-->>User: Coordinated 18-DoF Movement
    end
```

---

## 2. Network topology and ingress routing

```mermaid
flowchart TD
    WAN["Internet / WAN Uplink (Wi-Fi or Ethernet)"] --> PI["Raspberry Pi 4B (Gateway Host)"]
    
    subgraph PiHubGateway ["Pi-Hub Networking & Ingress"]
        AP["NetworkManager Hotspot AP<br/>SSID: 'spiderlink' (192.168.4.1/24)"]
        NAT["IPv4 Dynamic NAT Masquerade<br/>iptables POSTROUTING"]
        NGINX["Nginx Reverse Proxy<br/>Port 80 / 443 / 9001 WS / 8088 HTTP"]
    end

    PI --> AP
    AP --> NAT
    NAT --> NGINX

    subgraph InternalNodes ["Connected Hardware Nodes"]
        S3_NODE["ESP32-S3 Controller (192.168.4.2)"]
        CAM_NODE["ESP32-CAM Node (192.168.4.3)"]
        CLIENT_NODE["Web Dashboard Client (192.168.4.x)"]
    end

    NGINX <--> S3_NODE
    NGINX <--> CAM_NODE
    NGINX <--> CLIENT_NODE
```

---

## 3. MQTT communication topic taxonomy

```mermaid
flowchart TD
    ROOT["hexapod/"]
    
    subgraph S3_Topics ["ESP32-S3 Controller ('hexapod-s3-01')"]
        S3_CMD["hexapod/{id}/cmd (Inbound: Velocity, Sequences, Leases)"]
        S3_TEL["hexapod/{id}/telemetry (Outbound: 10 Hz State)"]
        S3_CFG["hexapod/{id}/config (Retained: Channel Maps)"]
        S3_AUD["hexapod/{id}/audio (Inbound: 10-byte Framed PCM)"]
        S3_STA["hexapod/{id}/audio/status (Outbound: Audio Buffer State)"]
    end

    subgraph CAM_Topics ["ESP32-CAM Node ('hexapod-cam-01')"]
        CAM_CMD["hexapod/{cam_id}/cmd (Inbound: Presets, Flashlight, FPS)"]
        CAM_TEL["hexapod/{cam_id}/telemetry (Outbound: 1 Hz IP Discovery)"]
    end

    subgraph AI_Topics ["Cognitive Agent Pipeline"]
        AI_CMD["hexapod/{id}/ai/memory/cmd (Memory Updates)"]
        AI_STA["hexapod/{id}/ai/status (Heartbeat & Tool State)"]
    end

    ROOT --> S3_Topics
    ROOT --> CAM_Topics
    ROOT --> AI_Topics
```

---

## 4. Binary audio stream protocol specification

Low-latency speech audio streams from the Raspberry Pi `ai-service` to the ESP32-S3 `TaskAudio` using framed raw PCM packets to eliminate JSON Base64 decode overhead:

| Byte offset | Field identifier | Type | Endianness | Validation criteria |
| :---: | :--- | :--- | :--- | :--- |
| `0x00` | `MAGIC_BYTE` | `uint8_t` | — | Must equal `0xAA` to distinguish from JSON payloads. |
| `0x01` | `ACTION_FLAG` | `uint8_t` | — | `0x00` = Stream Audio Chunk; `0x01` = Abort Active Stream. |
| `0x02..0x05` | `FLOW_ID` | `uint32_t` | Little | Unique pseudo-random stream identifier generated per utterance. |
| `0x06..0x07` | `SEQUENCE_IDX` | `uint16_t` | Little | 0-indexed packet sequence counter ($0 \dots \text{Total}-1$). |
| `0x08..0x09` | `TOTAL_CHUNKS` | `uint16_t` | Little | Total packets in utterance ($0$ denotes unbounded media stream). |
| `0x0A..N` | `PCM_PAYLOAD` | `int16_t[]` | Little | 22,050 Hz Mono 16-bit PCM samples (max 4,096 bytes per chunk). |

### PSRAM ring buffer and jitter management

1. Incoming frames on Core 0 extract the raw PCM slice and push to a 512KB PSRAM `RingBuffer`.
2. `TaskAudio` enforces a **16,384-byte prebuffer threshold** ($\approx 370\text{ ms}$) before triggering the I2S DMA controller, preventing buffer underruns during Wi-Fi latency spikes.
3. Software volume is scaled sample-by-sample using Q15 fixed-point multiplication:

$$
\text{Sample}_{\text{out}} = \frac{\text{Sample}_{\text{in}} \times \text{volQ15}}{32768}, \quad \text{where } \text{volQ15} \in [0, 32767]
$$

---

## 5. Canonical task decomposition JSON contract

```json
{
  "task_title": "Inspect and Wave",
  "thought": "User requested visual inspection followed by greeting. Moving forward, turning flashlight on, capturing frame, and waving.",
  "speech": "Advancing to inspect the target area.",
  "order": "tts_first",
  "camera": {
    "preset": "inspection",
    "flash": 40
  },
  "audio": {
    "volume": 0.5,
    "alarm": "curious"
  },
  "timeline": [
    {
      "type": "gait",
      "id": "walk_forward",
      "duration_ms": 3000,
      "params": { "vx": 45.0, "vy": 0.0, "omega": 0.0, "gait": "tripod", "step_height": 40.0 }
    },
    {
      "type": "gesture",
      "id": "wave",
      "duration_ms": 2200
    }
  ]
}
```

---

## 6. Cognitive tool registry and function calling

| Tool identifier | Parameters | Functional role |
| :--- | :--- | :--- |
| `inspect_scene` | `query: str` | Captures live frame from `/snapshot` to ground multimodal reasoning. |
| `get_weather` | `location: str` | Retrieves live temperature, humidity, and forecast via Open-Meteo API. |
| `web_search` | `query: str` | Performs instant web summaries via DuckDuckGo and Wikipedia APIs. |
| `set_timer` | `duration_seconds: int, label: str` | Sets asynchronous countdown timer with audio alarms upon completion. |
| `cancel_timer` | `label: str` | Cancels an active countdown timer. |
| `play_music` | `query: str` | Streams YouTube/local audio via `yt-dlp` and `ffmpeg` with auto-ducking. |

---

## 7. Dynamic video stream relay and camera control

```mermaid
flowchart LR
    ESP_CAM["ESP32-CAM Node<br/>(OV2640 Sensor)"] -->|HTTP Pull :81/stream| RELAY["Camera Relay Service<br/>(Port 8088 Proxy)"]
    
    RELAY -->|1-to-N MJPEG Stream| WEB["Web-UI Dashboard"]
    RELAY -->|On-Demand /snapshot| VLM["VLM Perception Loop"]
```

### Camera tuning parameter matrix

| Parameter name | Value range / type | Sensor hardware effect |
| :--- | :--- | :--- |
| `preset` | `night_vision`, `inspection`, `stealth`, `low_power`, `default` | Configures flashlight, exposure, gain ceiling, and resolution atomically. |
| `flash` | `0` to `100` (%) | Modulates LEDC Channel 1 duty cycle driving the white LED via GPIO 4. |
| `fps` | `1` to `30` (Hz) | Adjusts capture loop task delay (`framePeriodUs`). |
| `framesize` | `96X96`, `QVGA`, `VGA`, `HD`, `FHD` | Reconfigures sensor active pixel array windowing. |
| `quality` | `0` to `63` | JPEG quantization matrix scaling ($8 = \text{High Detail}$, $12 = \text{Default}$). |
| `crop` | `[startX, startY, width, height]` | Hardware sensor windowing for zero-latency digital zoom. |