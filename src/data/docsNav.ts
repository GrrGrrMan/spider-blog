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
    sectionTitle: "00 Mission & scope",
    items: [
      { title: "Mission rationale and scope", slug: "mission-and-intentions", badge: "Mission" },
    ],
  },
  {
    sectionTitle: "01 System overview",
    items: [
      { title: "System topology and architecture", slug: "system-overview", badge: "Core" },
    ],
  },
  {
    sectionTitle: "02 Fabrication & CAD",
    items: [
      { title: "Bill of materials and procurement", slug: "bill-of-materials" },
      { title: "CAD models and additive fabrication", slug: "3d-cad-fabrication" },
    ],
  },
  {
    sectionTitle: "03 Electrical & power",
    items: [
      { title: "Power distribution and pinouts", slug: "electrical-power", badge: "5.3V" },
    ],
  },
  {
    sectionTitle: "04 Embedded firmware",
    items: [
      { title: "Embedded firmware and motion core", slug: "embedded-firmware", badge: "100Hz" },
    ],
  },
  {
    sectionTitle: "05 Host AI gateway",
    items: [
      { title: "Host gateway and voice AI engine", slug: "pi-ai-hub", badge: "LLM" },
    ],
  },
  {
    sectionTitle: "06 Simulation & web",
    items: [
      { title: "3D digital twin and web simulation", slug: "web-3d-dashboard" },
    ],
  },
  {
    sectionTitle: "07 Empirical research",
    items: [
      { title: "Empirical results and torque limits", slug: "empirical-results", badge: "Data" },
    ],
  },
];