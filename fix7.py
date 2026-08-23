import re

with open('components/SupercellTransformationModule.tsx', 'r') as f:
    text = f.read()

text = re.sub(r'</motion\.div>\s*\}\)', '', text)
text = re.sub(r'\}\)\s*</div>\s*\}\)\s*</div>\s*\);\s*\};', '      )}\n    </div>\n  );\n};', text)

with open('components/SupercellTransformationModule.tsx', 'w') as f:
    f.write(text)

