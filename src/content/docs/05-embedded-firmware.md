---
title: "Embedded Firmware & Kinematic Control Engine"
description: "FreeRTOS SMP dual-core task allocation, analytical 3-DOF IK math, gait generator, and safety watchdog."
section: "04 Embedded Firmware"
order: 5
badge: "100Hz"
---

The embedded firmware runs on an **ESP32-S3** microcontroller, leveraging FreeRTOS Symmetric Multiprocessing (SMP) to isolate high-frequency kinematics calculations from network and audio DMA tasks.

## FreeRTOS Dual-Core SMP Task Partitioning

```mermaid
flowchart TD
    subgraph ESP32S3 ["ESP32-S3 DUAL-CORE SMP PROCESSOR"]
        subgraph Core0 ["Core 0: Network Ingress, Audio DMA & Host Comms"]
            TASK_NET["TaskNetwork (Priority 2, 8KB Stack)<br/>• WiFiMulti Auto-Reconnect Engine<br/>• MQTT Ingress & 10 Hz Telemetry Loop<br/>• Non-blocking LogSink Drainer (UART)<br/>• Binary Audio 10-byte Frame Ingestion"]
            TASK_AUDIO["TaskAudio (Priority 1, 8KB Stack)<br/>• 512KB PSRAM RingBuffer Reader<br/>• 16,384-byte Prebuffer Threshold<br/>• Q15 Fixed-Point Volume Scaler<br/>• I2S Direct Memory Access (DMA) Writes"]
        end

        subgraph Core1 ["Core 1: Deterministic Real-Time Control"]
            TASK_CTRL["TaskControl (Priority 3, 4KB Stack)<br/>• Hard RTOS vTaskDelayUntil (100 Hz / 10ms)<br/>• Analytical 3-DOF Inverse Kinematics<br/>• 6-DOF Body Pose Transformation<br/>• Omnidirectional Gait Engine<br/>• SequencePoser Keyframe Interpolator<br/>• Two-Stage Safety Watchdog<br/>• Dual PCA9685 Burst I2C Writes (400 kHz)"]
        end
    end

    PSRAM["512KB PSRAM Audio RingBuffer"]
    I2S_HW["MAX98357A I2S DMA Buffer"]
    I2C_HW["Dual PCA9685 PWM Registers"]

    TASK_NET -->|Pushes PCM Audio Chunks| PSRAM
    PSRAM -->|Streams Buffered Audio| TASK_AUDIO
    TASK_AUDIO -->|Writes DMA Registers| I2S_HW
    TASK_CTRL -->|Executes 100 Hz Loop| I2C_HW
```

### Core Isolation & Mutex Guarantees
* **Non-Blocking Control Loop:** `TaskControl` on Core 1 executes deterministically every $10.0\text{ ms}$ without preemption from Wi-Fi interrupts. Non-blocking logging pushes string pointers to a bounded FreeRTOS queue (`xQueueSend(..., 0)`). If the queue fills, logs drop silently without delaying the motion loop.
* **I2C Bus Mutex:** All register writes to the dual PCA9685 controllers are protected by `m_i2cMutex` with a $25\text{ ms}$ hardware timeout to prevent deadlocks from electrical noise.

---

## Analytical 3-DOF Inverse Kinematics

Each leg operates as an open kinematic chain with three revolute joints: Coxa ($\alpha$, hip pan), Femur ($\beta$, thigh lift), and Tibia ($\gamma$, knee reach).

```mermaid
flowchart LR
    HIP["Body Center (Mount Point M_i)"] -->|L1: 52mm| COXA["Coxa Joint (α: Hip Pan)"]
    COXA -->|L2: 66mm| FEMUR["Femur Joint (β: Thigh Lift)"]
    FEMUR -->|L3: 132mm| TIBIA["Tibia Joint (γ: Knee Reach)"]
    TIBIA --> FOOT["Target Foot Tip (X, Y, Z)"]
```

### Mathematical Kinematic Proof

Given a target Cartesian coordinate $(x, y, z)$ in the local frame of hip mounting point $M_i$:

1. **Coxa Angle ($\alpha$):**

$$
\alpha = \operatorname{atan2}(y, x) \cdot \left(\frac{180^\circ}{\pi}\right)
$$

2. **Planar Projection and Reach Vector ($D$):**

$$
\begin{aligned}
d_{\text{planar}} &= \sqrt{x^2 + y^2} - L_1 \\
D &= \sqrt{d_{\text{planar}}^2 + z^2}
\end{aligned}
$$

3. **Reachability Boundary Clamping:**

$$
D_{\text{clamped}} = \max\Big(\min\big(D, (L_2 + L_3) - 0.1\big), |L_2 - L_3| + 0.1\Big)
$$

4. **Femur Angle ($\beta$):**

