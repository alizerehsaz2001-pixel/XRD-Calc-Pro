with open("components/OriginProFWHMPlotter.tsx", "r") as f:
    content = f.read()

# Add originProScript state
content = content.replace(
    "const [pythonScript, setPythonScript] = useState<string>('');",
    "const [pythonScript, setPythonScript] = useState<string>('');\n  const [originProScript, setOriginProScript] = useState<string>('');"
)

# Add originProScript from API response
content = content.replace(
    "setJupyterNotebook(data.jupyter_notebook || '');",
    "setJupyterNotebook(data.jupyter_notebook || '');\n        setOriginProScript(data.originpro_script || '');"
)

# Add copiedOriginPro state
content = content.replace(
    "const [copiedNotebook, setCopiedNotebook] = useState<boolean>(false);",
    "const [copiedNotebook, setCopiedNotebook] = useState<boolean>(false);\n  const [copiedOriginPro, setCopiedOriginPro] = useState<boolean>(false);"
)

# Add copyOriginProToClipboard
copy_origin_func = """
  const copyOriginProToClipboard = () => {
    if (!originProScript) return;
    navigator.clipboard.writeText(originProScript);
    setCopiedOriginPro(true);
    setTimeout(() => setCopiedOriginPro(false), 2000);
  };
"""
content = content.replace("  const downloadPythonScriptFile = () => {", copy_origin_func + "\n  const downloadPythonScriptFile = () => {")

# Add originpro to activeSubTab
content = content.replace(
    "const [activeSubTab, setActiveSubTab] = useState<'plot' | 'code' | 'jupyter' | 'explain'>('plot');",
    "const [activeSubTab, setActiveSubTab] = useState<'plot' | 'code' | 'jupyter' | 'explain' | 'originpro'>('plot');"
)

# Add OriginPro Native Script button to tabs
button_html = """
          <button
            onClick={() => setActiveSubTab('originpro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'originpro'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-rose-400" />
            OriginPro Native Script (op)
          </button>
"""
content = content.replace("            Jupyter Notebook (.ipynb)\n          </button>", "            Jupyter Notebook (.ipynb)\n          </button>\n" + button_html)

with open("components/OriginProFWHMPlotter.tsx", "w") as f:
    f.write(content)
