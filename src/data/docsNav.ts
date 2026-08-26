export interface DocNavItem {
  title: string;
  slug: string;
  badge?: string;
}

export interface DocNavSection {
  sectionTitle: string;
  items: DocNavItem[];
}

export const DOCS_NAVIGATION: DocNavSection[] = [
  {
    sectionTitle: "01 System Overview",
    items: [
      { title: "System Architecture", slug: "01-system-overview", badge: "Core" },
    ],
  },
  {
    sectionTitle: "02 Fabrication & CAD",
    items: [
      { title: "Bill of Materials (BOM)", slug: "02-bill-of-materials" },
      { title: "3D CAD & Slicing", slug: "03-3d-cad-fabrication" },
    ],
  },
  {
    sectionTitle: "03 Electrical & Power",
    items: [
      { title: "Power & Pinouts", slug: "04-electrical-power", badge: "5.3V" },
    ],
  },
  {
    sectionTitle: "04 Embedded Firmware",
    items: [
      { title: "ESP32-S3 Dual-Core RTOS", slug: "05-embedded-firmware", badge: "100Hz" },
    ],
  },
  {
    sectionTitle: "05 Host AI Gateway",
    items: [
      { title: "Raspberry Pi 4 AI Hub", slug: "06-pi-ai-hub", badge: "LLM" },
    ],
  },
  {
    sectionTitle: "06 Simulation & Web",
    items: [
      { title: "React & Plotly 3D UI", slug: "07-web-3d-dashboard" },
    ],
  },
  {
    sectionTitle: "07 Empirical Research",
    items: [
      { title: "Mass, Torque & Limits", slug: "08-empirical-results", badge: "Data" },
    ],
  },
];