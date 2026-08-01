import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

old_topo = """          {/* Network Topology Visualization */}
          <div className="mb-6 bg-slate-900/60 border border-slate-700/60 rounded-2xl relative z-10 p-5 overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />"""

new_topo = """          {/* Network Topology Visualization */}
          <div className="mb-6 bg-[#050B14]/80 backdrop-blur-md border border-[#1e293b] shadow-inner rounded-2xl relative z-10 p-5 overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />"""

content = content.replace(old_topo, new_topo)

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)
