import re

with open('components/RietveldModule.tsx', 'r') as f:
    content = f.read()

replacement = """  const obsIntensities = useMemo(() => {
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    const dataLen = steps + 1;
    const intensities = new Float32Array(dataLen);
    
    const globalBkg = 60;
    for (let i = 0; i < dataLen; i++) {
      const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
      intensities[i] += globalBkg * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
    }

    simPhases.forEach((p) => {
      if (!p.enabled) return;
      const a = p.targetA;
      const scale = p.targetScale;
      const fwhm = p.targetFwhm;
      const eta = p.targetEta;
      const crystalliteSize = p.targetCrystalliteSize;
      const microstrain = p.targetMicrostrain;
      const peaks = p.peaks;

      const addPeak = (pos2Theta, peakFwhm, amplitude) => {
        const gamma = Math.max(0.0001, peakFwhm / 2);
        const sigma = Math.max(0.0001, peakFwhm / 2.35482);
        const gammaSq = gamma * gamma;
        const sigmaSq2 = 2 * sigma * sigma;
        
        const halfWidth = peakFwhm * 10;
        const minT = Math.max(SIMULATION_RANGE.start, pos2Theta - halfWidth);
        const maxT = Math.min(SIMULATION_RANGE.end, pos2Theta + halfWidth);
        
        const startIdx = Math.max(0, Math.ceil((minT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));
        const endIdx = Math.min(dataLen - 1, Math.floor((maxT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));

        for (let idx = startIdx; idx <= endIdx; idx++) {
          const x = SIMULATION_RANGE.start + idx * SIMULATION_RANGE.step;
          const diff = x - pos2Theta;
          const diffSq = diff * diff;
          
          const g = amplitude * Math.exp(-diffSq / sigmaSq2);
          const l = amplitude * (gammaSq / (diffSq + gammaSq));
          intensities[idx] += eta * l + (1 - eta) * g;
        }
      };

      const wavelength = 1.5406;
      peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;
        if (['Quartz', 'Rutile', 'Perovskite'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : (p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : PEROVSKITE_PEAKS[peakIdx]);
          if (!origPeak) return;
          const shift = (a - TARGET_PARAMS[p.phaseType].a) * 2; 
          twoThetaBase = origPeak.t - shift;
          const theta1 = (origPeak.t / 2) * (Math.PI / 180);
          d = 1.5406 / (2 * Math.sin(theta1));
        } else {
          d = a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
          const sinTheta = wavelength / (2 * d);
          if (sinTheta >= 1) return;
          const theta = Math.asin(sinTheta);
          twoThetaBase = 2 * theta * (180 / Math.PI);
        }
        const theta = (twoThetaBase / 2) * (Math.PI / 180);
        
        const zeroShift = 0.0;
        const sampleDisplacement = 0.0;
        const displacementShift = -sampleDisplacement * Math.cos(theta);
        const twoTheta = twoThetaBase + zeroShift + displacementShift;

        if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
          let intensity = peak.intensity;
          
          if (p.phaseType !== 'Quartz') {
            const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
            intensity *= lp / 10;
            
            let mult = 0;
            const {h, k, l} = peak;
            if (h===k && k===l) mult = 8;
            else if (h===k || k===l || h===l) mult = 24;
            else mult = 48;
            if (h===0 || k===0 || l===0) mult /= 2;
            intensity *= (mult / 10);
          }

          const bSizeRad = (0.9 * wavelength) / ((crystalliteSize * 10) * Math.cos(theta));
          const bSizeDeg = bSizeRad * (180 / Math.PI);
          const bStrainRad = 4 * microstrain * Math.tan(theta);
          const bStrainDeg = bStrainRad * (180 / Math.PI);
          
          const totalFwhm = fwhm + bSizeDeg + bStrainDeg;
          const baseAmplitude = intensity * (scale / 1000);

          addPeak(twoTheta, totalFwhm, baseAmplitude);

          const wavelength2 = 1.5444; 
          const sinTheta2 = wavelength2 / (2 * d);
          if (sinTheta2 < 1) {
            const theta2 = Math.asin(sinTheta2);
            const displacementShift2 = -sampleDisplacement * Math.cos(theta2);
            const twoTheta2 = 2 * theta2 * (180 / Math.PI) + zeroShift + displacementShift2;
            addPeak(twoTheta2, totalFwhm, baseAmplitude * 0.5);
          }
        }
      });
    });

    for (let i = 0; i < dataLen; i++) {
      const val = intensities[i];
      intensities[i] += Math.sqrt(Math.max(1, val)) * (Math.random() - 0.5) * 2.25;
    }
    return intensities;
  }, [simPhases.map(p => `${p.enabled}-${p.targetA}-${p.targetScale}-${p.targetFwhm}-${p.targetEta}-${p.targetCrystalliteSize}-${p.targetMicrostrain}`).join(',')]);

  const generatePatternData = useMemo(() => {
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    const dataLen = steps + 1;
    const data = new Array(dataLen);

    const calcIntensities = new Float32Array(dataLen);
    const individualPhaseCalcIntensities = simPhases.map(() => new Float32Array(dataLen));

    simPhases.forEach((p, phaseIdx) => {
      if (!p.enabled) return;
      const a = p.a;
      const scale = p.scale;
      const fwhm = p.fwhm;
      const eta = p.eta;
      const crystalliteSize = p.crystalliteSize;
      const microstrain = p.microstrain;
      const peaks = p.peaks;
      const phaseIntensities = individualPhaseCalcIntensities[phaseIdx];

      const addPeak = (pos2Theta, peakFwhm, amplitude) => {
        const gamma = Math.max(0.0001, peakFwhm / 2);
        const sigma = Math.max(0.0001, peakFwhm / 2.35482);
        const gammaSq = gamma * gamma;
        const sigmaSq2 = 2 * sigma * sigma;
        
        const halfWidth = peakFwhm * 10;
        const minT = Math.max(SIMULATION_RANGE.start, pos2Theta - halfWidth);
        const maxT = Math.min(SIMULATION_RANGE.end, pos2Theta + halfWidth);
        
        const startIdx = Math.max(0, Math.ceil((minT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));
        const endIdx = Math.min(dataLen - 1, Math.floor((maxT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));

        for (let idx = startIdx; idx <= endIdx; idx++) {
          const x = SIMULATION_RANGE.start + idx * SIMULATION_RANGE.step;
          const diff = x - pos2Theta;
          const diffSq = diff * diff;
          
          const g = amplitude * Math.exp(-diffSq / sigmaSq2);
          const l = amplitude * (gammaSq / (diffSq + gammaSq));
          const y = eta * l + (1 - eta) * g;
          phaseIntensities[idx] += y;
          calcIntensities[idx] += y;
        }
      };

      const wavelength = 1.5406;
      peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;
        if (['Quartz', 'Rutile', 'Perovskite'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : (p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : PEROVSKITE_PEAKS[peakIdx]);
          if (!origPeak) return;
          const shift = (a - TARGET_PARAMS[p.phaseType].a) * 2; 
          twoThetaBase = origPeak.t - shift;
          const theta1 = (origPeak.t / 2) * (Math.PI / 180);
          d = 1.5406 / (2 * Math.sin(theta1));
        } else {
          d = a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
          const sinTheta = wavelength / (2 * d);
          if (sinTheta >= 1) return;
          const theta = Math.asin(sinTheta);
          twoThetaBase = 2 * theta * (180 / Math.PI);
        }
        const theta = (twoThetaBase / 2) * (Math.PI / 180);
        
        const zeroShift = 0.0;
        const sampleDisplacement = 0.0;
        const displacementShift = -sampleDisplacement * Math.cos(theta);
        const twoTheta = twoThetaBase + zeroShift + displacementShift;

        if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
          let intensity = peak.intensity;
          
          if (p.phaseType !== 'Quartz') {
            const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
            intensity *= lp / 10;
            
            let mult = 0;
            const {h, k, l} = peak;
            if (h===k && k===l) mult = 8;
            else if (h===k || k===l || h===l) mult = 24;
            else mult = 48;
            if (h===0 || k===0 || l===0) mult /= 2;
            intensity *= (mult / 10);
          }

          const bSizeRad = (0.9 * wavelength) / ((crystalliteSize * 10) * Math.cos(theta));
          const bSizeDeg = bSizeRad * (180 / Math.PI);
          const bStrainRad = 4 * microstrain * Math.tan(theta);
          const bStrainDeg = bStrainRad * (180 / Math.PI);
          
          const totalFwhm = fwhm + bSizeDeg + bStrainDeg;
          const baseAmplitude = intensity * (scale / 1000);

          addPeak(twoTheta, totalFwhm, baseAmplitude);

          const wavelength2 = 1.5444; 
          const sinTheta2 = wavelength2 / (2 * d);
          if (sinTheta2 < 1) {
            const theta2 = Math.asin(sinTheta2);
            const displacementShift2 = -sampleDisplacement * Math.cos(theta2);
            const twoTheta2 = 2 * theta2 * (180 / Math.PI) + zeroShift + displacementShift2;
            addPeak(twoTheta2, totalFwhm, baseAmplitude * 0.5);
          }
        }
      });
    });

    let sumResSq = 0;
    let sumObsSq = 0;
    let maxObs = 0;
    for (let i = 0; i < dataLen; i++) {
      if (obsIntensities[i] > maxObs) {
        maxObs = obsIntensities[i];
      }
    }
    
    const diffOffset = -maxObs * 0.15; 
    const globalBkg = 60;

    for (let i = 0; i < dataLen; i++) {
      const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
      const trueBkg = globalBkg * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
      
      const obs = obsIntensities[i];
      const calc = calcIntensities[i] + trueBkg;
      
      const dataPoint = {
        twoTheta: twoT,
        obs: obs,
        calc: calc,
        diff: (obs - calc) + diffOffset,
        bkg: trueBkg
      };

      const trueDiff = obs - calc;
      sumResSq += trueDiff * trueDiff;
      sumObsSq += obs * obs;

      simPhases.forEach((p, idx) => {
        dataPoint[`calc_phase_${idx}`] = individualPhaseCalcIntensities[idx][i] + trueBkg;
      });
      data[i] = dataPoint;
    }

    const R = Math.sqrt(sumResSq / Math.max(0.0001, sumObsSq)) * 100;
    
    return { data, R };
  }, [simPhases, obsIntensities]);

  // Track R-factor history
  useEffect(() => {
    if (isAutoRefining) {"""

new_content = re.sub(r"  const generatePatternData = useMemo\(\(\) => \{.*?// Track R-factor history\n  useEffect\(\(\) => \{\n    if \(isAutoRefining\) \{", replacement, content, flags=re.DOTALL)

with open('components/RietveldModule.tsx', 'w') as f:
    f.write(new_content)

print("Replaced!")
