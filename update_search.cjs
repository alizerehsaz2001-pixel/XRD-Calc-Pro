const fs = require('fs');
let code = fs.readFileSync('components/DeepLearningModule.tsx', 'utf8');

const targetFunction = `  const getFilteredMaterials = () => {
    if (!searchTerm.trim()) return [];
    const keywords = searchTerm.toLowerCase().split(/\\s+/).filter(Boolean);
    
    return MATERIAL_DB.map(material => {
      let score = 0;
      keywords.forEach(kw => {
        if (material.name.toLowerCase().includes(kw)) score += 10;
        if (material.formula.toLowerCase().includes(kw)) score += 10;
        if (material.crystalSystem?.toLowerCase().includes(kw)) score += 5;
        if (material.type?.toLowerCase().includes(kw)) score += 5;
        if (material.spaceGroup?.toLowerCase().includes(kw)) score += 3;
        if (material.applications?.some(app => app.toLowerCase().includes(kw))) score += 2;
      });
      return { material, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.material)
    .slice(0, 10); // Return top 10 relevant
  };`;

const newFunction = `  const getFilteredMaterials = () => {
    if (!searchTerm.trim()) return [];
    const rawTokens = searchTerm.trim().split(/[\\s,]+/);
    const keywords = rawTokens.map(t => t.toLowerCase()).filter(Boolean);
    
    // Check if the input consists mostly of numbers (potential peak search)
    const numericTokens = rawTokens.map(parseFloat).filter(n => !isNaN(n));
    const isPeakSearch = numericTokens.length > 0 && numericTokens.length >= keywords.length / 2;

    return MATERIAL_DB.map(material => {
      let score = 0;
      
      keywords.forEach(kw => {
        if (material.name.toLowerCase().includes(kw)) score += 10;
        if (material.formula?.toLowerCase().includes(kw)) score += 10;
        if (material.crystalSystem?.toLowerCase().includes(kw)) score += 5;
        if (material.type?.toLowerCase().includes(kw)) score += 5;
        if (material.spaceGroup?.toLowerCase().includes(kw)) score += 3;
        if (material.applications?.some(app => app.toLowerCase().includes(kw))) score += 2;
      });

      // Unified peak matching
      if (isPeakSearch && material.pattern) {
        let patternPeaks;
        try {
          patternPeaks = parseXYData(material.pattern).map(p => p.twoTheta);
        } catch (e) { patternPeaks = []; }
        
        let matchCount = 0;
        numericTokens.forEach(nt => {
          if (patternPeaks.some(mp => Math.abs(mp - nt) <= 0.5)) {
            score += 20; // High score for each matching peak
            matchCount++;
          }
        });
        
        // Bonus for multi-peak alignment
        if (matchCount >= 2) score += 30; 
        if (matchCount >= 3) score += 50; 
      }

      return { material, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.material)
    .slice(0, 10);
  };`;

if(code.includes(targetFunction)) {
  fs.writeFileSync('components/DeepLearningModule.tsx', code.replace(targetFunction, newFunction));
  console.log("Success");
} else {
  console.log("Failed to find target");
}
