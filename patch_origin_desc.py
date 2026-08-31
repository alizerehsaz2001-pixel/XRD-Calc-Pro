with open("components/OriginProFWHMPlotter.tsx", "r") as f:
    content = f.read()

content = content.replace("Matplotlib 3.10 + Scipy Optimization", "Matplotlib 3.10 + OriginPro (op) Integration")
content = content.replace("Academic-grade XRD peak fitting & deconvolution engine. Generates publication-quality OriginPro styled figures, true Voigt & Pseudo-Voigt profiles, Kα₁/Kα₂ doublet splitting, Scherrer size & microstrain, and exportable Jupyter Notebooks.", "Academic-grade XRD peak fitting & deconvolution engine. Generates publication-quality OriginPro styled Matplotlib figures, true Voigt & Pseudo-Voigt profiles, Scherrer size & microstrain, and exportable Jupyter Notebooks & native OriginPro (op) LabTalk scripts.")

with open("components/OriginProFWHMPlotter.tsx", "w") as f:
    f.write(content)
