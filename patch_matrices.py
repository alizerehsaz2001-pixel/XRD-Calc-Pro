import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

# Add import
if "deepLearningAnalysisBg" not in content:
    import_stmt = "import deepLearningAnalysisBg from '../src/assets/images/deep_learning_analysis_bg_1785615121328.jpg';\n"
    content = content.replace("import convolutionalEngineBg", import_stmt + "import convolutionalEngineBg")

old_matrix = """                      {/* Left: Interactive 6x6 Confusion Heatmap Grid */}
                      <div className="lg:col-span-7 bg-[#050B14] border border-[#1e293b] rounded-3xl p-6 shadow-lg">"""

new_matrix = """                      {/* Left: Interactive 6x6 Confusion Heatmap Grid */}
                      <div className="lg:col-span-7 bg-[#050A14] border border-[#1e293b] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group/matrix">
                        {/* Custom Background Graphic */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover/matrix:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
                          <img src={deepLearningAnalysisBg} alt="Analysis Matrix" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                        </div>"""

old_calibration = """                      {/* Left: Hyperparameters & Synthetic Augmentations */}
                      <div className="lg:col-span-5 bg-[#050B14] border border-[#1e293b] rounded-3xl p-6 space-y-6 shadow-lg">"""

new_calibration = """                      {/* Left: Hyperparameters & Synthetic Augmentations */}
                      <div className="lg:col-span-5 bg-[#050A14] border border-[#1e293b] rounded-[2rem] p-6 space-y-6 shadow-2xl relative overflow-hidden group/calib">
                        {/* Custom Background Graphic */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover/calib:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
                          <img src={deepLearningAnalysisBg} alt="Network Calibration" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                        </div>"""

content = content.replace(old_matrix, new_matrix)
content = content.replace(old_calibration, new_calibration)

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)
