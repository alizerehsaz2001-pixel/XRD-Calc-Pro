import re

with open('components/CrystallographicMetricTensorModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace PRESET_SYSTEMS
new_presets = """const PRESET_SYSTEMS: Record<CrystalSystem, { name: string; params: LatticeParams }> = {
  Cubic: {
    name: 'Cubic',
    params: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 }
  },
  Tetragonal: {
    name: 'Tetragonal',
    params: { a: 4.50, b: 4.50, c: 7.20, alpha: 90, beta: 90, gamma: 90 }
  },
  Hexagonal: {
    name: 'Hexagonal',
    params: { a: 3.21, b: 3.21, c: 5.21, alpha: 90, beta: 90, gamma: 120 }
  },
  Rhombohedral: {
    name: 'Rhombohedral',
    params: { a: 5.12, b: 5.12, c: 5.12, alpha: 85, beta: 85, gamma: 85 }
  },
  Orthorhombic: {
    name: 'Orthorhombic',
    params: { a: 4.20, b: 5.80, c: 7.10, alpha: 90, beta: 90, gamma: 90 }
  },
  Monoclinic: {
    name: 'Monoclinic',
    params: { a: 5.40, b: 6.20, c: 7.80, alpha: 90, beta: 99.5, gamma: 90 }
  },
  Triclinic: {
    name: 'Triclinic',
    params: { a: 5.10, b: 6.40, c: 7.30, alpha: 82, beta: 98, gamma: 105 }
  }
};"""

old_presets_start = content.find('const PRESET_SYSTEMS')
old_presets_end = content.find('// Formatter for Numbers')
content = content[:old_presets_start] + new_presets + '\n\n' + content[old_presets_end:]

content = content.replace('export const CrystallographicMetricTensorModule: React.FC<{ isRTL?: boolean }> = ({ isRTL = false }) => {', 'export const CrystallographicMetricTensorModule: React.FC<any> = () => {')

content = re.sub(r'isRTL\s*\?\s*"[^"]*"\s*:\s*"([^"]*)"', r'"\1"', content)
content = re.sub(r"isRTL\s*\?\s*'[^']*'\s*:\s*'([^']*)'", r"'\1'", content)
content = re.sub(r'isRTL\s*\?\s*PRESET_SYSTEMS\[sysKey\]\.nameFa\.split\(\' \'\)\[0\]\s*:\s*sysKey', 'sysKey', content)
content = re.sub(r'\{isRTL\s*\?\s*"[^"]*"\s*:\s*"([^"]*)"\s*\}', r'\1', content)

with open('components/CrystallographicMetricTensorModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
