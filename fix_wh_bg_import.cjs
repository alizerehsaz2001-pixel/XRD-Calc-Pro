const fs = require('fs');
let content = fs.readFileSync('components/WilliamsonHallModule.tsx', 'utf8');

if (!content.includes('williamsonBg')) {
  content = content.replace(
    "import 'katex/dist/katex.min.css';",
    "import 'katex/dist/katex.min.css';\nimport williamsonBg from '../src/assets/images/williamson_hall_ui_bg_1786057190288.jpg';"
  );
  fs.writeFileSync('components/WilliamsonHallModule.tsx', content);
  console.log("Bg Import fixed!");
}
