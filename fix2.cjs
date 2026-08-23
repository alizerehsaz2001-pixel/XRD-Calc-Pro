const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

code = code.replace(/      <\/div>\n        <\/div>\n      \)}\n            <\/AnimatePresence>/, '      </div>\n          </motion.div>\n        )}\n      </AnimatePresence>');

fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
console.log("Done");
