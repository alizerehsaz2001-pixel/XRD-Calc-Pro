import re

with open('components/RietveldModule.tsx', 'r') as f:
    content = f.read()

# 1. Remove rFactor state
content = re.sub(r"  const \[rFactor, setRFactor\] = useState<number>\(0\);\n", "", content)

# 2. Add rFactor definition after generatePatternData
content = re.sub(
    r"  const generatePatternData = useMemo\(\(\) => \{.*?\n  \}, \[simPhases, obsIntensities\]\);\n",
    lambda m: m.group(0) + "\n  const rFactor = generatePatternData.R;\n",
    content,
    flags=re.DOTALL
)

# 3. Fix ComposedChart usage
content = re.sub(r"data=\{generatePatternData\}", r"data={generatePatternData.data}", content)

# 4. Fix livePatternData
content = re.sub(r"livePatternData=\{generatePatternData\}", r"livePatternData={generatePatternData.data}", content)

with open('components/RietveldModule.tsx', 'w') as f:
    f.write(content)

print("Fixed variables!")
