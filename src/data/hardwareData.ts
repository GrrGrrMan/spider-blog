import { PRODUCT_LINKS } from './links';

const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export interface JointAnatomy {
  tag: string;
  role: string;
  length: string;
  range: string;
  img: string;
  alt: string;
  desc: string;
  cadUrl: string;
}

export interface SlicerSetting {
  label: string;
  val: string;
}

export const LEG_ANATOMY: JointAnatomy[] = [
  {
    tag: "01_COXA (HIP)",
    role: "Horizontal Yaw (Pan)",
    length: "L1 = 52 mm",
    range: "-65° to +65°",
    img: `${base}images/coxa_model.png`,
    alt: "Coxa Joint 3D CAD Model",
    desc: "Rotates the entire leg horizontally (yaw axis). Controls directional steering vectors and zero-radius chassis rotation.",
    cadUrl: PRODUCT_LINKS.cad.leg,
  },
  {
    tag: "02_FEMUR (THIGH)",
    role: "Vertical Pitch (Lift)",
    length: "L2 = 66 mm",
    range: "-75° to +65°",
    img: `${base}images/femur_model.png`,
    alt: "Femur Joint 3D CAD Model",
    desc: "Provides vertical stepping lift and stance height modulation. Absorbs primary normal load (4.28 N per stance leg).",
    cadUrl: PRODUCT_LINKS.cad.leg,
  },
  {
    tag: "03_TIBIA (SHIN)",
    role: "Radial Pitch (Reach)",
    length: "L3 = 132 mm",
    range: "-135° to +45°",
    img: `${base}images/tibia_model.png`,
    alt: "Tibia Joint 3D CAD Model",
    desc: "Reaches forward to establish ground contact. Modulates radial reach distance and adapts to non-planar obstacles.",
    cadUrl: PRODUCT_LINKS.cad.leg,
  },
];

export const SLICER_SETTINGS: SlicerSetting[] = [
  { label: "FILAMENT FEEDSTOCK", val: "PETG (Polyethylene Terephthalate Glycol)" },
  { label: "NOZZLE / BED TEMP", val: "240°C Nozzle / 75°C Textured PEI Bed" },
  { label: "PERIMETER WALLS", val: "4 Loops (1.60 mm Total Thickness)" },
  { label: "INFILL DENSITY / TYPE", val: "35% Gyroid (Isotropic Multi-Axial)" },
  { label: "LAYER RESOLUTION", val: "0.20 mm (0.24 mm Initial Base Layer)" },
  { label: "SOLID TOP / BOTTOM", val: "5 Top Layers / 4 Bottom Layers" },
];