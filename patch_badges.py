import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

content = content.replace('bg-slate-800/40 border border-slate-700/80', 'bg-[#03060C]/60 border border-[#1e293b]')

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

