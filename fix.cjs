const fs = require('fs');
let code = fs.readFileSync('components/SettingsModule.tsx', 'utf8');

// fix literal '</div>\n          </form>' 
code = code.replace(
  `                  \'<\/div>\\n                <\/form>\'`,
  `                  <\/div>\n                <\/form>`
);

// fix second unclosed tag
code = code.replace(
  `                </div>\n              </div>\n           </section>`,
  `              </div>\n            </div>\n          </section>`
);

// fix third unclosed tag
code = code.replace(
  `        </div>\n      </div>\n\n      <div className="pt-16 pb-8 text-center border-t border-slate-200 dark:border-white/5">`,
  `        </div>\n\n      <div className="pt-16 pb-8 text-center border-t border-slate-200 dark:border-white/5">`
);

fs.writeFileSync('components/SettingsModule.tsx', code);
