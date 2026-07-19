import re

with open('./components/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace confusing names
replacements = {
    'Laboratory Directory Mesh': 'Contact & Links',
    'Sovereign Credentials Verified': 'Database Security Verified',
    'Sovereign lattice matching index node matrices': 'Connected reference databases for crystal phase identification',
    'Scientific Reference Databases': 'Reference Databases',
    'Security Encrypted Token': 'Security Token',
    'SHA-256 MATCH VERIFIED': 'IDENTITY VERIFIED',
    'Lab Mission Command': 'Lab Mission',
    'Lattice-LLM': 'CrystalAI',
    'text-[8px]': 'text-[10px]',
    'text-[9px]': 'text-xs',
    'text-[10px]': 'text-xs'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('./components/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ProfilePage.tsx")
