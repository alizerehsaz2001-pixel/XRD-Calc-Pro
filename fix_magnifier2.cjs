const fs = require('fs');
let content = fs.readFileSync('components/ImageAnalysisModule.tsx', 'utf-8');

// There are now two magnifiers in the file. I want to keep the one inside `<div className="relative inline-block">` and remove the other one.
// The other one is right before `{/* Processed Filter Tabs overlay under the image */}`

const parts = content.split('{/* Processed Filter Tabs overlay under the image */}');
if (parts.length > 1) {
  // parts[0] contains the old magnifier at the end.
  const oldMagStr = `{magnifier && !scanActive && (`;
  const lastIndex = parts[0].lastIndexOf(oldMagStr);
  if (lastIndex !== -1) {
     // I need to strip from lastIndex to the end of parts[0].
     parts[0] = parts[0].substring(0, lastIndex).trimEnd() + '\n                    ';
  }
}

fs.writeFileSync('components/ImageAnalysisModule.tsx', parts.join('{/* Processed Filter Tabs overlay under the image */}'));
