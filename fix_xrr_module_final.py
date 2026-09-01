with open("components/XRRModule.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix config initialization
code = code.replace("instrumentResolution: 0.01,", "")
code = code.replace("beamLengthMm: 20.0,", "")
code = code.replace("polarizationFactor: 1.0,", "")
code = code.replace("monteCarloEnvelope: true", "")

# Fix handleSourceChange
code = code.replace(
    "const handleSourceChange = (sourceKey: string) => {",
    "const handleSourceChange = (sourceKey: any) => {"
)

# Fix calculateCriticalAngle call
code = code.replace(
    "calculateCriticalAngle(mergedDataPoints, config.wavelength)",
    "calculateCriticalAngle(mergedDataPoints)"
)

with open("components/XRRModule.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("XRRModule.tsx updated!")
