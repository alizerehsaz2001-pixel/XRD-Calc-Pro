import fs from 'fs';
let content = fs.readFileSync('components/WarrenAverbachModule.tsx', 'utf8');

// Container
content = content.replace(
  '        <div className="bg-slate-950/80 backdrop-blur-2xl p-8 rounded-[2.5rem] ring-1 ring-white/10 ring-inset shadow-[0_0_30px_rgba(244,63,94,0.05)] border border-rose-500/20 relative group hover:border-white/10 transition-all">',
  '        <div className="bg-[#050914]/90 backdrop-blur-3xl p-6 lg:p-8 rounded-[2rem] border border-white/5 shadow-2xl relative group transition-all z-20">'
);

// Inner backdrop blur remove
content = content.replace(
  '            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/params shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md relative">',
  '            <div className={`p-5 rounded-2xl border transition-all relative ${isMaterialMenuOpen ? "border-rose-500/30 bg-black/60 z-[100] shadow-2xl shadow-rose-900/20" : "border-white/5 bg-black/40 hover:border-white/10 z-10"}`}>'
);

// Z-index fixes for overlapping menu
content = content.replace(
  '              <div className={`relative ${isMaterialMenuOpen ? \'z-50\' : \'z-10\'}`} ref={menuRef}>',
  '              <div className="relative z-[100]" ref={menuRef}>'
);

content = content.replace(
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/smart shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">',
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/smart relative z-0">'
);

content = content.replace(
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">',
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">'
);
content = content.replace(
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">',
  '              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">'
);

content = content.replace(
  '            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md space-y-4">',
  '            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4 relative z-0">'
);

content = content.replace(
  '            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md relative overflow-hidden">',
  '            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative overflow-hidden z-0">'
);


// Dropdown styling
content = content.replace(
  'className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5 backdrop-blur-3xl ring-1 ring-white/10"',
  'className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A101C] border border-white/10 rounded-xl shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden z-[100] py-2 backdrop-blur-3xl"'
);

content = content.replace(
  'className={`w-full px-4 py-3 flex flex-col items-start hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === m.label ? \'bg-rose-500/10\' : \'\'}`}',
  'className={`w-full px-4 py-2.5 flex flex-col items-start hover:bg-white/5 transition-colors ${selectedMaterial === m.label ? \'bg-rose-500/10\' : \'\'}`}'
);

content = content.replace(
  'className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === \'Custom\' ? \'bg-rose-500/10 text-rose-400\' : \'text-slate-300\'}`}',
  'className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5 mt-1 ${selectedMaterial === \'Custom\' ? \'bg-rose-500/10 text-rose-400\' : \'text-slate-300\'}`}'
);

content = content.replace(
  '<div className="absolute inset-0 bg-rose-500 blur-md opacity-20" />\n                <div className="p-2.5 bg-black/40 rounded-xl border border-rose-500/30 relative">\n                  <Settings className="w-5 h-5 text-rose-400" />\n                </div>',
  '<div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 relative">\n                  <Settings className="w-5 h-5" />\n                </div>'
);

// Advanced d-spacing
content = content.replace( // Just in case it wasn't caught by the first one
  '<div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">',
  '<div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">'
);
// Also for Advanced d-Spacing block
content = content.replace(
  '<div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">',
  '<div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">'
);
content = content.replace(
  '<div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">',
  '<div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">'
);

fs.writeFileSync('components/WarrenAverbachModule.tsx', content);
