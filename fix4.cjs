const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

code = code.replace(/<\/div>\n\n      <\/div>\n        <\/div>\n      \)}\n\n      \n      <\/AnimatePresence>\n      <\/>\n      \)}/, '</div>\n\n      </div>\n      </motion.div>\n      )}\n      </AnimatePresence>\n      </>\n      )}');

// Also, the results block starts around {appState === 'results' && ...
// And the end of the file is:
//       )}
//         </div>
//       )}
//     </div>
//   );
// };
// We need to fix the closing tags at the very end. 
// A single appState === 'results' needs ONE closing </div>)} and then the main div is closed.
code = code.replace(/      \)}\n        <\/div>\n      \)}\n    <\/div>\n  \);\n};\n?$/, '      )}\n        </div>\n      )}\n    </div>\n  );\n};\n');

fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
console.log("Replaced!");
