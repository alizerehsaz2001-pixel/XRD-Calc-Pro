import re

with open('components/CrystallographicMetricTensorModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Enhance Title Banner
old_banner = """      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-3xl p-8 border border-violet-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-screen">
          <Grid className="w-64 h-64 text-cyan-400" />
        </div>"""
new_banner = """      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Grid className="w-64 h-64 text-white" />
        </div>"""
content = content.replace(old_banner, new_banner)

# Enhance Tensors
content = content.replace(
    """<div className="bg-slate-900/90 rounded-3xl p-6 border border-violet-500/30 shadow-xl space-y-5 relative overflow-hidden">""",
    """<div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 relative overflow-hidden group hover:border-violet-500/30 transition-colors">"""
)

content = content.replace(
    """<div className="bg-slate-900/90 rounded-3xl p-6 border border-cyan-500/30 shadow-xl space-y-5 relative overflow-hidden">""",
    """<div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">"""
)

# Clean up backgrounds for nested cards to adhere to anti-slop
content = content.replace("""bg-slate-950/80""", """bg-slate-900/50""")
content = content.replace("""bg-slate-950/70""", """bg-slate-900/50""")
content = content.replace("""bg-slate-950/60""", """bg-slate-900/50""")
content = content.replace("""bg-slate-950/50""", """bg-slate-900/30""")
content = content.replace("""bg-slate-900/90""", """bg-slate-950""")
content = content.replace("""bg-slate-900/80""", """bg-slate-800/50""")

# Better spacing for math control (assuming it's a separate component but used here)
# Wait, I don't control ScientificMathControl here.

# Tools Section
content = content.replace(
    """<div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">""",
    """<div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-8">"""
)

content = content.replace(
    """<div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">""",
    """<div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 space-y-5">"""
)

# Strain Tensor
content = content.replace(
    """<div className="bg-slate-950 rounded-3xl p-6 border border-amber-500/30 shadow-xl space-y-5">""",
    """<div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 hover:border-amber-500/30 transition-colors">"""
)

content = content.replace(
    """<div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">""",
    """<div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6">"""
)

with open('components/CrystallographicMetricTensorModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Updated")
