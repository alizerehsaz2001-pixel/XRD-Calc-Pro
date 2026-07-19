import re

with open('./components/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the name larger and cleaner
content = content.replace('text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic font-sans break-words', 'text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-none font-sans break-words')

# Remove italic from the name
content = content.replace('text-xs font-black uppercase tracking-[0.5em] text-indigo-500', 'text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500')

with open('./components/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated header styling")
