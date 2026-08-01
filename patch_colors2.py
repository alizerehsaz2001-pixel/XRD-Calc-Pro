import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

content = content.replace("bg-slate-900", "bg-[#050A14]")
content = content.replace("bg-slate-950", "bg-[#03060C]")
content = content.replace("border-slate-800", "border-slate-800/80")
content = content.replace("border-[#1e293b]", "border-slate-800/80 hover:border-slate-700")

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

