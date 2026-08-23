const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

// I just want to replace the first `        </div>\n      )}\n            </AnimatePresence>\n      </>\n      )}` 
// with `        </div>\n      </motion.div>\n    )}\n  </AnimatePresence>\n  </>\n)}`

const idx = code.indexOf('</AnimatePresence>');
const snippet = code.substring(idx - 60, idx + 40);
console.log("Found snippet:", JSON.stringify(snippet));

