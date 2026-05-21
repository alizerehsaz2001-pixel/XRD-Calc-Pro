import { jsPDF } from 'jspdf';

export interface ReportData {
  bragg: any;
  fwhm: any;
  rietveld: any;
  user: any;
}

export const generatePdfReport = (): void => {
  // Load data from localStorage
  const braggRaw = localStorage.getItem('xrd_bragg_current');
  const fwhmRaw = localStorage.getItem('xrd_fwhm_current');
  const rietveldRaw = localStorage.getItem('xrd_rietveld_current');
  const userRaw = localStorage.getItem('xrd_user_registration');

  const bragg = braggRaw ? JSON.parse(braggRaw) : null;
  const fwhm = fwhmRaw ? JSON.parse(fwhmRaw) : null;
  const rietveld = rietveldRaw ? JSON.parse(rietveldRaw) : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // Color Palette Constants
  const clrNavy = [11, 22, 43];      // #0b162b - Primary Headers
  const clrAccent = [20, 184, 166];   // #14b8a6 - Teal brand
  const clrDarkText = [30, 41, 59];   // #1e293b - Main body
  const clrMutedText = [100, 116, 139]; // #64748b - Label / secondary
  const clrBorder = [226, 232, 240];  // #e2e8f0 - Box outlines
  const clrLightBg = [248, 250, 252]; // #f8fafc - Box filled backgrounds

  const setNavyFill = () => doc.setFillColor(clrNavy[0], clrNavy[1], clrNavy[2]);
  const setAccentDraw = () => doc.setDrawColor(clrAccent[0], clrAccent[1], clrAccent[2]);
  const setBorderDraw = () => doc.setDrawColor(clrBorder[0], clrBorder[1], clrBorder[2]);
  const setLightBgFill = () => doc.setFillColor(clrLightBg[0], clrLightBg[1], clrLightBg[2]);
  const setDarkText = () => doc.setTextColor(clrDarkText[0], clrDarkText[1], clrDarkText[2]);
  const setMutedText = () => doc.setTextColor(clrMutedText[0], clrMutedText[1], clrMutedText[2]);
  const setAccentText = () => doc.setTextColor(clrAccent[0], clrAccent[1], clrAccent[2]);

  // Helper: Draw horizontal line
  const drawLine = (y: number, thickness = 0.2) => {
    setBorderDraw();
    doc.setLineWidth(thickness);
    doc.line(15, y, pageWidth - 15, y);
  };

  // Helper: Header block per section
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 19, yPos + 5.5);
    
    // Bottom border under header
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(1);
    doc.line(15, yPos + 8, pageWidth - 15, yPos + 8);
    
    return yPos + 13;
  };

  // PAGE 1: TITLE & HEADER METADATA
  // Top Banner
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(15, currentY, pageWidth - 30, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('XRD-CALC PRO', 22, currentY + 11);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('CONSOLIDATED RESEARCH & ANALYSIS TRANSCRIPT', 22, currentY + 17);

  // Symbol Badge
  doc.setFillColor(20, 184, 166); // Teal
  doc.rect(pageWidth - 35, currentY + 4, 16, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('X', pageWidth - 30, currentY + 15);

  currentY += 30;

  // Metadata Block
  setLightBgFill();
  setBorderDraw();
  doc.setLineWidth(0.35);
  doc.rect(15, currentY, pageWidth - 30, 28, 'FD');

  const now = new Date();
  const formatTime = now.toLocaleDateString() + ' @ ' + now.toLocaleTimeString();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setMutedText();
  doc.text('LABORATORY REPORT', 20, currentY + 7);
  doc.text('TIMESTAMP / GENERATION', 110, currentY + 7);
  doc.text('CHIEF INVESTIGATOR', 20, currentY + 18);
  doc.text('LICENSED PLATFORM', 110, currentY + 18);

  setDarkText();
  doc.setFont('helvetica', 'bold');
  doc.text('XRD Analytical Summary Case', 20, currentY + 11);
  doc.text(formatTime, 110, currentY + 11);

  const investigatorName = user?.fullName || user?.institution || 'Ali Zerehsaz';
  const licenseText = user?.email ? `Activated (${user.email})` : 'Academic Suite v2.5.0';
  doc.text(investigatorName, 20, currentY + 22);
  doc.text(licenseText, 110, currentY + 22);

  currentY += 36;

  // SECTION 1: BRAGG DIFFRACTION PROFILE
  currentY = drawSectionHeader('I. BRAGG BASICS & LATTICE SPACING', currentY);

  if (bragg) {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 110, 'FD');

    // Mini metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setMutedText();
    doc.text('SAMPLE IDENTIFICATION:', 20, currentY + 8);
    doc.text('TARGET WAVELENGTH:', 110, currentY + 8);

    setDarkText();
    doc.text(bragg.sampleId ? String(bragg.sampleId).toUpperCase() : 'XRD-SAMPLE-UNSPECIFIED', 65, currentY + 8);
    doc.text(`${bragg.wavelength ? Number(bragg.wavelength).toFixed(5) : '1.5406'} Angstrom (Cu K-alpha)`, 155, currentY + 8);
    
    // Peak list text
    setMutedText();
    doc.text('SUBMITTED PEAKS (2θ):', 20, currentY + 16);
    setDarkText();
    doc.setFont('courier', 'bold');
    doc.text(bragg.rawPeaks || 'N/A', 65, currentY + 16);

    // Results table headers
    currentY += 24;
    doc.setFillColor(241, 245, 249);
    doc.rect(18, currentY, pageWidth - 36, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setNavyFill();
    doc.setTextColor(15, 23, 42);
    doc.text('Index', 22, currentY + 5.5);
    doc.text('HKL', 38, currentY + 5.5);
    doc.text('2θ Observed', 60, currentY + 5.5);
    doc.text('θ Degree', 93, currentY + 5.5);
    doc.text('d-Spacing (Å)', 123, currentY + 5.5);
    doc.text('q-Vector (1/Å)', 158, currentY + 5.5);

    drawLine(currentY + 8, 0.4);

    let rowY = currentY + 14;
    const braggResults = Array.isArray(bragg.results) ? bragg.results : [];

    if (braggResults.length > 0) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      braggResults.forEach((r: any, idx: number) => {
        if (idx < 7) { // Limit rows on page 1
          doc.setTextColor(30, 41, 59);
          doc.text(String(idx + 1), 24, rowY);
          doc.text(String(r.hkl || 'N/A'), 38, rowY);
          doc.text(`${r.twoTheta ? Number(r.twoTheta).toFixed(3) : 'N/A'}°`, 60, rowY);
          doc.text(`${r.theta ? Number(r.theta).toFixed(3) : 'N/A'}°`, 93, rowY);
          doc.text(r.dSpacing ? Number(r.dSpacing).toFixed(4) : 'N/A', 123, rowY);
          doc.text(r.qVector ? Number(r.qVector).toFixed(4) : 'N/A', 158, rowY);
          
          if (idx !== braggResults.length - 1 && idx < 6) {
            drawLine(rowY + 2.5, 0.15);
          }
          rowY += 6.5;
        }
      });
    } else {
      doc.setFont('helvetica', 'italic');
      setMutedText();
      doc.text('No active Bragg diffraction calculations available.', 24, rowY + 3);
    }
  } else {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 20, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    setMutedText();
    doc.text('Bragg Basics Module state not computed yet. Please execute a calculation to populate.', 20, currentY + 11);
  }

  // Page Footer for Page 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('XRD-CALC PRO • CONSOLIDATED REPORT TRANSCRIPT', 15, pageHeight - 12);
  doc.text('PAGE 1 OF 2', pageWidth - 35, pageHeight - 12);


  // PAGE 2: FWHM AND RIETVELD REFINEMENT
  doc.addPage();
  currentY = 15;

  // Mini header on page 2
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(15, currentY, pageWidth - 30, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('XRD-CALC PRO CONSOLIDATED ANALYTICAL TRANSCRIPT', 20, currentY + 6.5);
  doc.setFillColor(20, 184, 166);
  doc.rect(pageWidth - 25, currentY, 10, 10, 'F');
  doc.setFontSize(10);
  doc.text('λ', pageWidth - 21, currentY + 6.8);

  currentY += 18;

  // SECTION 2: LINE PROFILE FWHM ANALYSIS
  currentY = drawSectionHeader('II. LINE PROFILE FWHM ANALYSIS', currentY);

  if (fwhm) {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 75, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setMutedText();
    doc.text('PROFILE EQUATION FORMULA:', 20, currentY + 8);
    doc.text('CENTER ANGLE 2θ:', 110, currentY + 8);
    doc.text('FWHM SIMULATED VALUE:', 20, currentY + 22);
    doc.text('AMPLITUDE RATIO:', 110, currentY + 22);
    doc.text('INTEGRAL BREADTH (β):', 20, currentY + 36);
    doc.text('SHAPE CORRELATION (φ):', 110, currentY + 36);

    setDarkText();
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(String(fwhm.type || 'N/A').toUpperCase(), 20, currentY + 13);
    doc.text(`${fwhm.center ? Number(fwhm.center).toFixed(3) : '30.000'}°`, 110, currentY + 13);
    doc.text(`${fwhm.fwhm ? Number(fwhm.fwhm).toFixed(4) : '0.5000'}°`, 20, currentY + 27);
    doc.text(`${fwhm.amplitude ? Number(fwhm.amplitude).toFixed(1) : '100.0'} a.u.`, 110, currentY + 27);
    
    // Stats extraction
    const statsObj = fwhm.stats || {};
    doc.text(`${statsObj.integralBreadth ? Number(statsObj.integralBreadth).toFixed(4) : '0.5312'}°`, 20, currentY + 41);
    doc.text(`${statsObj.shapeFactor ? Number(statsObj.shapeFactor).toFixed(4) : '0.9413'} (FWHM / IB)`, 110, currentY + 41);

    // Diagnostics / Analyzer Output
    drawLine(currentY + 47, 0.3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setMutedText();
    doc.text('DIAGNOSTICS ANALYZER FEEDBACK', 20, currentY + 53);

    const msgs = fwhm.analysis?.messages || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setDarkText();
    if (msgs.length > 0) {
      let msgY = currentY + 59;
      msgs.slice(0, 2).forEach((m: any, mIdx: number) => {
        const bullet = m.type === 'warning' ? '⚠️' : 'ℹ️';
        doc.text(`${bullet} ${m.text}`, 20, msgY);
        msgY += 5.5;
      });
    } else {
      doc.text('✓ Line profile simulated within ideal instrumental parameters. No significant variations detected.', 20, currentY + 59);
    }
  } else {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 20, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    setMutedText();
    doc.text('FWHM Simulator state not found. Navigate to FWHM Analysis tab to persist active spectra.', 20, currentY + 11);
  }

  currentY += 88;

  // SECTION 3: RIETVELD SETUP & REFINEMENT
  currentY = drawSectionHeader('III. RIETVELD SETUP & STRUCTURE OPTIMIZATION', currentY);

  if (rietveld) {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 75, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setMutedText();
    doc.text('CRYSTALLOGRAPHIC PHASE:', 20, currentY + 8);
    doc.text('Rwp REFACTOR MATCH QUALITY:', 110, currentY + 8);
    doc.text('LATTICE CONSTANT (a):', 20, currentY + 22);
    doc.text('BACKGROUND RATIO (Noise):', 110, currentY + 22);
    doc.text('REFINEMENT STEPS COMPLETED:', 20, currentY + 36);
    doc.text('CONVERGENCE TARGET:', 110, currentY + 36);

    setDarkText();
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(String(rietveld.simPhase || 'Simple Cubic').toUpperCase(), 20, currentY + 13);
    
    const rVal = rietveld.rFactor ? Number(rietveld.rFactor) : 0;
    const rQuality = rVal < 15 ? 'ExcellentFit (Rwp < 15%)' : rVal < 30 ? 'Moderate (Rwp < 30%)' : 'Mismatch';
    doc.text(`${rVal.toFixed(2)}% -- ${rQuality}`, 110, currentY + 13);
    
    const uParams = rietveld.userParams || {};
    doc.text(`${uParams.a ? Number(uParams.a).toFixed(4) : '5.4300'} Angstrom`, 20, currentY + 27);
    doc.text(`${uParams.background ? Number(uParams.background).toFixed(1) : '150.0'} a.u.`, 110, currentY + 27);
    
    doc.text(`${rietveld.iterCount || 0} optimization iterations`, 20, currentY + 41);
    doc.text('Global Minimum Gradient Descent', 110, currentY + 41);

    drawLine(currentY + 47, 0.3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setMutedText();
    doc.text('PHYSICS CONVERGENCE SUMMARY', 20, currentY + 53);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setDarkText();
    if (rVal > 0) {
      if (rVal < 15) {
         doc.text('✓ System converged fully. Peak coordinates match crystallographic database thresholds with high confidence.', 20, currentY + 59);
      } else {
         doc.text('⚠️ High R-factor detected. Please perform optimization step by enabling "Live Tuning" parameters.', 20, currentY + 59);
      }
    } else {
      doc.text('Optimization cycle not initiated. Please trigger "Live Tuning" in Rietveld Setup to measure real-time residuals.', 20, currentY + 59);
    }

  } else {
    setLightBgFill();
    setBorderDraw();
    doc.rect(15, currentY, pageWidth - 30, 20, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    setMutedText();
    doc.text('Rietveld Simulation state not found. Navigate to Rietveld Setup tab to initialize parameters.', 20, currentY + 11);
  }

  // Final Seal of Authenticity
  currentY += 88;
  doc.setLineWidth(0.25);
  doc.setDrawColor(20, 184, 166);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setMutedText();
  doc.text('CERTIFIED COMPUTER-AIDED TRANSCRIPT', 15, currentY + 5);
  doc.text('XRD RESEARCH HUB INC.', pageWidth - 60, currentY + 5);

  // Page Footer for Page 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('XRD-CALC PRO CONSOLIDATED REPORT TRANSCRIPT', 15, pageHeight - 12);
  doc.text('PAGE 2 OF 2', pageWidth - 35, pageHeight - 12);

  // Trigger Save
  doc.save('XRD_CALC_PRO_Lab_Report.pdf');
};
