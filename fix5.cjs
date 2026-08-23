const fs = require('fs');
let code = fs.readFileSync('components/SupercellTransformationModule.tsx', 'utf8');

// Replace the rogue </motion.div> )} right before Python block
code = code.replace(/      <\/div>\n          <\/motion\.div>\n        \)}\n        {\/\* Python Scripting Engine/, '      </div>\n        {/* Python Scripting Engine');

// Replace the extra `        </div>\n      )}\n    </div>\n  );\n};\n` with the correct one
code = code.replace(/      \)}\n        <\/div>\n      \)}\n    <\/div>\n  \);\n};\n?$/, '      )}\n    </div>\n  );\n};\n');

fs.writeFileSync('components/SupercellTransformationModule.tsx', code);
console.log("Replaced 5!");
