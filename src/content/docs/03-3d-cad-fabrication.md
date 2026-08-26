---
title: "3D CAD Models, Slicing & Mechanical Fabrication"
description: "Parametric Onshape assemblies, PETG slicer configurations, and print orientation tables."
section: "02 Fabrication & CAD"
order: 3
---

Parametric mechanical assets, 3D printing configurations, and structural assembly guidelines for the 18-DOF Hexapod V2 platform.

## Mechanical Fabrication Workflow

```mermaid
flowchart TD
    CAD["Onshape Parametric CAD<br/>(Body 2.0, Leg Linkages, Stand)"] --> EXPORT["Export High-Resolution STL / STEP"]
    
    EXPORT --> SLICER["Slicer Configuration (PETG Profile)<br/>- 4 Perimeter Shells (1.6mm)<br/>- 35% Gyroid Infill<br/>- 0.20mm Layer Height"]
    
    SLICER --> PRINT["FDM 3D Printing<br/>- 240°C Nozzle / 75°C Bed<br/>- Tree Supports for Servo Horn Lips"]
    
    PRINT --> POST["Post-Processing & Assembly<br/>- Ream M2 Horn Pilot Pockets<br/>- Press-Fit Servo Horn Splines<br/>- Fasten M2 Screws & Route Cables"]
    
    POST --> CHASSIS["Enclosed Monocoque Chassis 2.0"]
```

## Parametric Onshape 3D Assets

