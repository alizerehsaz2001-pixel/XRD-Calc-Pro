import re

# 1. Update XRRLayer in utils/xrrPhysics.ts to have material?: string
with open("utils/xrrPhysics.ts", "r", encoding="utf-8") as f:
    phys = f.read()

phys = phys.replace("formula?: string;", "formula?: string;\n  material?: string;")
with open("utils/xrrPhysics.ts", "w", encoding="utf-8") as f:
    f.write(phys)

# 2. Fix XRRReflectivityTab.tsx
with open("components/XRRReflectivityTab.tsx", "r", encoding="utf-8") as f:
    refl = f.read()

refl = refl.replace("rConfidenceLow", "rCalcMin")
refl = refl.replace("rConfidenceHigh", "rCalcMax")
with open("components/XRRReflectivityTab.tsx", "w", encoding="utf-8") as f:
    f.write(refl)

# 3. Fix XRRFittingTab.tsx material fallback
with open("components/XRRFittingTab.tsx", "r", encoding="utf-8") as f:
    fit = f.read()

fit = fit.replace("layer.material", "layer.formula || layer.material || layer.name")
with open("components/XRRFittingTab.tsx", "w", encoding="utf-8") as f:
    f.write(fit)

# 4. Fix XRRSLDTab.tsx material fallback
with open("components/XRRSLDTab.tsx", "r", encoding="utf-8") as f:
    sld = f.read()

sld = sld.replace("layer.material", "layer.formula || layer.material || layer.name")
with open("components/XRRSLDTab.tsx", "w", encoding="utf-8") as f:
    f.write(sld)

# 5. Fix XRRModule.tsx
with open("components/XRRModule.tsx", "r", encoding="utf-8") as f:
    mod = f.read()

mod = mod.replace("radiationSource: 'Cu-Ka1'", "radiationSource: 'cu-ka1'")
mod = mod.replace("thetaMin: 0.1,", "angleStart: 0.1,")
mod = mod.replace("thetaMax: 5.0,", "angleEnd: 5.0,")
mod = mod.replace("thetaStep: 0.01,", "angleStep: 0.01,\n    angleUnit: 'theta',\n    beamDivergence: 0.01,")
mod = mod.replace("applyFootprintCorrection: true,", "footprintCorrection: true,")
mod = mod.replace("config.thetaStep", "config.angleStep")
mod = mod.replace("config.applyFootprintCorrection", "config.footprintCorrection")
mod = mod.replace("applyFootprintCorrection: e.target.checked", "footprintCorrection: e.target.checked")
mod = mod.replace("material: 'TiO2'", "formula: 'TiO2', material: 'TiO2'")
mod = mod.replace("material: result.formula", "formula: result.formula, material: result.formula")
mod = mod.replace("handleUpdateLayerParam(layer.id, 'material'", "handleUpdateLayerParam(layer.id, 'formula'")
mod = mod.replace("layer.material", "layer.formula || layer.name")

with open("components/XRRModule.tsx", "w", encoding="utf-8") as f:
    f.write(mod)

print("Fixes applied successfully!")
