const fs = require('fs');
let content = fs.readFileSync('components/ImageAnalysisModule.tsx', 'utf-8');

// Change previewRef to HTMLImageElement
content = content.replace("const previewRef = useRef<HTMLDivElement>(null);", "const previewRef = useRef<HTMLImageElement>(null);");

// Remove ref and events from motion.div
content = content.replace(/key="preview"[\s\S]*?onMouseLeave=\{\(\) => setMagnifier\(null\)\}/, 'key="preview"');

// Add ref and events to img
const imgRegex = /<img([\s\S]*?)style=\{analysisMode === 'python_cv' \? \{\} : getImgStyle\(\)\}\n\s*\/>/;
const imgReplacement = `<img$1style={analysisMode === 'python_cv' ? {} : getImgStyle()}
                      ref={previewRef}
                      onMouseMove={(e) => {
                        if (!previewRef.current) return;
                        const rect = previewRef.current.getBoundingClientRect();
                        setMagnifier({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }}
                      onMouseLeave={() => setMagnifier(null)}
                    />`;
content = content.replace(imgRegex, imgReplacement);

// We need to move the magnifier div to be a sibling of the img, but inside the motion.div.
// Since magnifier.x and y are now relative to the img, we need to position the magnifier relative to the img.
// Wait, the magnifier has `absolute` position, which is relative to the nearest positioned ancestor (`motion.div` has `relative`).
// If `motion.div` is `flex flex-col items-center justify-center`, the `img` is centered.
// The `magnifier` div uses `left: magnifier.x - 60, top: magnifier.y - 60`. This assumes the coordinate system of `motion.div`!
// But if `magnifier.x` and `y` are relative to `img`, we need to position the magnifier div relative to the `img`!
// A simple way is to wrap `img` and `magnifier` in a `div` with `relative inline-block`.

const replacement = `
                    <div className="relative inline-block">
                      <img$1style={analysisMode === 'python_cv' ? {} : getImgStyle()}
                        ref={previewRef}
                        onMouseMove={(e) => {
                          if (!previewRef.current) return;
                          const rect = previewRef.current.getBoundingClientRect();
                          setMagnifier({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                        onMouseLeave={() => setMagnifier(null)}
                      />
                      {magnifier && !scanActive && (
                        <div 
                          className="absolute pointer-events-none rounded-full border-2 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-50 overflow-hidden bg-black flex items-center justify-center backdrop-blur-sm"
                          style={{
                             width: '120px',
                             height: '120px',
                             left: magnifier.x - 60,
                             top: magnifier.y - 60,
                             backgroundImage: \\\`url(\\$\{analysisMode === 'python_cv' && cvResults && activeFilterTab !== 'original' ? cvResults.processed_images[activeFilterTab] : image})\\\`,
                             backgroundPosition: \\\`\\$\{(magnifier.x / previewRef.current!.offsetWidth) * 100}% \\$\{(magnifier.y / previewRef.current!.offsetHeight) * 100}%\\\`,
                             backgroundSize: \\\`\\$\{previewRef.current!.offsetWidth * 2.5}px \\$\{previewRef.current!.offsetHeight * 2.5}px\\\`,
                             backgroundRepeat: 'no-repeat',
                             ...(analysisMode === 'python_cv' ? {} : getImgStyle())
                          }}
                        >
                           <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] absolute" />
                           <div className="w-full h-[1px] bg-sky-400/40 absolute" />
                           <div className="h-full w-[1px] bg-sky-400/40 absolute" />
                        </div>
                      )}
                    </div>
`;

content = content.replace(imgRegex, replacement);

// Remove the old magnifier jsx
const oldMagnifierStart = content.indexOf('{magnifier && !scanActive && (');
if (oldMagnifierStart !== -1) {
    const oldMagnifierEnd = content.indexOf(')}', oldMagnifierStart) + 2;
    // wait, there are multiple divs inside. Let's just find the exact block using regex or split.
}

fs.writeFileSync('components/ImageAnalysisModule.tsx', content);
