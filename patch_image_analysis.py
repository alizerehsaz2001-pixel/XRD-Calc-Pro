import re

with open('components/ImageAnalysisModule.tsx', 'r') as f:
    content = f.read()

# Add a magnifier effect
content = content.replace("const fileInputRef = useRef<HTMLInputElement>(null);", "const fileInputRef = useRef<HTMLInputElement>(null);\n  const previewRef = useRef<HTMLDivElement>(null);\n  const [magnifier, setMagnifier] = useState<{x: number, y: number} | null>(null);")

content = content.replace("onMouseMove={undefined}", "")

content = content.replace('key="preview"', 'key="preview"\n                    ref={previewRef}\n                    onMouseMove={(e) => {\n                      if (!previewRef.current) return;\n                      const rect = previewRef.current.getBoundingClientRect();\n                      setMagnifier({ x: e.clientX - rect.left, y: e.clientY - rect.top });\n                    }}\n                    onMouseLeave={() => setMagnifier(null)}')

magnifier_jsx = """
                    {magnifier && !scanActive && (
                      <div 
                        className="absolute pointer-events-none rounded-full border-2 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-50 overflow-hidden bg-black flex items-center justify-center"
                        style={{
                           width: '120px',
                           height: '120px',
                           left: magnifier.x - 60,
                           top: magnifier.y - 60,
                           backgroundImage: `url(${image})`,
                           backgroundPosition: `${(magnifier.x / previewRef.current!.offsetWidth) * 100}% ${(magnifier.y / previewRef.current!.offsetHeight) * 100}%`,
                           backgroundSize: `${previewRef.current!.offsetWidth * 2.5}px ${previewRef.current!.offsetHeight * 2.5}px`,
                           backgroundRepeat: 'no-repeat',
                           ...getImgStyle()
                        }}
                      >
                         <div className="w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,1)] absolute" />
                         <div className="w-full h-[1px] bg-sky-400/30 absolute" />
                         <div className="h-full w-[1px] bg-sky-400/30 absolute" />
                      </div>
                    )}
"""

content = content.replace("{/* Processed Filter Tabs overlay under the image */}", magnifier_jsx + "\n                    {/* Processed Filter Tabs overlay under the image */}")

with open('components/ImageAnalysisModule.tsx', 'w') as f:
    f.write(content)
