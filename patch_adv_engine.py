import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

old_adv_config = """      <div className="lg:col-span-12 flex flex-col gap-8">
        {/* Advanced Engine Configuration */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />"""

new_adv_config = """      <div className="lg:col-span-12 flex flex-col gap-8">
        {/* Advanced Engine Configuration */}
        <div className="bg-[#050A14] p-6 rounded-[2rem] shadow-2xl border border-slate-800/80 hover:border-slate-700 relative overflow-hidden group transition-all duration-500">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
            <img src={convolutionalEngineBg} alt="Advanced Engine" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />"""

content = content.replace(old_adv_config, new_adv_config)

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)
