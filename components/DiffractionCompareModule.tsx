import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  GitCompare,
  Layers,
  Search,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { BraggResult } from '../types';
import { MATERIAL_DB } from '../utils/materialDB';
import { 
  CompareViewMode, 
  DiffTheme, 
  PeakItem 
} from './diffraction_compare/types';
import { 
  generateSynthesizedProfile, 
  computeSpectralMetrics, 
  computePeakIndexing, 
  solveMultiPhaseFractions,
  extractMaterialPeaks,
  parseCustomPattern
} from './diffraction_compare/compareUtils';
import { PresetScenariosRibbon } from './diffraction_compare/PresetScenariosRibbon';
import { SampleConfigurationPanel } from './diffraction_compare/SampleConfigurationPanel';
import { DiagnosticsAndMetricsPanel } from './diffraction_compare/DiagnosticsAndMetricsPanel';
import { CompareChartViewer } from './diffraction_compare/CompareChartViewer';
import { AutoSearchMatchModal } from './diffraction_compare/AutoSearchMatchModal';
import { GuideModal } from './diffraction_compare/GuideModal';

interface DiffractionCompareModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string;
}

export const DiffractionCompareModule: React.FC<DiffractionCompareModuleProps> = ({
  activeResults = [],
  activeMaterialName = 'Active Workspace Sample'
}) => {
  const { t } = useTranslation();

  // Materials database list
  const materialsDb = MATERIAL_DB;

  // Sample A State
  const [sampleAInputMode, setSampleAInputMode] = useState<'active' | 'custom' | 'file'>(
    activeResults && activeResults.length > 0 ? 'active' : 'custom'
  );
  const [customNameA, setCustomNameA] = useState('Hydroxyapatite (Experimental)');
  const [customFormulaA, setCustomFormulaA] = useState('Ca10(PO4)6(OH)2');
  const [customPatternA, setCustomPatternA] = useState(
    '25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)'
  );

  // Sample B State
  const [sampleBInputMode, setSampleBInputMode] = useState<'preset' | 'custom' | 'file'>('preset');
  const [selectedSampleBIndex, setSelectedSampleBIndex] = useState(0);
  const [customNameB, setCustomNameB] = useState('Synthetic Standard B');
  const [customFormulaB, setCustomFormulaB] = useState('Ref-Phase');
  const [customPatternB, setCustomPatternB] = useState(
    '25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)'
  );

  // Secondary Phase C State (Multi-phase mixture)
  const [hasPhaseC, setHasPhaseC] = useState(false);
  const [selectedPhaseCIndex, setSelectedPhaseCIndex] = useState(1);
  const [scalePhaseC, setScalePhaseC] = useState(0.35);

  // Chart & Display State
  const [viewMode, setViewMode] = useState<CompareViewMode>('stacked');
  const [diffTheme, setDiffTheme] = useState<DiffTheme>('neon');
  const [showDiffArea, setShowDiffArea] = useState(true);
  const [showPeakMarkers, setShowPeakMarkers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [shiftTwoTheta, setShiftTwoTheta] = useState(0.0);
  const [scaleSampleB, setScaleSampleB] = useState(1.0);

  // Zoom range
  const [zoomRange, setZoomRange] = useState<{ left: number; right: number }>({ left: 10, right: 90 });

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSearchMatchOpen, setIsSearchMatchOpen] = useState(false);

  // Derived Material A
  const materialA = useMemo(() => {
    if (sampleAInputMode === 'active' && activeResults && activeResults.length > 0) {
      return {
        name: activeMaterialName || 'Active Material',
        formula: '',
        isUserSample: true,
        results: activeResults
      };
    }
    return {
      name: customNameA || 'Custom Sample A',
      formula: customFormulaA,
      pattern: customPatternA
    };
  }, [sampleAInputMode, activeResults, activeMaterialName, customNameA, customFormulaA, customPatternA]);

  // Derived Material B
  const materialB = useMemo(() => {
    if (sampleBInputMode === 'preset' && materialsDb[selectedSampleBIndex]) {
      return materialsDb[selectedSampleBIndex];
    }
    return {
      name: customNameB || 'Custom Reference B',
      formula: customFormulaB,
      pattern: customPatternB
    };
  }, [sampleBInputMode, materialsDb, selectedSampleBIndex, customNameB, customFormulaB, customPatternB]);

  // Derived Material C (Optional Phase 2)
  const materialC = useMemo(() => {
    if (!hasPhaseC) return null;
    return materialsDb[selectedPhaseCIndex] || null;
  }, [hasPhaseC, materialsDb, selectedPhaseCIndex]);

  // Peak lists
  const targetPeaksA = useMemo(() => extractMaterialPeaks(materialA), [materialA]);
  const refPeaksB = useMemo(() => extractMaterialPeaks(materialB), [materialB]);

  // Generate continuous synthetic profiles
  const profileSynthesis = useMemo(() => {
    return generateSynthesizedProfile(materialA, materialB, materialC, {
      shiftTwoThetaB: shiftTwoTheta,
      scaleSampleB: scaleSampleB,
      scaleSampleC: hasPhaseC ? scalePhaseC : 0,
      minTheta: 10,
      maxTheta: 90,
      step: 0.1
    });
  }, [materialA, materialB, materialC, shiftTwoTheta, scaleSampleB, hasPhaseC, scalePhaseC]);

  // Compute crystallographic metrics
  const metrics = useMemo(() => {
    return computeSpectralMetrics(profileSynthesis.points);
  }, [profileSynthesis.points]);

  // Compute peak indexing & shifts
  const indexing = useMemo(() => {
    return computePeakIndexing(profileSynthesis.peaksA, profileSynthesis.peaksB);
  }, [profileSynthesis.peaksA, profileSynthesis.peaksB]);

  // Compute 2-phase NNLS fractions
  const phaseFractions = useMemo(() => {
    const arrA = profileSynthesis.points.map(p => p.intensityA);
    const arrB = profileSynthesis.points.map(p => p.intensityB);
    const arrC = hasPhaseC ? profileSynthesis.points.map(p => p.intensityC || 0) : [];
    return solveMultiPhaseFractions(arrA, arrB, arrC);
  }, [profileSynthesis.points, hasPhaseC]);

  // Auto-alignment handler
  const handleAutoAlign = useCallback(() => {
    const peaksA = extractMaterialPeaks(materialA);
    const peaksB = extractMaterialPeaks(materialB);
    if (peaksA.length === 0 || peaksB.length === 0) return;

    // Align strongest peak of A with nearest peak of B
    const strongestA = [...peaksA].sort((a, b) => b.intensity - a.intensity)[0];
    let bestB: PeakItem | null = null;
    let minDiff = Infinity;

    peaksB.forEach(p => {
      const diff = Math.abs(p.twoTheta - strongestA.twoTheta);
      if (diff < minDiff) {
        minDiff = diff;
        bestB = p;
      }
    });

    if (bestB && minDiff <= 1.2) {
      const requiredShift = Number((strongestA.twoTheta - bestB.twoTheta).toFixed(2));
      setShiftTwoTheta(requiredShift);
    }
  }, [materialA, materialB]);

  // Scenario Presets Handler
  const handleSelectScenario = (key: string) => {
    setSampleAInputMode('custom');
    setShiftTwoTheta(0);
    setScaleSampleB(1.0);

    if (key === 'pure-ha') {
      setCustomNameA('Pure Hydroxyapatite (HAp 1000°C)');
      setCustomFormulaA('Ca10(PO4)6(OH)2');
      setCustomPatternA('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)');
      setSampleBInputMode('custom');
      setCustomNameB('HAp Reference Standard (ICDD)');
      setCustomFormulaB('Ca10(PO4)6(OH)2');
      setCustomPatternB('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)');
      setHasPhaseC(false);
    } else if (key === 'strained-ha') {
      setCustomNameA('Strained / Substituted HAp (Zn-doped)');
      setCustomFormulaA('Ca9.5Zn0.5(PO4)6(OH)2');
      setCustomPatternA('25.99(30), 31.89(100), 32.31(70), 33.02(60), 34.16(25), 39.93(20), 46.83(35), 49.58(30)');
      setSampleBInputMode('custom');
      setCustomNameB('Pure HAp Standard');
      setCustomFormulaB('Ca10(PO4)6(OH)2');
      setCustomPatternB('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)');
      setHasPhaseC(false);
    } else if (key === 'biphasic-ha-tcp') {
      setCustomNameA('Biphasic Calcium Phosphate (HAp + β-TCP)');
      setCustomFormulaA('HAp / β-TCP');
      setCustomPatternA('25.87(25), 27.80(20), 31.02(50), 31.77(100), 32.19(60), 32.90(45), 34.37(35), 46.71(30)');
      setSampleBInputMode('custom');
      setCustomNameB('HAp Phase 1');
      setCustomFormulaB('Ca10(PO4)6(OH)2');
      setCustomPatternB('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 46.71(35)');
      setHasPhaseC(true);
      setScalePhaseC(0.5);
    } else if (key === 'tio2-polymorphs') {
      setCustomNameA('TiO2 Anatase/Rutile Mixed Nanoparticles');
      setCustomFormulaA('TiO2');
      setCustomPatternA('25.30(100), 27.45(40), 36.10(20), 37.80(25), 41.25(15), 48.05(35), 54.30(60), 55.05(20)');
      setSampleBInputMode('custom');
      setCustomNameB('TiO2 Anatase (Standard)');
      setCustomFormulaB('TiO2');
      setCustomPatternB('25.30(100), 37.80(20), 48.05(35), 53.90(20), 55.05(20), 62.70(15)');
      setHasPhaseC(false);
    } else if (key === 'battery-lifepo4') {
      setCustomNameA('LiFePO4 Cathode (Delithiated / FePO4)');
      setCustomFormulaA('Li1-xFePO4');
      setCustomPatternA('17.15(25), 20.65(30), 25.55(100), 29.70(45), 32.20(30), 35.60(80), 36.50(40)');
      setSampleBInputMode('custom');
      setCustomNameB('Pristine LiFePO4 Triphylite');
      setCustomFormulaB('LiFePO4');
      setCustomPatternB('17.10(20), 20.50(25), 25.40(100), 29.50(40), 32.00(25), 35.40(75), 36.30(35)');
      setHasPhaseC(false);
    } else if (key === 'quartz') {
      setCustomNameA('Alpha-Quartz Mineral Sample');
      setCustomFormulaA('SiO2');
      setCustomPatternA('20.86(22), 26.64(100), 36.54(12), 39.46(8), 40.29(7), 42.45(8), 45.79(3), 50.14(14), 59.96(9), 67.74(7)');
      setSampleBInputMode('custom');
      setCustomNameB('Standard Low Quartz');
      setCustomFormulaB('SiO2');
      setCustomPatternB('20.86(22), 26.64(100), 36.54(12), 39.46(8), 40.29(7), 42.45(8), 45.79(3), 50.14(14), 59.96(9), 67.74(7)');
      setHasPhaseC(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    let csv = '2Theta,Intensity_SampleA,Intensity_ModelB,Difference_Residual\n';
    profileSynthesis.points.forEach(p => {
      csv += `${p.twoTheta},${p.intensityA},${p.intensityTotalModel || p.intensityB},${p.difference}\n`;
    });

    csv += '\n--- INDEXED REFLECTIONS ---\n';
    csv += 'Index,2Theta_Exp,2Theta_Ref,Miller_hkl,d_Spacing_A,d_Spacing_B,Shift_Delta2Theta,Status\n';
    indexing.indexedPeaks.forEach(p => {
      csv += `${p.id},${p.twoThetaA || ''},${p.twoThetaB || ''},"${p.hklA || p.hklB || ''}",${p.dSpacingA},${p.dSpacingB},${p.shift || ''},${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `XRD_Diffraction_Compare_${materialA.name.replace(/\s+/g, '_')}_vs_${materialB.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Jump to peak position on chart
  const handleJumpToPeak = (twoTheta: number) => {
    const leftVal = Math.max(10, Math.floor(twoTheta - 5));
    const rightVal = Math.min(90, Math.ceil(twoTheta + 5));
    setZoomRange({ left: leftVal, right: rightVal });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Top Ribbon: Scenarios & Quick Actions */}
      <PresetScenariosRibbon
        onSelectScenario={handleSelectScenario}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSearchMatch={() => setIsSearchMatchOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* 2. Sample Configuration Panel */}
      <SampleConfigurationPanel
        sampleAInputMode={sampleAInputMode}
        setSampleAInputMode={setSampleAInputMode}
        activeMaterialName={activeMaterialName}
        customNameA={customNameA}
        setCustomNameA={setCustomNameA}
        customFormulaA={customFormulaA}
        setCustomFormulaA={setCustomFormulaA}
        customPatternA={customPatternA}
        setCustomPatternA={setCustomPatternA}
        
        sampleBInputMode={sampleBInputMode}
        setSampleBInputMode={setSampleBInputMode}
        selectedSampleBIndex={selectedSampleBIndex}
        setSelectedSampleBIndex={setSelectedSampleBIndex}
        customNameB={customNameB}
        setCustomNameB={setCustomNameB}
        customFormulaB={customFormulaB}
        setCustomFormulaB={setCustomFormulaB}
        customPatternB={customPatternB}
        setCustomPatternB={setCustomPatternB}
        
        materialsDb={materialsDb}
        
        hasPhaseC={hasPhaseC}
        setHasPhaseC={setHasPhaseC}
        selectedPhaseCIndex={selectedPhaseCIndex}
        setSelectedPhaseCIndex={setSelectedPhaseCIndex}
        scalePhaseC={scalePhaseC}
        setScalePhaseC={setScalePhaseC}
      />

      {/* 3. Main Recharts Diffraction Profile Viewer */}
      <CompareChartViewer
        points={profileSynthesis.points}
        viewMode={viewMode}
        setViewMode={setViewMode}
        diffTheme={diffTheme}
        setDiffTheme={setDiffTheme}
        showDiffArea={showDiffArea}
        setShowDiffArea={setShowDiffArea}
        showPeakMarkers={showPeakMarkers}
        setShowPeakMarkers={setShowPeakMarkers}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        shiftTwoTheta={shiftTwoTheta}
        setShiftTwoTheta={setShiftTwoTheta}
        scaleSampleB={scaleSampleB}
        setScaleSampleB={setScaleSampleB}
        onAutoAlign={handleAutoAlign}
        left={zoomRange.left}
        right={zoomRange.right}
        onZoomChange={(l, r) => setZoomRange({ left: l, right: r })}
        onResetZoom={() => setZoomRange({ left: 10, right: 90 })}
        materialAName={materialA.name}
        materialBName={materialB.name}
        materialCName={materialC?.name}
        peaksA={profileSynthesis.peaksA}
        peaksB={profileSynthesis.peaksB}
        hasPhaseC={hasPhaseC}
      />

      {/* 4. Quantitative Diagnostics & Metrics Sub-Engine */}
      <DiagnosticsAndMetricsPanel
        metrics={metrics}
        meanShift={indexing.meanShift}
        avgStrain={indexing.avgStrain}
        primaryPhasePurity={indexing.primaryPhasePurity}
        secondaryPhaseEst={indexing.secondaryPhaseEst}
        extraInA={indexing.extraInA}
        missingInA={indexing.missingInA}
        indexedPeaks={indexing.indexedPeaks}
        materialAName={materialA.name}
        materialBName={materialB.name}
        materialCName={materialC?.name}
        fracB={phaseFractions.fracB}
        fracC={phaseFractions.fracC}
        onJumpToPeak={handleJumpToPeak}
      />

      {/* Auto Search-Match Modal */}
      <AutoSearchMatchModal
        isOpen={isSearchMatchOpen}
        onClose={() => setIsSearchMatchOpen(false)}
        targetPeaks={targetPeaksA}
        sampleAName={materialA.name}
        materialsDb={materialsDb}
        onSelectAsReferenceB={(mat) => {
          const idx = materialsDb.findIndex(m => m.name === mat.name);
          if (idx !== -1) {
            setSelectedSampleBIndex(idx);
            setSampleBInputMode('preset');
          } else {
            setCustomNameB(mat.name);
            setCustomFormulaB(mat.formula || '');
            setCustomPatternB(mat.pattern || '');
            setSampleBInputMode('custom');
          }
        }}
        onSelectAsPhaseC={(mat) => {
          const idx = materialsDb.findIndex(m => m.name === mat.name);
          if (idx !== -1) {
            setSelectedPhaseCIndex(idx);
          }
          setHasPhaseC(true);
        }}
      />

      {/* Theoretical Interpretation Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
