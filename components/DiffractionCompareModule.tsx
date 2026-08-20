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

  // Tertiary Phase D State
  const [hasPhaseD, setHasPhaseD] = useState(false);
  const [selectedPhaseDIndex, setSelectedPhaseDIndex] = useState(2);
  const [scalePhaseD, setScalePhaseD] = useState(0.20);

  // Chart & Display State
  const [viewMode, setViewMode] = useState<CompareViewMode>('unified');
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

  // Derived Material D (Optional Phase 3)
  const materialD = useMemo(() => {
    if (!hasPhaseD) return null;
    return materialsDb[selectedPhaseDIndex] || null;
  }, [hasPhaseD, materialsDb, selectedPhaseDIndex]);

  // Peak lists
  const targetPeaksA = useMemo(() => extractMaterialPeaks(materialA), [materialA]);
  const refPeaksB = useMemo(() => extractMaterialPeaks(materialB), [materialB]);
  const peaksC = useMemo(() => materialC ? extractMaterialPeaks(materialC) : [], [materialC]);
  const peaksD = useMemo(() => materialD ? extractMaterialPeaks(materialD) : [], [materialD]);

  // Generate continuous synthetic profiles
  const profileSynthesis = useMemo(() => {
    return generateSynthesizedProfile(materialA, materialB, materialC, materialD, {
      shiftTwoThetaB: shiftTwoTheta,
      scaleSampleB: scaleSampleB,
      scaleSampleC: hasPhaseC ? scalePhaseC : 0,
      scaleSampleD: hasPhaseD ? scalePhaseD : 0,
      minTheta: 10,
      maxTheta: 90,
      step: 0.1
    });
  }, [materialA, materialB, materialC, materialD, shiftTwoTheta, scaleSampleB, hasPhaseC, scalePhaseC, hasPhaseD, scalePhaseD]);

  // Compute crystallographic metrics
  const metrics = useMemo(() => {
    return computeSpectralMetrics(profileSynthesis.points);
  }, [profileSynthesis.points]);

  // Compute peak indexing & shifts
  const indexing = useMemo(() => {
    return computePeakIndexing(profileSynthesis.peaksA, profileSynthesis.peaksB);
  }, [profileSynthesis.peaksA, profileSynthesis.peaksB]);

  // Compute multi-phase NNLS fractions
  const phaseFractions = useMemo(() => {
    const arrA = profileSynthesis.points.map(p => p.intensityA);
    const arrB = profileSynthesis.points.map(p => p.intensityB);
    const arrC = hasPhaseC ? profileSynthesis.points.map(p => p.intensityC || 0) : [];
    const arrD = hasPhaseD ? profileSynthesis.points.map(p => p.intensityD || 0) : [];
    return solveMultiPhaseFractions(arrA, arrB, arrC, arrD);
  }, [profileSynthesis.points, hasPhaseC, hasPhaseD]);

  // Auto-alignment handler
  const handleAutoAlign = useCallback(() => {
    const pA = extractMaterialPeaks(materialA);
    const pB = extractMaterialPeaks(materialB);
    if (pA.length === 0 || pB.length === 0) return;

    const strongestA = [...pA].sort((a, b) => b.intensity - a.intensity)[0];
    let bestB: PeakItem | null = null;
    let minDiff = Infinity;

    pB.forEach(p => {
      const diff = Math.abs(p.twoTheta - strongestA.twoTheta);
      if (diff < minDiff) {
        minDiff = diff;
        bestB = p;
      }
    });

    if (bestB && minDiff <= 1.5) {
      const requiredShift = Number((strongestA.twoTheta - bestB.twoTheta).toFixed(2));
      setShiftTwoTheta(requiredShift);
    }
  }, [materialA, materialB]);

  // Swap Samples A and B
  const handleSwapSamples = useCallback(() => {
    const oldNameA = customNameA;
    const oldFormulaA = customFormulaA;
    const oldPatternA = customPatternA;

    setCustomNameA(materialB.name);
    setCustomFormulaA(materialB.formula || '');
    const matBPrefs = materialB as any;
    setCustomPatternA(matBPrefs.pattern || (matBPrefs.results ? matBPrefs.results.map((r: any) => `${r.twoTheta}, ${r.intensity}`).join('\n') : ''));
    setSampleAInputMode('custom');

    setCustomNameB(oldNameA);
    setCustomFormulaB(oldFormulaA);
    setCustomPatternB(oldPatternA);
    setSampleBInputMode('custom');
  }, [customNameA, customFormulaA, customPatternA, materialB]);

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
      setHasPhaseD(false);
    } else if (key === 'strained-ha') {
      setCustomNameA('Strained Zn-HAp (Lattice Distortion)');
      setCustomFormulaA('Ca9.5Zn0.5(PO4)6(OH)2');
      setCustomPatternA('25.99(30), 31.89(100), 32.31(70), 33.02(60), 34.16(25), 39.93(20), 46.83(35), 49.58(30)');
      setSampleBInputMode('custom');
      setCustomNameB('Pure HAp ICDD 09-0432');
      setCustomFormulaB('Ca10(PO4)6(OH)2');
      setCustomPatternB('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)');
      setHasPhaseC(false);
      setHasPhaseD(false);
    } else if (key === 'biphasic-ha-tcp') {
      setCustomNameA('Biphasic Bioceramic (65% HAp / 35% β-TCP)');
      setCustomFormulaA('HAp / β-TCP');
      setCustomPatternA('25.87(25), 27.80(20), 31.02(50), 31.77(100), 32.19(60), 32.90(45), 34.37(35), 46.71(30)');
      setSampleBInputMode('custom');
      setCustomNameB('HAp Matrix Standard');
      setCustomFormulaB('Ca10(PO4)6(OH)2');
      setCustomPatternB('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 46.71(35)');
      setHasPhaseC(true);
      setScalePhaseC(0.5);
      setHasPhaseD(false);
    } else if (key === 'triphasic-tio2') {
      setCustomNameA('TiO2 Polymorph Mix (Anatase + Rutile + Brookite)');
      setCustomFormulaA('TiO2');
      setCustomPatternA('25.30(100), 27.45(50), 30.81(25), 36.10(20), 37.80(25), 41.25(15), 48.05(35), 54.30(60)');
      setSampleBInputMode('custom');
      setCustomNameB('TiO2 Anatase Standard');
      setCustomFormulaB('TiO2');
      setCustomPatternB('25.30(100), 37.80(20), 48.05(35), 53.90(20), 55.05(20), 62.70(15)');
      setHasPhaseC(true);
      setScalePhaseC(0.45);
      setHasPhaseD(true);
      setScalePhaseD(0.25);
    } else if (key === 'battery-lifepo4') {
      setCustomNameA('LiFePO4 Cathode (Delithiated / FePO4)');
      setCustomFormulaA('Li1-xFePO4');
      setCustomPatternA('17.15(25), 20.65(30), 25.55(100), 29.70(45), 32.20(30), 35.60(80), 36.50(40)');
      setSampleBInputMode('custom');
      setCustomNameB('Pristine LiFePO4 Triphylite');
      setCustomFormulaB('LiFePO4');
      setCustomPatternB('17.10(20), 20.50(25), 25.40(100), 29.50(40), 32.00(25), 35.40(75), 36.30(35)');
      setHasPhaseC(false);
      setHasPhaseD(false);
    } else if (key === 'quartz') {
      setCustomNameA('Alpha-Quartz Mineral Specimen');
      setCustomFormulaA('SiO2');
      setCustomPatternA('20.86(22), 26.64(100), 36.54(12), 39.46(8), 40.29(7), 42.45(8), 45.79(3), 50.14(14), 59.96(9)');
      setSampleBInputMode('custom');
      setCustomNameB('Low Quartz NIST SRM 1878');
      setCustomFormulaB('SiO2');
      setCustomPatternB('20.86(22), 26.64(100), 36.54(12), 39.46(8), 40.29(7), 42.45(8), 45.79(3), 50.14(14), 59.96(9)');
      setHasPhaseC(false);
      setHasPhaseD(false);
    } else if (key === 'perovskite-batio3') {
      setCustomNameA('BaTiO3 Tetragonal Split (P4mm)');
      setCustomFormulaA('BaTiO3');
      setCustomPatternA('22.10(25), 31.45(100), 31.65(50), 38.85(20), 45.10(30), 45.45(60), 50.80(15), 56.15(40)');
      setSampleBInputMode('custom');
      setCustomNameB('BaTiO3 Cubic High-Temp (Pm-3m)');
      setCustomFormulaB('BaTiO3');
      setCustomPatternB('22.15(25), 31.55(100), 38.88(20), 45.30(90), 50.85(15), 56.20(40)');
      setHasPhaseC(false);
      setHasPhaseD(false);
    } else if (key === 'graphene-intercalation') {
      setCustomNameA('Graphene Oxide (Expanded d002 Interlayer)');
      setCustomFormulaA('C_x O_y H_z');
      setCustomPatternA('10.85(100), 22.40(10), 42.60(15)');
      setSampleBInputMode('custom');
      setCustomNameB('Pristine Natural Graphite 2H');
      setCustomFormulaB('C');
      setCustomPatternB('26.55(100), 42.30(10), 44.55(20), 54.65(25)');
      setHasPhaseC(false);
      setHasPhaseD(false);
    }
  };

  // Export Comprehensive CSV Report
  const handleExportCSV = () => {
    let csv = '# XRD DIFFRACTION COMPARISON AND RESIDUAL QUANTIFICATION REPORT\n';
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Sample A: ${materialA.name}\n`;
    csv += `# Reference B: ${materialB.name}\n`;
    if (hasPhaseC && materialC) csv += `# Secondary Phase C: ${materialC.name}\n`;
    if (hasPhaseD && materialD) csv += `# Tertiary Phase D: ${materialD.name}\n`;
    csv += `# Profile Rp: ${metrics.rP}%, Rwp: ${metrics.rWP}%, Goodness of Fit chi2: ${metrics.chiSquared}, FOM: ${metrics.fom}\n\n`;

    csv += '2Theta,Intensity_SampleA,Intensity_ModelB,Difference_Residual\n';
    profileSynthesis.points.forEach(p => {
      csv += `${p.twoTheta},${p.intensityA},${p.intensityTotalModel || p.intensityB},${p.difference}\n`;
    });

    csv += '\n--- INDEXED REFLECTIONS MATRIX ---\n';
    csv += 'Index,2Theta_Exp,2Theta_Ref,Miller_hkl,d_Spacing_A,d_Spacing_B,Shift_Delta2Theta,Status\n';
    indexing.indexedPeaks.forEach(p => {
      csv += `${p.id},${p.twoThetaA || ''},${p.twoThetaB || ''},"${p.hklA || p.hklB || ''}",${p.dSpacingA},${p.dSpacingB},${p.shift || ''},${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `XRD_Compare_${materialA.name.replace(/\s+/g, '_')}_vs_${materialB.name.replace(/\s+/g, '_')}.csv`;
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

        hasPhaseD={hasPhaseD}
        setHasPhaseD={setHasPhaseD}
        selectedPhaseDIndex={selectedPhaseDIndex}
        setSelectedPhaseDIndex={setSelectedPhaseDIndex}
        scalePhaseD={scalePhaseD}
        setScalePhaseD={setScalePhaseD}

        onSwapSamples={handleSwapSamples}
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
        materialDName={materialD?.name}
        peaksA={profileSynthesis.peaksA}
        peaksB={profileSynthesis.peaksB}
        peaksC={peaksC}
        peaksD={peaksD}
        hasPhaseC={hasPhaseC}
        hasPhaseD={hasPhaseD}
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
        materialDName={materialD?.name}
        fracB={phaseFractions.fracB}
        fracC={phaseFractions.fracC}
        fracD={phaseFractions.fracD}
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
