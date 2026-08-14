import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  Code,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Cpu,
  Brain,
  RotateCcw,
  Maximize2,
  ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  extractedCode?: string | null;
}

interface GeminiCoderChatProps {
  onApplyCodeToEditor: (code: string) => void;
  selectedLibrary: string;
  currentCode: string;
}

export const GeminiCoderChat: React.FC<GeminiCoderChatProps> = ({
  onApplyCodeToEditor,
  selectedLibrary,
  currentCode
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("xrd_gemini_coder_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "msg-init-1",
        role: "assistant",
        content: `👋 **Welcome to the Gemini Flash XRD AI Computational Lab!**

I am your dedicated **Google Gemini Flash AI Crystallography & Python Companion**. You can chat with me in natural language to design, customize, or debug any X-ray diffraction analysis task. 

Tell me what you need, such as:
- *"Write a Python script to perform Williamson-Hall (UDM, USDM, UDEDM) analysis with 600 DPI plots."*
- *"Help me deconvolve overlapping Anatase/Rutile TiO2 peaks using LMFIT Pearson-VII profiles."*
- *"Simulate an X-Ray Reflectivity (XRR) scan for a 25 nm TiO2/Si thin film with Parratt formalism."*
- *"Train a PyTorch FT-Transformer with Bochner Fourier harmonic embeddings for XRD phase prediction."*

Whenever I generate Python code, you can click **"Load into Editor"** or run it live on the server!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedCode: null
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [modelPreference, setModelPreference] = useState<string>("gemini-2.5-flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("xrd_gemini_coder_chat_history", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt("");
    setIsSending(true);

    try {
      // Gather current workspace context
      const braggStr = localStorage.getItem("xrd_bragg_current");
      const braggData = braggStr ? JSON.parse(braggStr) : null;
      const rietveldStr = localStorage.getItem("xrd_rietveld_setup");
      const rietveldData = rietveldStr ? JSON.parse(rietveldStr) : null;

      const context = {
        wavelength: braggData?.wavelength || 1.54056,
        peaks: braggData?.rawPeaks || "28.44, 47.30, 56.12, 69.13, 76.38",
        phases: rietveldData?.phases || [
          { name: "Silicon Standard", spaceGroup: "Fd-3m", lattice: { a: 5.43088 } }
        ],
        targetLibrary: selectedLibrary,
        currentEditorCodeSnippet: currentCode ? currentCode.slice(0, 800) + "..." : null
      };

      const response = await fetch("/api/gemini/coder-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          context,
          modelPreference
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gemini Flash chat request failed.");
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedCode: data.extractedCode || null
      };

      setMessages(prev => [...prev, botMessage]);

      // If code was generated, notify user and offer instant load
      if (data.extractedCode) {
        // Auto-apply if it's the only primary code block
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Error communicating with Gemini Flash**: ${err.message || "Unknown network failure"}.\n\nPlease check your Gemini API key in Settings or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear this Gemini Flash conversation history?")) {
      const initial: ChatMessage[] = [
        {
          id: "msg-init-reset",
          role: "assistant",
          content: "Conversation history cleared. Ready for your next XRD Python analysis query!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.setItem("xrd_gemini_coder_chat_history", JSON.stringify(initial));
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadCode = (code: string, id: string) => {
    onApplyCodeToEditor(code);
    setAppliedId(id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  const quickPrompts = [
    "Scherrer size calculation with instrumental Gaussian deconvolution",
    "Williamson-Hall (UDM, USDM, UDEDM) strain separation with 600 DPI plot",
    "Cohen least-squares unit cell parameter refinement matrix",
    "Chung RIR quantitative multi-phase mass fraction calculation",
    "Parratt X-Ray Reflectivity (XRR) Kiessig fringe fitting",
    "PyTorch deep learning model for XRD phase classification"
  ];

  return (
    <div className="flex flex-col h-[650px] bg-[#070A14] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Gemini Flash XRD Chat & Code Architect</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Zap size={10} /> Fast Inference
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Interactive conversation for XRD Python code synthesis, mathematical derivations & parameter optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <Brain size={12} className="text-fuchsia-400" />
            <select
              value={modelPreference}
              onChange={(e) => setModelPreference(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold text-slate-300 outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash" className="bg-slate-900">Gemini 2.5 Flash (High Reliability)</option>
              <option value="gemini-3.5-flash" className="bg-slate-900">Gemini 3.5 Flash</option>
              <option value="gemini-3.6-flash" className="bg-slate-900">Gemini 3.6 Flash</option>
              <option value="gemini-2.5-pro" className="bg-slate-900">Gemini 2.5 Pro</option>
              <option value="gemini-3.1-pro-preview" className="bg-slate-900">Gemini 3.1 Pro</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-radial-gradient">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  isUser
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md"
                }`}
              >
                <div className="flex items-center justify-between gap-4 pb-1 border-b border-white/10 text-[10px] text-slate-400">
                  <span className="font-bold flex items-center gap-1 text-slate-300">
                    {isUser ? <User size={11} /> : <Sparkles size={11} className="text-cyan-400" />}
                    {isUser ? "You (Researcher)" : "Gemini Flash AI"}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Markdown content */}
                <div className="prose prose-invert prose-xs max-w-none text-slate-100 font-sans space-y-2">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        if (!inline && match && match[1] === "python") {
                          const codeText = String(children).replace(/\n$/, "");
                          return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 font-mono text-[11px]">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px]">
                                <span className="flex items-center gap-1 font-bold text-indigo-300">
                                  <Code size={12} /> Python 3 Executable Script
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleCopyCode(codeText, msg.id)}
                                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center gap-1 transition-colors"
                                  >
                                    {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                    <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                                  </button>
                                  <button
                                    onClick={() => handleLoadCode(codeText, msg.id)}
                                    className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1 transition-colors shadow-sm"
                                  >
                                    {appliedId === msg.id ? <CheckCircle2 size={10} /> : <Play size={10} />}
                                    <span>{appliedId === msg.id ? "Applied!" : "Load into Editor"}</span>
                                  </button>
                                </div>
                              </div>
                              <pre className="p-3 overflow-x-auto text-emerald-300 whitespace-pre-wrap max-h-72 custom-scrollbar">
                                {children}
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <code className="bg-slate-950 text-indigo-300 px-1 py-0.5 rounded font-mono text-[11px]" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Direct Action Bar if code was detected */}
                {msg.extractedCode && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 size={12} /> Standalone Python Code Synthesized
                    </span>
                    <button
                      onClick={() => handleLoadCode(msg.extractedCode!, msg.id)}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Play size={11} /> Load & Run in Python Workspace
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0 mt-0.5 animate-pulse">
              <Sparkles size={14} />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-indigo-500/30 text-slate-300 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Gemini Flash is generating your XRD analysis and Python code...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap size={10} /> Quick Inquiries:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputPrompt(qp);
              handleSendMessage(qp);
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/40 text-[10px] text-slate-300 hover:text-white shrink-0 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Gemini Flash anything about XRD or request custom Python code (e.g. 'Add Pearson-VII doublet fitting for TiO2')..."
              rows={2}
              className="w-full bg-[#050814] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !inputPrompt.trim()}
            className="h-[46px] px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
          >
            {isSending ? <Sparkles size={14} className="animate-spin" /> : <Send size={14} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
