import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Beaker, Clock, Droplets, Leaf, Activity as ActivityIcon } from 'lucide-react';
import { MATERIAL_DB } from '../utils/materialDB';

interface TimelineEvent {
  id: string;
  timestamp: string;
  materialName: string;
  category: 'water' | 'tobacco' | 'vitamin' | 'meat' | 'wine' | 'other';
  impact: string;
  icon: React.ReactNode;
  dSpacings: number[];
}

export const CrystalinLifecycleModule: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Generate simulated timeline based on the recently added materials
    
    // Helper to find material by partial name
    const findMaterial = (query: string) => MATERIAL_DB.find(m => m.name.toLowerCase().includes(query.toLowerCase()));

    const waterMat = findMaterial('Ice Ih Crystalline'); // water
    const tobaccoMat = findMaterial('Nicotine Hydrogen Tartrate'); // tobacco
    const wineMat = findMaterial('Trans-Resveratrol Crystalline'); // wine
    const meatMat = findMaterial('Creatine Monohydrate'); // meat
    const vitaminMat = findMaterial('L-Ascorbic Acid'); // vitamin

    const baseTime = new Date();

    const generateImpact = (mat: any) => {
      if (!mat) return { text: 'Negligible impact.', dSpacings: [] };
      const peaks = mat.pattern.split('\n').map((p: string) => parseFloat(p.split(',')[0]));
      // Simulated D-spacing calculation for wavelength 1.5406
      const dSpacings = peaks.map((twoTheta: number) => {
        const thetaRad = (twoTheta / 2) * (Math.PI / 180);
        return 1.5406 / (2 * Math.sin(thetaRad));
      });
      return {
        text: `Shifted primary diffraction peaks due to ${peaks.length} intense planes. Maximum d-spacing: ${Math.max(...dSpacings).toFixed(3)} Å.`,
        dSpacings: dSpacings.slice(0, 3) 
      };
    };

    const newEvents: TimelineEvent[] = [];

    if (waterMat) {
      const impact = generateImpact(waterMat);
      newEvents.push({
        id: 'water',
        timestamp: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 5).toLocaleString(),
        materialName: waterMat.name,
        category: 'water',
        impact: impact.text,
        dSpacings: impact.dSpacings,
        icon: <Droplets className="w-5 h-5 text-blue-500" />
      });
    }

    if (tobaccoMat) {
      const impact = generateImpact(tobaccoMat);
      newEvents.push({
        id: 'tobacco',
        timestamp: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 4).toLocaleString(),
        materialName: tobaccoMat.name,
        category: 'tobacco',
        impact: impact.text,
        dSpacings: impact.dSpacings,
        icon: <Leaf className="w-5 h-5 text-amber-600" />
      });
    }

    if (wineMat) {
      const impact = generateImpact(wineMat);
      newEvents.push({
        id: 'wine',
        timestamp: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 3).toLocaleString(),
        materialName: wineMat.name,
        category: 'wine',
        impact: impact.text,
        dSpacings: impact.dSpacings,
        icon: <Beaker className="w-5 h-5 text-purple-600" />
      });
    }

    if (meatMat) {
      const impact = generateImpact(meatMat);
      newEvents.push({
        id: 'meat',
        timestamp: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 2).toLocaleString(),
        materialName: meatMat.name,
        category: 'meat',
        impact: impact.text,
        dSpacings: impact.dSpacings,
        icon: <ActivityIcon className="w-5 h-5 text-red-500" />
      });
    }

    if (vitaminMat) {
      const impact = generateImpact(vitaminMat);
      newEvents.push({
        id: 'vitamin',
        timestamp: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 1).toLocaleString(),
        materialName: vitaminMat.name,
        category: 'vitamin',
        impact: impact.text,
        dSpacings: impact.dSpacings,
        icon: <Activity className="w-5 h-5 text-emerald-500" />
      });
    }

    setEvents(newEvents.reverse()); // latest first

  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            Crystalin Lifecycle Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tracking chronological synthesis steps and their impact on Bragg diffractograms.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-12">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute -left-[17px] top-1 bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                {event.icon}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{event.materialName}</h3>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-md shadow-sm border border-slate-200 dark:border-white/10">
                    {event.timestamp}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  {event.impact}
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top D-Spacings:</span>
                  <div className="flex flex-wrap gap-2">
                    {event.dSpacings.map((ds, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-mono rounded border border-indigo-100 dark:border-indigo-800/50">
                        {ds.toFixed(4)} Å
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="pl-8 text-sm text-slate-500 italic">No timeline data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