$$
\begin{aligned}
\alpha_1 &= \operatorname{atan2}(-z, d_{\text{planar}}) \\
\alpha_2 &= \arccos\left(\frac{L_2^2 + D_{\text{clamped}}^2 - L_3^2}{2 \cdot L_2 \cdot D_{\text{clamped}}}\right) \\
\beta &= (\alpha_1 - \alpha_2) \cdot \left(\frac{180^\circ}{\pi}\right)
\end{aligned}
$$

5. **Tibia Angle ($\gamma$):**

$$
\begin{aligned}
\beta_{\text{joint}} &= \arccos\left(\frac{L_2^2 + L_3^2 - D_{\text{clamped}}^2}{2 \cdot L_2 \cdot L_3}\right) \\
\gamma &= \left((\pi - \beta_{\text{joint}}) \cdot \left(\frac{180^\circ}{\pi}\right)\right) - 90^\circ
\end{aligned}
$$

---

## 6-DOF Body Pose Transformation

To apply rigid body translations $(\Delta x, \Delta y, \Delta z)$ and Tait-Bryan Euler rotations $(\text{Roll } \phi, \text{Pitch } \theta, \text{Yaw } \psi)$ relative to ground contact points, coordinates transform through forward and inverse mounting orientations.

For leg $i \in \{0 \dots 5\}$ with physical mounting offset $\mathbf{M}_i = [M_{x,i}, M_{y,i}, M_{z,i}]^T$ and mounting angle $\theta_{m,i}$:

1. **Foot Position in Body Coordinate Frame:**

$$
\mathbf{P}_{\text{body}, i} = \mathbf{M}_i + \mathbf{R}_z(\theta_{m,i}) \cdot \mathbf{P}_{\text{local}, i}
$$

2. **Inverse Rigid Body Transformation:**

$$
\mathbf{P}_{\text{transformed}, i} = \mathbf{R}_z(-\psi) \mathbf{R}_y(-\theta) \mathbf{R}_x(-\phi) \cdot (\mathbf{P}_{\text{body}, i} - \mathbf{T}_{\text{body}})
$$

Where $\mathbf{T}_{\text{body}} = [\Delta x, \Delta y, \Delta z]^T$.

3. **Local Leg Frame Projection for Inverse Kinematics:**

$$
\mathbf{P}_{\text{leg\_ik}, i} = \mathbf{R}_z(-\theta_{m,i}) \cdot (\mathbf{P}_{\text{transformed}, i} - \mathbf{M}_i)
$$

Where the principal rotation matrices are defined as:

$$
\begin{aligned}
\mathbf{R}_x(\phi) &= \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\phi & -\sin\phi \\ 0 & \sin\phi & \cos\phi \end{bmatrix} \\
\mathbf{R}_y(\theta) &= \begin{bmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{bmatrix} \\
\mathbf{R}_z(\psi) &= \begin{bmatrix} \cos\psi & -\sin\psi & 0 \\ \sin\psi & \cos\psi & 0 \\ 0 & 0 & 1 \end{bmatrix}
\end{aligned}
$$

---

## Omnidirectional Gait Generation Engine

The `GaitGenerator` modulates a normalized phase accumulator $\Phi \in [0.0, 1.0)$ driven by cycle time $T_{\text{cycle}}$:

$$
\Phi(t + \Delta t) = \left(\Phi(t) + \frac{\Delta t}{T_{\text{cycle}}}\right) \bmod 1.0
$$

```mermaid
flowchart TD
    PHASE["Continuous Phase Clock: Φ(t + dt) = (Φ(t) + dt / T_cycle) mod 1.0"]
    
    subgraph Gaits ["Gait Phase Offset Distributions"]
        TRIPOD["Tripod Gait (2-Phase, σ = 0.5)<br/>Offsets: [0.0, 0.5, 0.5, 0.0, 0.0, 0.5]"]
        RIPPLE["Ripple Gait (6-Phase, σ = 0.333)<br/>Offsets: [0.0, 0.667, 0.333, 0.5, 0.167, 0.833]"]
        WAVE["Wave Gait (6-Phase, σ = 0.167)<br/>Offsets: [0.0, 0.167, 0.333, 0.5, 0.667, 0.833]"]
    end

    subgraph Trajectory ["Trajectory Synthesis for Leg Phase ϕ_i"]
        SWING["Swing Phase (ϕ_i < σ, Foot in Flight)<br/>Z = Z_base + sin(π · τ) · H_step"]
        STANCE["Stance Phase (ϕ_i ≥ σ, Ground Propulsion)<br/>Z = Z_base"]
    end

    PHASE --> Gaits
    Gaits --> Trajectory
```

### Foot Trajectory Equations

For leg phase $\phi_i = (\Phi + \text{Offset}_i) \bmod 1.0$:

* **Swing Phase ($\phi_i < \sigma$, Foot in Flight):**

$$
\begin{aligned}
\tau &= \frac{\phi_i}{\sigma} \\
X_{\text{local}}(\tau) &= X_{\text{base}} - L_x + 2 L_x \tau \\
Y_{\text{local}}(\tau) &= Y_{\text{base}} - L_y + 2 L_y \tau \\
Z_{\text{local}}(\tau) &= Z_{\text{base}} + \sin(\pi \tau) \cdot H_{\text{step}}
\end{aligned}
$$

* **Stance Phase ($\phi_i \ge \sigma$, Ground Propulsion):**

$$
\begin{aligned}
\tau &= \frac{\phi_i - \sigma}{1.0 - \sigma} \\
X_{\text{local}}(\tau) &= X_{\text{base}} + L_x - 2 L_x \tau \\
Y_{\text{local}}(\tau) &= Y_{\text{base}} + L_y - 2 L_y \tau \\
Z_{\text{local}}(\tau) &= Z_{\text{base}}
\end{aligned}
$$

Where ground stride vectors incorporate turning angular rate $\omega$:

$$
\begin{aligned}
L_x &= \frac{1}{2} \left(V_x (1 - \sigma) T_{\text{cycle}} - Y_{\text{world}} \cdot \omega_{\text{rad}}\right) \\
L_y &= \frac{1}{2} \left(V_y (1 - \sigma) T_{\text{cycle}} + X_{\text{world}} \cdot \omega_{\text{rad}}\right)
\end{aligned}
$$

---

## Trajectory Interpolation & Easing Curves

The `SequencePoser` dynamically transitions between poses using analytical easing functions:

| Easing Identifier | Mathematical Formula $s(\tau), \quad \tau \in [0.0, 1.0]$ | Dynamic Motion Characteristics |
| :--- | :--- | :--- |
| `LINEAR` | $s(\tau) = \tau$ | Constant velocity; discontinuous acceleration. |
| `EASE_IN_OUT_QUAD` | $s(\tau) = 2\tau^2 \ (\tau < 0.5) \text{ or } 1 - \frac{(-2\tau + 2)^2}{2} \ (\tau \ge 0.5)$ | Quadratic acceleration and deceleration. |
| `EASE_IN_OUT_CUBIC` | $s(\tau) = 4\tau^3 \ (\tau < 0.5) \text{ or } 1 - \frac{(-2\tau + 2)^3}{2} \ (\tau \ge 0.5)$ | **Standard:** Smooth S-curve transition profile. |
| `EASE_IN_OUT_SINE` | $s(\tau) = -\frac{1}{2} (\cos(\pi\tau) - 1)$ | Harmonic sinusoidal profile for periodic gestures. |
| `MINIMUM_JERK` | $s(\tau) = 10\tau^3 - 15\tau^4 + 6\tau^5$ | **Quintic Polynomial:** Zero boundary jerk ($\dot{s}=\ddot{s}=0$), preventing chassis resonance. |

---

## Multi-Stage Safety Watchdog State Machine

```mermaid
stateDiagram-v2
    [*] --> BootReset : Power On / ESP32-S3 Reset
    
    state BootReset {
        OE_HIGH : Output Enable (OE) = HIGH (GPIO 13)
        LIMP : Servos in Limp State (0 mA Draw)
    }

    BootReset --> SoftStartRamp : Network Connected & Motion Command Received
    
    state SoftStartRamp {
        RAMP : Slew Rate Ramps from 30°/s to 180°/s
        DUR : Duration = 1.0 Second
    }

    SoftStartRamp --> NormalOperation : Ramp Complete
    
    state NormalOperation {
        IK_LOOP : Full-Speed 100 Hz IK Loop
        BURST : Staggered PCA9685 PWM Writes
    }

    NormalOperation --> VelocityBrake : Inactivity > 3000ms
    NormalOperation --> HardwareLimp : Inactivity > 15000ms

    state VelocityBrake {
        BRAKE : Velocity Clamped to 0
        STANCE : Robot Holds Neutral Stance
        FLAG : watchdog_braked = true
    }

    state HardwareLimp {
        LIMP_OE : OE Pulled HIGH (GPIO 13)
        POWERDOWN : Servos Powered Down (0 mA)
        AUDIO_ACTIVE : Audio Subsystem Remains Awake
    }

    VelocityBrake --> NormalOperation : Motion Command Received
    HardwareLimp --> SoftStartRamp : Motion Command Received
```

---

## PlatformIO Build & Flashing

```bash
# Compile and flash ESP32-S3 Motion & Audio Controller
cd firmware/s3-main
pio run -e esp32s3 --target upload
pio device monitor -b 115200

# Compile and flash ESP32-CAM Vision & Sensor Node
cd firmware/cam-main
pio run -e esp32cam --target upload
pio device monitor -b 115200
```