| Assembly / Part | Description | Status | Interactive CAD Model |
| :--- | :--- | :---: | :--- |
| **Enclosed Body Chassis 2.0** | Integrated electronics bay, wire ducts, and MCU mounts | **Current Release** | [Open Body 2.0 in Onshape](https://cad.onshape.com/documents/97670e8943e0cc50e830c42a/w/00e0069e98a6590d172338eb/e/8904dbdba274489211ded1bf?renderMode=0&uiState=6a8cd46a6dfb0f4caeea9e32) |
| **Flat Plate Chassis 1.0** | Preliminary flat evaluation platform (open wiring) | Prototype (Deprecated) | [Open Body 1.0 in Onshape](https://cad.onshape.com/documents/2eb7ad3166d9957057efdbed/w/e8c5560e4175eba75eb554f7/e/949102c48f152406690b75f3?renderMode=0&uiState=6a8cd3263182be2f972a37d2) |
| **3-DOF Symmetrical Leg Link**| Symmetrical Coxa, Femur, and Tibia joint assembly | **Current Release** | [Open Leg CAD in Onshape](https://cad.onshape.com/documents/ad85265f97458b2bb5a36b9a/w/754aa4f35e9737488e2b5583/e/29b64b050765026b374ec06f?renderMode=0&uiState=6a8cd34b7774753c86709f86) |

## Slicer Profile Specification (PETG)

| Parameter Name | Target Setting | Structural & Mechanical Rationale |
| :--- | :--- | :--- |
| **Filament Material** | PETG (Polyethylene Terephthalate Glycol) | High impact strength, flexural endurance, and thermal resilience |
| **Filament Diameter** | 1.75 mm (±0.02 mm) | Standard extrusion feedstock |
| **Nozzle Diameter** | 0.40 mm Brass / Hardened Steel | Balances fine horn pocket features with rapid perimeter extrusion |
| **Primary Layer Height** | 0.20 mm | Maximizes interlayer adhesion and shear bonding strength |
| **Initial Layer Height** | 0.24 mm | Ensures strong base adhesion on textured PEI spring steel bed |
| **Perimeter Wall Shells** | 4 Loops (1.60 mm Total Thickness) | Resists torsional shear from active 2.2 kg·cm servo output splines |
| **Top / Bottom Solid Layers**| 5 Top Layers / 4 Bottom Layers | Prevents structural crush under M2/M3 fastener compression |
| **Internal Infill Density** | 35% Infill | Provides high strength-to-weight ratio for dynamic limb acceleration |
| **Infill Pattern** | Gyroid | Isotropic multi-axial mechanical strength without directional weakness |
| **Extruder Temperature** | 240°C | Ensures complete polymer melt and interlayer weld strength |
| **Heated Bed Temperature** | 75°C | Exceeds glass transition point ($T_g$), eliminating corner warping |
| **Cooling Fan Speed** | 40% (0% for layers 1 to 3) | Preserves ductility and prevents premature embrittlement |
| **Support Structure** | Organic / Tree Supports | Clean removal on servo pocket overhangs and mounting tabs |

## Printed Part Manifest & Print Orientation

```mermaid
flowchart LR
    subgraph Legs ["6x Leg Sets (18 Links Total)"]
        COXA["6x Coxa (Hip) Links<br/>Print Flat on Base"]
        FEMUR["6x Femur (Thigh) Beams<br/>Print on Lateral Edge"]
        TIBIA["6x Tibia (Shin) Links<br/>Print on Flat Side"]
    end

    subgraph Body ["Chassis Monocoque"]
        BASE["1x Lower Body Tub<br/>Print Flat on Baseplate"]
        LID["1x Upper Electronics Lid<br/>Print External Face Up"]
        HEAD["1x Camera Head Mount<br/>Print Bezel Down"]
    end
```

| Part Identifier | Print Qty | Optimal Bed Orientation | Support Requirements | Critical Assembly Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Coxa (Hip Link)** | 6 | Flat on servo pocket face | None required | Ensure friction-fit pilot hole alignment for servo horn spline |
| **Femur (Thigh Beam)** | 6 | Lateral side face flat on bed | Tree supports under horn pocket | 4 perimeter shells mandatory to withstand leg-lifting torque |
| **Tibia (Shin / Foot)** | 6 | Flat lateral face on bed | Minimal tree supports on pivot | Install TPU or rubber tip at foot contact point for traction |
| **Chassis Lower Tub** | 1 | Flat on structural baseplate | None required | Features wire pass-through ducts and PCA9685 standoffs |
| **Chassis Upper Lid** | 1 | Exterior face upward | None required | Houses ESP32-CAM head pivot and snap-fit retention clips |
| **Camera Cranial Mount**| 1 | Front optical bezel downward | Minimal supports on bracket | Friction clamp securing ESP32-CAM module and flashlight LED |

## Chassis Iteration Evolution

```mermaid
flowchart TD
    subgraph Proto1 ["Prototype 1.0 (May 2026)"]
        P1_DESC["hand-cut acrylic sheets & hot glue joints.<br/>Result: Snapped under servo torque."]
    end

    subgraph Proto2 ["Prototype 2.0 (June 2026)"]
        P2_DESC["Flat 3D printed PETG plate platform.<br/>Result: Validated IK math, but wires unprotected and battery too heavy."]
    end

    subgraph Proto3 ["Prototype 3.0 / Current Release (August 2026)"]
        P3_DESC["Enclosed 3D monocoque chassis.<br/>Integrated wire channels, MCU bays, shortened legs, and DTC testing stand."]
    end

    Proto1 -->|Failure Analysis: Inadequate Joint Rigidity| Proto2
    Proto2 -->|Failure Analysis: Cable Snagging & Weight Distribution| Proto3
```

### Prototype 1.0 vs Prototype 2.0 vs Prototype 3.0

| Feature / Metric | Prototype 1.0 (Acrylic) | Prototype 2.0 (Flat PETG Plate) | Prototype 3.0 (Enclosed Monocoque) |
| :--- | :--- | :--- | :--- |
| **Chassis Material** | 3mm Acrylic sheets + adhesive | Flat 3mm 3D printed PETG plate | Contoured 3D PETG monocoque shell |
| **Joint Integrity** | Brittle; fractured under load | Ductile; withstands nominal loads | Maximum rigidity with 4 perimeter walls |
| **Electronics Protection**| None (Exposed wiring) | Open air (Wires prone to snags) | Fully enclosed internal electronics bay |
| **Cable Management** | Unconstrained loose leads | Cable-tied to flat plate surface | Internal recessed wire routing channels |
| **Mounting Standoffs** | Glued plastic posts | Drilled screw holes | Integrated threaded M3 mounting bosses |
| **Leg Moment Arm** | Unoptimized long levers | Long lever arms (Excess torque) | Shortened lever arms reducing servo strain |