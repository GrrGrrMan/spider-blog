export interface LogEntry {
  date: string;
  tag: string;
  tagType: "research" | "build" | "fail" | "success" | "ai";
  title: string;
  desc: string;
}

export const LOGBOOK_ENTRIES: LogEntry[] = [
  {
    date: "30/04/26",
    tag: "RESEARCH",
    tagType: "research",
    title: "Initial Research on Spider Locomotion",
    desc: "Investigated multi-legged biological kinematics. Selected a 6-legged (hexapod) configuration to ensure static stability via a continuous 3-legged ground support triangle during locomotion."
  },
  {
    date: "01/05/26",
    tag: "PARTS",
    tagType: "build",
    title: "First Physical Material Order Placed",
    desc: "Procured first evaluation hardware batch: TowerPro micro servos, PCA9685 I2C driver boards, and acrylic stock sheets for preliminary laser-cut prototyping."
  },
  {
    date: "08/05/26",
    tag: "TEST",
    tagType: "fail",
    title: "First Acrylic Leg Test & Joint Failure",
    desc: "Fabricated acrylic leg links with adhesive joints. Under active servo torque, acrylic exhibited extreme structural deflection and glue joints fractured. Confirmed acrylic is inadequate for load-bearing leg linkages."
  },
  {
    date: "09/05/26",
    tag: "BUILD",
    tagType: "build",
    title: "Full Acrylic Chassis Mockup Assembled",
    desc: "Cut 6 acrylic legs and flat hexagonal baseplate to evaluate geometric proportions. Confirmed custom additive manufacturing in high-impact filament is mandatory."
  },
  {
    date: "12/05/26",
    tag: "CAD",
    tagType: "build",
    title: "Migration to Onshape 3D CAD & PETG Filament",
    desc: "Transitioned to parametric 3D CAD in Onshape. Designed lightweight, high-torsion link brackets optimized for 35% Gyroid infill PETG printing."
  },
  {
    date: "23/05/26",
    tag: "CODE",
    tagType: "research",
    title: "Direct Joint Angle Actuation Code",
    desc: "Authored initial firmware setting direct servo PWM angles. Proved that manually managing 18 independent joint angles is completely intractable for coordinated movement."
  },
  {
    date: "28/05/26",
    tag: "CAM",
    tagType: "build",
    title: "3D Printed Vision Camera Head Mount",
    desc: "Designed and printed front cranial mount securing an AI-Thinker ESP32-CAM module for real-time MJPEG video acquisition."
  },
  {
    date: "04/06/26",
    tag: "HARDWARE",
    tagType: "build",
    title: "Dual Microcontroller Upgrade (ESP32-S3)",
    desc: "ESP32-CAM single SoC bottlenecked under concurrent video encoding and servo PWM math. Added dedicated ESP32-S3-DevKitC-1 node for deterministic motion control."
  },
  {
    date: "09/06/26",
    tag: "FAILURE",
    tagType: "fail",
    title: "Battery Inrush & Circuit Burnout",
    desc: "Connected 4x 18650 Li-ion cells in series-parallel. Massive electrical inrush vaporized an input resistor on the PCA9685 board, destroying 3 servos. Added fast-acting fusing and dedicated step-down buck regulators."
  },
  {
    date: "11/06/26",
    tag: "WEIGHT",
    tagType: "fail",
    title: "18650 Battery Pack Exceeded Payload Limits",
    desc: "Determined that carrying 4x 18650 cells overloaded the budget micro-gear servos, stalling femur joints during stance transitions."
  },
  {
    date: "16/06/26",
    tag: "MATH",
    tagType: "research",
    title: "Analytical 3-DOF Inverse Kinematics Derivation",
    desc: "Formulated geometric Inverse Kinematics equations to calculate Coxa, Femur, and Tibia joint angles analytically from target Cartesian foot coordinates $(x,y,z)$."
  },
  {
    date: "20/06/26",
    tag: "CODE",
    tagType: "success",
    title: "IK Motion Engine v2.0 Deployed",
    desc: "Validated the C++ IK solver on ESP32-S3. Sending single 3D vector coordinates smoothly coordinates all 3 leg revolute joints simultaneously."
  },
  {
    date: "30/06/26",
    tag: "SENSORS",
    tagType: "build",
    title: "Multi-Sensor Environmental Suite Added",
    desc: "Integrated HC-SR04 ultrasonic rangefinder, MPU6050 6-axis IMU for attitude detection, and IR obstacle proximity sensors."
  },
  {
    date: "13/07/26",
    tag: "CHASSIS",
    tagType: "build",
    title: "Enclosed Monocoque Body Chassis 2.0",
    desc: "Replaced flat prototype plates with fully enclosed 3D monocoque body shell featuring internal wire ducts, Pi 4 mounts, and buck regulator bays."
  },
  {
    date: "14/07/26",
    tag: "BRAIN",
    tagType: "build",
    title: "Raspberry Pi 4 Host SBC Integration",
    desc: "Integrated Raspberry Pi 4B as the primary gateway, orchestrating Wi-Fi hotspot access, MQTT message brokering, and LLM voice services."
  },
  {
    date: "19/07/26",
    tag: "POWER",
    tagType: "success",
    title: "5.30V Regulated Power Rail Tuning",
    desc: "Calibrated dual XL4015 buck regulators to 5.30V DC output, providing optimal micro-servo torque margins without exceeding thermal limits."
  },
  {
    date: "26/07/26",
    tag: "AI",
    tagType: "ai",
    title: "Cloud Voice AI Engine (Groq / Llama 3.3)",
    desc: "Connected Groq Llama 3.3 LLM and faster-whisper STT. Natural language voice queries compile directly into structured JSON kinematic command streams."
  },
  {
    date: "03/08/26",
    tag: "STAND",
    tagType: "fail",
    title: "Total Mass Limit (1.31kg) & DTC Stand Presentation",
    desc: "Fully integrated payload reached 1,310g ($4.15\\text{ kg}\\cdot\\text{cm}$ torque demand vs $1.8\\text{ kg}\\cdot\\text{cm}$ continuous rating). Designed custom DTC testing stand with external 5.3V bench power for safe physical demonstration."
  },
  {
    date: "09/08/26",
    tag: "AUDIO",
    tagType: "build",
    title: "MAX98357A I2S Audio Feedback Subsystem",
    desc: "Wired MAX98357A Class-D amplifier and 40mm speaker to ESP32-S3. Firmware streams 22.05kHz 16-bit mono speech audio directly via MQTT binary packets."
  },
  {
    date: "14/08/26",
    tag: "UI",
    tagType: "success",
    title: "Real-Time React & Plotly 3D Web Dashboard",
    desc: "Completed browser dashboard rendering a 3D WebGL twin of the hexapod synchronized with physical servo positions over WebSocket telemetry @ 10Hz."
  },
  {
    date: "15/08/26",
    tag: "VISION",
    tagType: "ai",
    title: "VLM Visual Grounding & Scene Analysis",
    desc: "Enabled embodied vision inspection. Pi-Hub captures snapshots from `/snapshot` endpoint to ground LLM reasoning in physical camera observations."
  },
  {
    date: "20/08/26",
    tag: "RELEASE",
    tagType: "success",
    title: "Final Build Polish & Open-Source Release",
    desc: "Finalized wire harnesses, validated PlatformIO build pipelines, and open-sourced all CAD, firmware, gateway, and UI repositories for Science Fair 2026."
  }
];