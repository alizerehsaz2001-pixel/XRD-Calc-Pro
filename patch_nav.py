import re

with open('./components/ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make navigation cleaner
content = content.replace('bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl', 
                          'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm z-50 sticky top-4')

content = content.replace('rounded-[3rem] border border-slate-200 dark:border-slate-800 p-3 overflow-hidden shadow-2xl',
                          'rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 p-3 overflow-hidden shadow-lg')

content = content.replace('bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm',
                          'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-sm')


with open('./components/ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated navigation layout")
