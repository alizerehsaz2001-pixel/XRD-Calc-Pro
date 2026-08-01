import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

content = content.replace('bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-violet-500/30', 'bg-[#050B14]/80 backdrop-blur-md p-4 rounded-xl border border-violet-500/30')
content = content.replace('bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-violet-500/30', 'bg-[#050B14]/80 backdrop-blur-md p-4 rounded-xl border border-violet-500/30')

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

