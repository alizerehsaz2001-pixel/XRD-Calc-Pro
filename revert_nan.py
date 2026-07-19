import re
import glob

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find value={isNaN(X) ? '' : X}
    # and replace with value={X}
    
    new_content = re.sub(r'value=\{isNaN\(([^)]+)\) \? \'\' : \1\}', r'value={\1}', content)
    
    if new_content != content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Reverted {filename}")

for f in glob.glob('./components/*.tsx'):
    fix_file(f)
