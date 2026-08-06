const fs = require('fs');
let content = fs.readFileSync('components/WilliamsonHallModule.tsx', 'utf8');

// Configuration Panel Background
content = content.replace(
  '<div className="bg-[#050A14] p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">',
  `<div className="bg-[#050A14] p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={williamsonBg} alt="Williamson-Hall" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none"></div>`
);

// Scientific Context Card Background
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-all">',
  `<div className="bg-[#050A14] p-8 rounded-3xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000 mix-blend-screen">
            <img src={williamsonBg} alt="Williamson-Hall Context" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all duration-700 pointer-events-none"></div>`
);

// Chart Background
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_40px_rgba(34,211,238,0.05)] border border-white/10 min-h-[600px] xl:min-h-[700px] h-[70vh] xl:h-[80vh] flex flex-col relative overflow-hidden group hover:border-cyan-500/30 transition-all">',
  `<div className="xl:col-span-8 bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group flex flex-col min-h-[600px] xl:min-h-[700px] h-[70vh] xl:h-[80vh]">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000 mix-blend-screen">
            <img src={williamsonBg} alt="Williamson-Hall Plot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/50" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />`
);

// Strain Gradient Card Background
content = content.replace(
  '<div className="bg-[#0A101C]/90 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-6 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden group/size-card flex flex-col justify-between transition-all duration-500">
             {/* Custom Background Graphic */}
             <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
               <img src={williamsonBg} alt="Strain" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
             </div>`
);

// Regression Analysis Card Background
content = content.replace(
  '<div className="bg-[#050B14]/90 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/10 hover:border-cyan-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(34,211,238,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-6 rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden group/size-card flex flex-col justify-between transition-all duration-500">
             {/* Custom Background Graphic */}
             <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
               <img src={williamsonBg} alt="Model Fit" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
             </div>`
);

// Size Intercept Card Background
content = content.replace(
  '<div className="bg-[#050B14]/90 backdrop-blur-xl p-6 rounded-3xl border border-purple-500/10 hover:border-purple-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(168,85,247,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-6 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden group/size-card flex flex-col justify-between transition-all duration-500">
             {/* Custom Background Graphic */}
             <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
               <img src={williamsonBg} alt="Size" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
             </div>`
);


// Stephens Anisotropic Tensor Background
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between col-span-2">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-[2rem] border border-emerald-500/20 shadow-2xl relative overflow-hidden group/size-card hover:border-emerald-500/40 transition-all flex flex-col justify-between col-span-2">
                {/* Custom Background Graphic */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
                  <img src={williamsonBg} alt="Stephens Analysis" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                </div>`
);

// Lattice Stress Background
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group hover:border-rose-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-[2rem] border border-rose-500/20 shadow-2xl relative overflow-hidden group/size-card hover:border-rose-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Custom Background Graphic */}
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
                    <img src={williamsonBg} alt="Lattice Stress" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                  </div>`
);

// Strain Energy Background
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group hover:border-blue-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-8 duration-300">',
  `<div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-[2rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group/size-card hover:border-blue-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-8 duration-300">
                  {/* Custom Background Graphic */}
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover/size-card:opacity-20 transition-opacity duration-1000 mix-blend-screen">
                    <img src={williamsonBg} alt="Strain Energy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                  </div>`
);

// Extended Peak-by-Peak Analysis Table
content = content.replace(
  '<div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-[#22d3ee]/30 transition-all font-mono">',
  `<div className="bg-[#050A14] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px] relative group p-6">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 mix-blend-screen">
            <img src={williamsonBg} alt="Williamson-Hall Analysis" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/50" />
          </div>`
);


fs.writeFileSync('components/WilliamsonHallModule.tsx', content);
console.log('UI Backgrounds Applied!');
