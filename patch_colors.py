import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

content = content.replace("bg-[#050B14]", "bg-[#050A14]")

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

