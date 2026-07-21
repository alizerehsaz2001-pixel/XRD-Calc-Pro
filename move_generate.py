import re

with open('components/RietveldModule.tsx', 'r') as f:
    content = f.read()

# Extract obsIntensities and generatePatternData and rFactor
match = re.search(r"(  const obsIntensities = useMemo\(\(\) => \{.*?\n  const rFactor = generatePatternData\.R;\n)", content, re.DOTALL)
if match:
    block = match.group(1)
    
    # Remove it from current location
    content = content.replace(block, "")
    
    # Insert it at line 815 (before referenceRwp)
    lines = content.split('\n')
    
    # Find referenceRwp
    idx = -1
    for i, line in enumerate(lines):
        if "const referenceRwp =" in line:
            idx = i
            break
            
    if idx != -1:
        lines.insert(idx, block.strip('\n'))
        
    with open('components/RietveldModule.tsx', 'w') as f:
        f.write('\n'.join(lines))
    print("Moved!")
else:
    print("Not found!")

