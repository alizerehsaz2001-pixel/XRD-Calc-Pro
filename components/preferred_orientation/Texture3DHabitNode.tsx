import React, { useState, useRef } from 'react';
import { Rotate3d, Play, Pause, RefreshCw, Layers } from 'lucide-react';

interface Texture3DHabitNodeProps {
  rValue: number;
  habitModel: 'Platelet' | 'Needle' | 'Sheet' | 'Equiaxed';
  primaryAxis: string;
}

export const Texture3DHabitNode: React.FC<Texture3DHabitNodeProps> = ({
  rValue,
  habitModel,
  primaryAxis
}) => {
  const [habitRotX, setHabitRotX] = useState<number>(25);
  const [habitRotY, setHabitRotY] = useState<number>(35);
  const [autoSpinHabit, setAutoSpinHabit] = useState<boolean>(false);
  const [isDraggingHabit, setIsDraggingHabit] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 25, rotY: 35 });

  return (
    <div 
      className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-indigo-400/30 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md"
      onMouseMove={(e) => {
        if (!isDraggingHabit) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setHabitRotY(dragStart.current.rotY + dx * 0.5);
        setHabitRotX(dragStart.current.rotX - dy * 0.5);
      }}
      onMouseUp={() => setIsDraggingHabit(false)}
      onMouseLeave={() => setIsDraggingHabit(false)}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
              <Rotate3d className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest font-sans">
              3D Crystallite Habit
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoSpinHabit(!autoSpinHabit)}
              className={`text-[9px] font-bold px-2 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                autoSpinHabit 
                  ? 'bg-indigo-500 text-white border-indigo-500' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              {autoSpinHabit ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {autoSpinHabit ? 'Orbiting' : 'Auto Orbit'}
            </button>
            <button
              onClick={() => { setHabitRotX(25); setHabitRotY(35); }}
              className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-all cursor-pointer"
              title="Reset Viewpoint"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">
          <span>Morphology: {rValue < 1.0 ? 'Oblate Platelet' : rValue > 1.0 ? 'Prolate Needle' : 'Equiaxed Sphere'}</span>
          <span>Vector: [{primaryAxis}]</span>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div 
        className="flex justify-center items-center py-4 bg-white dark:bg-black/60 rounded-[2rem] border border-slate-200 dark:border-white/5 relative shadow-inner select-none cursor-grab active:cursor-grabbing my-auto"
        onMouseDown={(e) => {
          setIsDraggingHabit(true);
          dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            rotX: habitRotX,
            rotY: habitRotY
          };
        }}
      >
        <svg width="210" height="210" className="overflow-visible filter drop-shadow-lg">
          <defs>
            <radialGradient id="habitShading3D" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0f172a" stopOpacity={0.7} />
            </radialGradient>
          </defs>

          {/* Coordinate Frame in Corner */}
          <g opacity="0.6">
            <line x1="20" y1="185" x2="48" y2="185" stroke="#ef4444" strokeWidth="1.5" />
            <text x="52" y="188" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">x</text>

            <line x1="20" y1="185" x2="20" y2="157" stroke="#2dd4bf" strokeWidth="1.5" />
            <text x="18" y="152" fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">z</text>

            <line x1="20" y1="185" x2="36" y2="173" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="40" y="171" fill="#3b82f6" fontSize="8" fontWeight="bold" fontFamily="monospace">y</text>
          </g>

          {/* 3D Polygon Mesh Computation */}
          {(() => {
            let radius = 36;
            let height = 24;

            if (rValue < 1.0) {
              radius = 38 + (1 - rValue) * 22;
              height = Math.max(6, 22 * rValue);
            } else if (rValue > 1.0) {
              radius = Math.max(12, 30 / Math.sqrt(rValue));
              height = Math.min(80, 16 * rValue);
            }

            const activeRotY = autoSpinHabit ? (habitRotY + (Date.now() / 30) % 360) : habitRotY;

            const vertices3D = [];
            for (let i = 0; i < 6; i++) {
              const angle = (i * 60 * Math.PI) / 180;
              vertices3D.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: -height });
            }
            for (let i = 0; i < 6; i++) {
              const angle = (i * 60 * Math.PI) / 180;
              vertices3D.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: height });
            }

            const projectPoint = (x: number, y: number, z: number, rx: number, ry: number) => {
              const pitch = (rx * Math.PI) / 180;
              const yaw = (ry * Math.PI) / 180;
              
              const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
              const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
              
              const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
              const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
              
              const d = 300;
              const factor = d / (d + z2);
              const center = 100;
              return { x: center + x1 * factor, y: center - y2 * factor, depth: z2 };
            };

            const pts = vertices3D.map(v => projectPoint(v.x, v.y, v.z, habitRotX, activeRotY));

            const faces = [
              { indices: [5, 4, 3, 2, 1, 0], color: 'rgba(99, 102, 241, 0.12)', stroke: 'rgba(99, 102, 241, 0.45)', id: 'bottom' },
              { indices: [6, 7, 8, 9, 10, 11], color: rValue < 1.0 ? 'rgba(45, 212, 191, 0.4)' : 'rgba(45, 212, 191, 0.2)', stroke: '#2dd4bf', id: 'top' },
              ...[0, 1, 2, 3, 4, 5].map(i => {
                const next = (i + 1) % 6;
                return {
                  indices: [i, next, next + 6, i + 6],
                  color: rValue < 1.0 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(99, 102, 241, 0.25)',
                  stroke: 'rgba(255, 255, 255, 0.25)',
                  id: `side-${i}`
                };
              })
            ];

            const sortedFaces = faces.map(face => {
              const avgDepth = face.indices.reduce((sum, idx) => sum + pts[idx].depth, 0) / face.indices.length;
              return { ...face, avgDepth };
            }).sort((a, b) => b.avgDepth - a.avgDepth);

            const axisTop = projectPoint(0, 0, height + 35, habitRotX, activeRotY);

            return (
              <>
                {sortedFaces.map((face, fIdx) => {
                  const pointsStr = face.indices.map(idx => `${pts[idx].x.toFixed(1)},${pts[idx].y.toFixed(1)}`).join(' ');
                  const isTop = face.id === 'top';
                  return (
                    <polygon
                      key={fIdx}
                      points={pointsStr}
                      fill={isTop ? 'url(#habitShading3D)' : face.color}
                      stroke={face.stroke}
                      strokeWidth={isTop ? "2" : "1"}
                      strokeLinejoin="round"
                    />
                  );
                })}

                {/* Preferred Direction Fiber Ray */}
                <g>
                  <line 
                    x1={100} y1={100} 
                    x2={axisTop.x} y2={axisTop.y} 
                    stroke="#2dd4bf" 
                    strokeWidth="2.5" 
                    className="filter drop-shadow-[0_0_8px_rgba(45,212,191,0.7)]"
                  />
                  <circle cx={axisTop.x} cy={axisTop.y} r="3" fill="#2dd4bf" />
                  <text 
                    x={axisTop.x + 6} y={axisTop.y - 4} 
                    fill="#2dd4bf" 
                    fontSize="8" 
                    fontWeight="black" 
                    fontFamily="monospace"
                  >
                    [{primaryAxis}]
                  </text>
                </g>
              </>
            );
          })()}
        </svg>
      </div>

      <div className="mt-3 text-[10px] text-slate-500 font-sans text-center">
        Aspect ratio modeled from March parameter <strong className="text-indigo-600 dark:text-indigo-400 font-bold">r = {rValue.toFixed(3)}</strong>
      </div>
    </div>
  );
};
