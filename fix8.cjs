const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

code = code.replace("      </div>\n          </motion.div>\n        )}\n\n        {/* Python", "      </div>\n        {/* Python");
fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
