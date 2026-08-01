import re

with open("components/DeepLearningModule.tsx", "r") as f:
    content = f.read()

# Add import
if "convolutionalEngineBg" not in content:
    import_stmt = "import convolutionalEngineBg from '../src/assets/images/convolutional_engine_bg_1785614983427.jpg';\n"
    content = content.replace("import ReactMarkdown from 'react-markdown';", "import ReactMarkdown from 'react-markdown';\n" + import_stmt)

old_div = """        {/* Deep Learning Architecture Status */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/engine flex flex-col gap-6 transition-all duration-500 border border-slate-800">
          {/* Advanced Animated Backgrounds */}
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-[80px] group-hover/engine:bg-violet-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] group-hover/engine:bg-cyan-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
          <div
            className="absolute inset-0 bg-[#000] opacity-20 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-70" />

          {/* Neural Nodes Grid Pattern Decoration */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="neural-net"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="10" cy="10" r="1.5" fill="#a78bfa" />
                <circle cx="50" cy="30" r="1.5" fill="#38bdf8" />
                <path
                  d="M 10 10 L 50 30"
                  stroke="#a78bfa"
                  strokeWidth="0.5"
                  strokeOpacity="0.5"
                />
                <path
                  d="M 50 30 L 10 50"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                  strokeOpacity="0.5"
                />
                <circle cx="10" cy="50" r="1.5" fill="#a78bfa" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-net)" />
          </svg>"""

new_div = """        {/* Deep Learning Architecture Status */}
        <div className="bg-[#050A14] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group/engine flex flex-col gap-6 transition-all duration-500 border border-slate-800/80 hover:border-slate-700">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] group-hover/engine:opacity-[0.08] transition-opacity duration-1000 mix-blend-screen">
            <img src={convolutionalEngineBg} alt="Convolutional Engine" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
          </div>
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] group-hover/engine:bg-violet-500/20 transition-colors duration-1000 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] group-hover/engine:bg-cyan-500/20 transition-colors duration-1000 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-70 group-hover/engine:via-violet-400/50 transition-colors duration-700" />"""

content = content.replace(old_div, new_div)

with open("components/DeepLearningModule.tsx", "w") as f:
    f.write(content)

