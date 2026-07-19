import re
import glob

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all <input ...> tags
    def replace_input(m):
        input_tag = m.group(0)
        if 'type="number"' not in input_tag and 'type="range"' not in input_tag:
            return input_tag
            
        # find value={...}
        def replace_value(m_val):
            val_content = m_val.group(1)
            # if already handled or empty, skip
            if 'String(' in val_content or '?' in val_content:
                return m_val.group(0)
            return f"value={{String({val_content}) === 'NaN' ? '' : {val_content}}}"
            
        new_tag = re.sub(r'value=\{([^}]+)\}', replace_value, input_tag)
        return new_tag

    new_content = re.sub(r'<input[^>]+>', replace_input, content)

    if new_content != content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filename}")

for f in glob.glob('./components/*.tsx'):
    fix_file(f)
