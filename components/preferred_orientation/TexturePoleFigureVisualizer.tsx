import React, { useState, useMemo } from 'react';
import { CircleDot, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';
import { calculateCombinedTextureFactor, TextureModelType } from '../../utils/preferredOrientationPhysics';

interface TexturePoleFigureVisualizerProps {
  rValue: number;
  r2Value?: number;
  fraction: number;
  textureModel: TextureModelType;
  primaryAxis: string;
  secondaryAxis?: string;
  c2Value?: number;
  c4Value?: number;
  vmfKappa?: number;
}

export const TexturePoleFigureVisualizer: React.FC<TexturePoleFigureVisualizerProps> = ({
  rValue,
  r2Value = 1.0,
  fraction,
  textureModel,
  primaryAxis,
  secondaryAxis = '1, 0, 0',
  c2Value = 0.6,
  c4Value = -0.2,
  vmfKappa = 2.5
}) => {
  const [projectionType, setProjectionType] = useState<'Schmidt' | 'Wulff' | 'RadialCut'>('Schmidt');
  const [polarHover, setPolarHover] = useState<{ x: number; y: number; angle: number; mud: number; tiltDeg: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Compute 2D continuous pole figure path
  const polarOdfPath = useMemo(() => {
    const points: string[] = [];
    const center = 100;
    const baseRadius = 60 * zoomLevel;

    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      const alpha = deg > 180 ? 360 - deg : deg;
      const finalAlpha = alpha > 90 ? 180 - alpha : alpha;

      const mud = calculateCombinedTextureFactor(finalAlpha, finalAlpha, {
        model: textureModel,
        r1: rValue,
        r2: r2Value,
        f1: fraction,
        f2: 0,
        c2: c2Value,
        c4: c4Value,
        kappa: vmfKappa
      });

      let scaledRadius = baseRadius;
      if (projectionType === 'Schmidt') {
        scaledRadius = Math.min(baseRadius * Math.sqrt(Math.max(0.01, mud)), 94);
      } else if (projectionType === 'Wulff') {
        scaledRadius = Math.min(baseRadius * (mud / (1 + mud / 2.5)), 94);
      } else {
        scaledRadius = Math.min(baseRadius * Math.min(mud, 2.5), 94);
      }

      const x = center + scaledRadius * Math.sin(rad);
      const y = center - scaledRadius * Math.cos(rad);

      if (deg === 0) {
        points.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ') + ' Z';
  }, [rValue, r2Value, fraction, textureModel, c2Value, c4Value, vmfKappa, projectionType, zoomLevel]);

  const handlePolarMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * 200;
    const svgY = (y / rect.height) * 200;
    const dx = svgX - 100;
    const dy = 100 - svgY;
    let rad = Math.atan2(dx, dy);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const tiltDeg = Math.min(90, (distFromCenter / 90) * 90);

    const alphaAngle = deg > 180 ? 360 - deg : deg;
    const finalAlpha = alphaAngle > 90 ? 180 - alphaAngle : alphaAngle;

    const mud = calculateCombinedTextureFactor(tiltDeg, tiltDeg, {
      model: textureModel,
      r1: rValue,
      r2: r2Value,
      f1: fraction,
      f2: 0,
      c2: c2Value,
      c4: c4Value,
      kappa: vmfKappa
    });

    setPolarHover({ x: svgX, y: svgY, angle: deg, mud, tiltDeg });
  };

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-teal-400/30 transition-all rounded-[2rem] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between backdrop-blur-md">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 dark:bg-teal-500/10 rounded-lg border border-teal-200 dark:border-teal-500/20 shadow-inner">
              <CircleDot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-black text-slate-800 dark:text-slate-200 tracking-widest font-sans">
                Stereographic Pole Figure
              </h3>
            </div>
          </div>

          {/* Projection Type Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
            {(['Schmidt', 'Wulff', 'RadialCut'] as const).map((proj) => (
              <button
                key={proj}
                onClick={() => setProjectionType(proj)}
                className={`text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all ${
                  projectionType === proj
                    ? 'bg-teal-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {proj === 'Schmidt' ? 'Schmidt (Equal Area)' : proj === 'Wulff' ? 'Wulff (Equal Angle)' : 'Radial Cut'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold mb-3">
          <span>Multiples of Uniform Distribution (MUD)</span>
          <span>Axis: [{primaryAxis}]</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex justify-center items-center py-4 bg-white dark:bg-black/60 rounded-[2rem] border border-slate-200 dark:border-white/5 relative shadow-inner my-auto select-none">
        <svg
          width="210"
          height="210"
          className="overflow-visible cursor-crosshair filter drop-shadow-md"
          onMouseMove={handlePolarMouseMove}
          onMouseLeave={() => setPolarHover(null)}
        >
          <defs>
            <radialGradient id="mudHeatmapGlowV2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={rValue < 1 ? "#2dd4bf" : "#f43f5e"} stopOpacity={0.5} />
              <stop offset="50%" stopColor={rValue < 1 ? "#0284c7" : "#e11d48"} stopOpacity={0.25} />
              <stop offset="85%" stopColor={rValue < 1 ? "#6366f1" : "#be123c"} stopOpacity={0.08} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Grid Concentric Rings (Tilt Angles 30°, 60°, 90°) */}
          <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="2 3" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.2" />

          {/* Azimuth Angle Grid Lines (0°, 45°, 90°, 135°) */}
          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 4" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="2 4" />
          <line x1="36.4" y1="36.4" x2="163.6" y2="163.6" stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="2 4" />
          <line x1="36.4" y1="163.6" x2="163.6" y2="36.4" stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="2 4" />

          {/* Labels */}
          <text x="100" y="8" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold">ND (0°)</text>
          <text x="194" y="103" fill="#64748b" fontSize="8" textAnchor="start" className="font-mono font-bold">RD (90°)</text>
          <text x="100" y="200" fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold">180°</text>
          <text x="6" y="103" fill="#64748b" fontSize="8" textAnchor="end" className="font-mono font-bold">TD (270°)</text>

          {/* Random Baseline Marker (MUD = 1.0) */}
          <circle cx="100" cy="100" r="60" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />

          {/* Active ODF / Texture Distribution Contour */}
          <path
            d={polarOdfPath}
            fill="url(#mudHeatmapGlowV2)"
            stroke={rValue < 1 ? "#2dd4bf" : "#f43f5e"}
            strokeWidth="2.5"
            className="transition-all duration-300"
          />

          {/* Central Pole Normal Marker */}
          <circle cx="100" cy="100" r="3" fill="#2dd4bf" stroke="#0f172a" strokeWidth="1.5" />

          {/* Interactive Hover Point & Crosshairs */}
          {polarHover && (
            <g>
              <line x1="100" y1="100" x2={polarHover.x} y2={polarHover.y} stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx={polarHover.x} cy={polarHover.y} r="6" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-ping" />
              <circle cx={polarHover.x} cy={polarHover.y} r="3.5" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      {/* Hover Readout HUD */}
      <div className="h-9 mt-3 flex items-center justify-center">
        {polarHover ? (
          <div className="w-full bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-500/20 flex justify-between items-center text-[10px] font-mono shadow-inner">
            <span className="text-slate-600 dark:text-slate-400">Tilt χ: <strong className="text-teal-600 dark:text-teal-400">{polarHover.tiltDeg.toFixed(1)}°</strong></span>
            <span className="text-slate-600 dark:text-slate-400">Azimuth φ: <strong className="text-teal-600 dark:text-teal-400">{polarHover.angle.toFixed(0)}°</strong></span>
            <span className="text-slate-600 dark:text-slate-400">Pole Density: <strong className="text-teal-600 dark:text-teal-400">{polarHover.mud.toFixed(3)} MUD</strong></span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 font-sans italic text-center w-full flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" /> Hover over pole figure to inspect tilt angle & MUD density
          </div>
        )}
      </div>
    </div>
  );
};
