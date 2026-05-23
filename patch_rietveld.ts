import * as fs from 'fs';

let content = fs.readFileSync('components/RietveldModule.tsx', 'utf8');

const diffPatternStart = `<div className="lg:col-span-8">
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[650px] flex flex-col relative overflow-hidden group/pattern">`;
const diffPatternEnd = `</div>
          </div>
        </div>
      ) : (`;

const replaceIndex = content.indexOf(diffPatternStart);
if (replaceIndex !== -1) {
    const startOfReplace = replaceIndex;
    const endOfReplaceSearchStr = `</ResponsiveContainer>
              </div>`;
    const chartEndIndex = content.indexOf(endOfReplaceSearchStr, startOfReplace);
    // this is a bit tricky, let's just use regular expressions or multi-edit.
}
