import re

with open('./components/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('SYSTEM PORT_3000', 'VALID ID')
content = content.replace('Security Token', 'Access Card')

with open('./components/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated barcode styling")
