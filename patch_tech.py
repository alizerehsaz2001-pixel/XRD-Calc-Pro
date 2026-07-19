import re

with open('./components/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

tech_stack_html = """                <div className="flex flex-col gap-3 mt-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 w-fit group">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{isRTL ? "تکنولوژی‌ها:" : "Tech Stack:"}</span>
                   <div className="flex gap-4">
                      <div className="flex flex-col gap-1 cursor-help group/ts">
                        <span className="text-[10px] font-mono text-blue-400 font-bold">TypeScript</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/ts:opacity-100 transition-opacity">
                          {isRTL ? "برای نوع‌دهی قوی و ساختار امن سمت کلاینت" : "For strong typing and secure client-side architecture"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 cursor-help group/js">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">JavaScript</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/js:opacity-100 transition-opacity">
                          {isRTL ? "برای پویایی و تعاملات سریع رابط کاربری" : "For UI dynamism and fast interactive components"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 cursor-help group/py">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Python</span>
                        <span className="text-[8px] font-medium text-slate-500 max-w-[120px] leading-tight opacity-0 group-hover/py:opacity-100 transition-opacity">
                          {isRTL ? "برای تولید اسکریپت‌های تحلیلی و پراسس داده‌ها" : "For generating analytical scripts and data processing"}
                        </span>
                      </div>
                   </div>
                </div>"""

# Find the old tech stack HTML
old_tech_stack_start = '                <div className="flex items-center gap-3 mt-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 w-fit">'
old_tech_stack_end = '                </div>\n              </div>'
start_idx = content.find(old_tech_stack_start)
end_idx = content.find(old_tech_stack_end, start_idx) + len('                </div>')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + tech_stack_html + content[end_idx:]
else:
    print("Could not find the target HTML to replace")

with open('./components/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tech stack updated successfully")
