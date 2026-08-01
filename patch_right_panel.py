import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

old_panel = """                      {/* Right: Visualization & Classroom Interactive Tutor */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Terminal Logs or Loss Profiles Card */}
                        <div className="bg-[#050B14] border border-[#1e293b] rounded-3xl p-6 shadow-lg min-h-[300px] flex flex-col justify-between">"""

new_panel = """                      {/* Right: Visualization & Classroom Interactive Tutor */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Terminal Logs or Loss Profiles Card */}
                        <div className="bg-[#050A14] border border-[#1e293b] rounded-[2rem] p-6 shadow-2xl min-h-[300px] flex flex-col justify-between relative overflow-hidden group/monitor">
                          {/* Custom Background Graphic */}
                          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover/monitor:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
                            <img src={deepLearningAnalysisBg} alt="Model Optimizer Monitor" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                          </div>"""

content = content.replace(old_panel, new_panel)

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

