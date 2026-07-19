import re

with open('./components/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the giant Zap icon with something more professional looking
content = content.replace('<Zap className="w-20 h-20 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />', '<User className="w-16 h-16 text-slate-400 group-hover:scale-110 transition-transform duration-700" />')
content = content.replace('w-40 h-40 bg-slate-800 rounded-full border border-indigo-500/20', 'w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-indigo-500/20')
content = content.replace('w-48 h-48 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center relative mb-4', 'w-48 h-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-full flex items-center justify-center relative mb-4 shadow-lg')
content = content.replace('bg-slate-950 flex items-center justify-center relative overflow-hidden border', 'bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden border')
content = content.replace('text-4xl font-black text-white/25 select-none tracking-tighter uppercase font-mono', 'text-2xl font-bold text-slate-300 dark:text-white/25 select-none tracking-tight uppercase font-sans')
content = content.replace('{profile.firstName[0]}{profile.lastName[0]} MODEL', '{profile.firstName} {profile.lastName}')

with open('./components/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated avatar styling")
