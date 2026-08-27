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
| **Documentation Portal** *(This Repo)* | [`GrrGrrMan/spider-blog`](https://github.com/GrrGrrMan/spider-blog) | Astro 7, Tailwind 4, MDX, KaTeX, Mermaid | Complete scientific documentation, math derivations, and logbook |
| **Motion Firmware** | [`GrrGrrMan/spiderbot-firmware`](https://github.com/GrrGrrMan/spiderbot-firmware) | C++, FreeRTOS SMP, PlatformIO, ESP32-S3 | 100 Hz deterministic IK engine, dual PCA9685, I2S DMA audio |
| **Host AI Gateway** | [`GrrGrrMan/spiderbot-pi-hub`](https://github.com/GrrGrrMan/spiderbot-pi-hub) | Python 3.11, Faster-Whisper, Mosquitto, Nginx | Raspberry Pi 4 gateway, Piper TTS, Llama 3.3 LLM agent proxy |
| **3D Digital Twin** | [`GrrGrrMan/spiderbot-mithi-web`](https://github.com/GrrGrrMan/spiderbot-mithi-web) | React, Plotly.js WebGL, WebSockets, ONNX VAD | Browser kinematics simulator and 10 Hz real-time teleoperation |
| **Live 3D Simulation** | [spiderbot-playground.netlify.app](https://spiderbot-playground.netlify.app/) | WebGL / React Production Deployment | Interactive online kinematics sandbox and digital twin |
| **Onshape 3D CAD** | [Enclosed Body 2.0 CAD Model](https://cad.onshape.com/documents/97670e8943e0cc50e830c42a/w/00e0069e98a6590d172338eb/e/8904dbdba274489211ded1bf?renderMode=0&uiState=6a8cd46a6dfb0f4caeea9e32) | Onshape Parametric CAD | 3D printable PETG chassis, leg linkages, and electronics bays |

---

## Platform Overview & Architecture

The documentation portal is built using **Astro v7**, leveraging static site generation (SSG) with client-side view transitions (`<ClientRouter />`), responsive KaTeX LaTeX equation rendering, and custom pan-zoom Mermaid diagramming engines.

### 3-Tier Information Architecture (Diátaxis Aligned)

* **Tier 1: Global Context** — Instant Command+K search modal, site navigation pills, and responsive off-canvas drawer navigation.
* **Tier 2: Topic & Chapter Hierarchy** — 7 categorized technical documentation sections spanning kinematics derivations, FreeRTOS pinouts, and empirical torque limits.
* **Tier 3: In-Page Navigation** — Desktop scrollspy rail and mobile sticky *"On this page"* slide-up bottom sheet.

```text
spider-blog/
├── src/
│   ├── components/            # Modular UI components
│   │   ├── Admonition.astro   # Note, Warning, Hazard callouts
│   │   ├── MobileSubNav.astro # Sticky mobile "On this page" TOC drawer
│   │   ├── NavBar.astro       # Header, Command+K modal & off-canvas drawer
│   │   ├── Pagination.astro   # Next/Previous chapter buttons
│   │   ├── ProductLinks.astro # Open-source asset link cards
│   │   ├── Sidebar.astro      # Desktop left documentation tree
│   │   └── TableOfContents.astro # Desktop right scrollspy rail
│   ├── content/
│   │   ├── docs/              # Technical MDX documentation chapters (01 to 08)
│   │   └── logbook/           # Chronological development milestones
│   ├── data/
│   │   ├── docsNav.ts         # Navigation sections and badge registry
│   │   ├── links.ts           # Centralized external asset URLs
│   │   └── logbookData.ts     # Build log entries and failure records
│   ├── layouts/
│   │   ├── DocsLayout.astro   # 3-column technical documentation layout
│   │   └── MainLayout.astro   # Clean layout for Overview, Hardware, Logbook
│   ├── lib/diagram/           # Mermaid pan-zoom, SVG projection & tour controller
│   └── styles/
│       ├── docs.css           # Typography, KaTeX math overflows, prose styling
│       └── diagram.css        # Mermaid card loading skeleton & viewport styling
├── astro.config.mjs           # Astro 7 + Tailwind Vite + KaTeX configuration
├── netlify.toml               # Continuous deployment configuration (Node 24)
└── package.json               # Dependencies and build scripts
```

---

## Local Development & Setup

### Prerequisites
* **Node.js**: `v20.x` or `v24.x` (LTS recommended)
* **Package Manager**: `npm` (v10+)

### 1. Clone the Repository
```bash
git clone https://github.com/GrrGrrMan/spider-blog.git
cd spider-blog
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The site will be accessible locally at `http://localhost:4321`.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static HTML, CSS, and client JavaScript bundles into the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## Content Management & Authoring

### Adding a Documentation Chapter
Create a new `.md` file inside `src/content/docs/` with required frontmatter:

```markdown
---
title: "Analytical Inverse Kinematics"
description: "Trigonometric derivation of 3-DOF Coxa, Femur, and Tibia joint angles."
section: "04 Embedded Firmware"
order: 5
badge: "100Hz"
---

## Kinematic Formulation

$$
\alpha = \operatorname{atan2}(y, x) \cdot \left(\frac{180^\circ}{\pi}\right)
$$
```

### Adding a Logbook Entry
Add a new record to `src/data/logbookData.ts`:

```typescript
{
  date: "20/08/26",
  tag: "RELEASE",
  tagType: "success",
  title: "Final Build Polish & Open-Source Release",
  desc: "Finalized wire harnesses, validated PlatformIO build pipelines, and open-sourced all CAD, firmware, gateway, and UI repositories."
}
```

---

## License & Attribution

Distributed under the **MIT License**. Developed for **Science Fair 2026** as an open-hardware, low-cost autonomous robotics research platform. See [LICENSE](LICENSE) for details.