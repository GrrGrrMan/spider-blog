# AI Spider Hexapod V2 — Documentation Portal & Technical Index

[![Astro](https://img.shields.io/badge/Astro-v7.2.8-18181b?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-18181b?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Netlify Status](https://api.netlify.com/api/v1/badges/deploy-status?style=flat-square)](https://app.netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181b?style=flat-square)](https://opensource.org/licenses/MIT)
[![Science Fair 2026](https://img.shields.io/badge/Science_Fair-2026_Autonomous_Robotics-0284c7?style=flat-square)](https://github.com/GrrGrrMan/spider-blog)

Central technical documentation and monolith index for the **18-DOF Multimodal AI Spider Hexapod V2**.

---

## Ecosystem Repositories & Subsystems

Access all core subsystems, firmware repositories, CAD files, and live web applications across the AI Spider ecosystem:

| Subsystem / Asset | Repository / Resource URL | Primary Technology Stack | Description |
| :--- | :--- | :--- | :--- |
| **Docs Portal** *(This Repo)* | [`GrrGrrMan/spider-blog`](https://github.com/GrrGrrMan/spider-blog) | Astro 7, Tailwind 4, MDX, KaTeX, Mermaid | Complete scientific documentation, math derivations, and logbook |
| **Motion Firmware** | [`GrrGrrMan/spiderbot-firmware`](https://github.com/GrrGrrMan/spiderbot-firmware) | C++, FreeRTOS SMP, PlatformIO, ESP32-S3 | 100 Hz deterministic IK engine, dual PCA9685, I2S DMA audio |
| **Host AI Gateway** | [`GrrGrrMan/spiderbot-pi-hub`](https://github.com/GrrGrrMan/spiderbot-pi-hub) | Python 3.11, Faster-Whisper, Mosquitto, Nginx | Raspberry Pi 4 gateway, Piper TTS, Llama 3.3 LLM agent proxy |
| **3D Digital Twin** | [`GrrGrrMan/spiderbot-mithi-web`](https://github.com/GrrGrrMan/spiderbot-mithi-web) | React, Plotly.js WebGL, WebSockets, ONNX VAD | Browser kinematics simulator and 10 Hz real-time teleoperation |
| **Live 3D Simulation** | [spiderbot-playground.netlify.app](https://spiderbot-playground.netlify.app/) | WebGL / React Production Deployment | Interactive online kinematics sandbox and digital twin |
| **Onshape 3D CAD** | [Enclosed Body 2.0 CAD Model](https://cad.onshape.com/documents/97670e8943e0cc50e830c42a/w/00e0069e98a6590d172338eb/e/8904dbdba274489211ded1bf?renderMode=0&uiState=6a8cd46a6dfb0f4caeea9e32) | Onshape Parametric CAD | 3D printable PETG chassis, leg linkages, and electronics bays |

---

## Architecture & Information Design

The documentation portal is built using **Astro v7**, leveraging static site generation (SSG) with client-side view transitions (`<ClientRouter />`), responsive KaTeX LaTeX equation rendering, and custom pan-zoom Mermaid diagramming engines.

### 3-Tier Information Architecture (Diátaxis Framework)

* **Tier 1: Global Context** — Instant Command+K search modal, site navigation pills, and responsive off-canvas drawer navigation.
* **Tier 2: Topic & Chapter Hierarchy** — 7 categorized technical documentation sections spanning kinematics derivations, FreeRTOS pinouts, and empirical torque limits.
* **Tier 3: In-Page Navigation** — Desktop scrollspy rail and mobile sticky *"On this page"* slide-up bottom sheet.