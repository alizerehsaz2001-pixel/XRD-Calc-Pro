
import React, { useState } from 'react';
import { generateScientificImage } from '../services/geminiService';

export const ImageGenerationModule: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setError(null);
    setLoading(true);

    try {
      // 1. Check for API Key using window.aistudio
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await (window as any).aistudio?.openSelectKey();
          // Assuming success if openSelectKey resolves without throwing
        } catch (e) {
          setLoading(false);
          setError("API Key selection was cancelled or failed.");
          return;
        }
      }

      // 2. Generate Image
      const result = await generateScientificImage(prompt, size);
      
      if (result) {
        setImageUrl(result);
      } else {
        setError("Generation completed but no image was returned. Try a different prompt.");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("Requested entity was not found")) {
        // Reset key selection state and prompt user again
        setError("The selected API Key project was not found. Please select a valid key.");
        try {
          await (window as any).aistudio?.openSelectKey();
        } catch (retryErr) {
          // ignore
        }
      } else {
        setError("Failed to generate image. " + (e.message || "Unknown error."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `scientific-illustration-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Scientific Illustrator
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A realistic 3D representation of the perovskite crystal structure with labeled octahedra..."
                className="w-full h-32 px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 dark:bg-slate-950 dark:text-white dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-3 py-2 text-sm font-bold rounded-lg border transition-all ${
                      size === s
                        ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                Using <strong>gemini-3-pro-image-preview</strong> (Nano Banana Pro).
                <br />Requires a paid project API key.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3 text-white font-medium rounded-lg shadow-md transition-all flex justify-center items-center gap-2
                ${loading || !prompt.trim() ? 'bg-fuchsia-400 dark:bg-fuchsia-900/50 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-700 hover:shadow-lg active:scale-[0.98]'}
              `}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : 'Generate Illustration'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800 animate-in fade-in">
                {error}
                {error.includes("API Key") && (
                   <div className="mt-2">
                     <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold text-xs">
                       View Billing Documentation
                     </a>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full min-h-[500px] flex flex-col transition-colors overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Illustration Preview</h3>
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-800 dark:hover:text-fuchsia-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-black/20 p-4">
            {loading ? (
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Synthesizing visual data...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">This may take up to 20 seconds.</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Generated Scientific Illustration" 
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg border border-white/20"
              />
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-600 opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Enter a description and generate to visualize.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
