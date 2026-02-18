
import React from 'react';
import { BraggResult } from '../types';

interface ResultsTableProps {
  results: BraggResult[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const exportToCSV = () => {
    if (results.length === 0) return;
    
    // Header for CSV
    const headers = ['hkl', '2theta (deg)', 'd-spacing (Å)', 'Q (1/Å)', 'sin(theta)/lambda'];
    
    // Data rows
    const rows = results.map(r => [
      r.hkl || '',
      r.twoTheta.toFixed(4),
      r.dSpacing.toFixed(4),
      r.qVector.toFixed(4),
      r.sinThetaOverLambda.toFixed(4)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `xrd_analysis_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p>No results calculated yet.</p>
          <p className="text-sm">Enter peaks and click Calculate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col min-h-[400px]">
      <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Calculated Data</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm active:scale-95"
            title="Download results as CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold">
            {results.length} Peaks
          </span>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[600px]">
        <table className="w-full text-sm text-left text-slate-800">
          <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">HKL</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">2θ (deg)</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">d-spacing (Å)</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">Q (1/Å)</th>
              <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">sin(θ)/λ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {results.map((row, index) => (
              <tr key={index} className="bg-white hover:bg-indigo-50 transition-colors">
                <td className="px-6 py-3 font-bold text-indigo-600">({row.hkl || '?'})</td>
                <td className="px-6 py-3 font-bold text-slate-900">{row.twoTheta.toFixed(3)}</td>
                <td className="px-6 py-3 text-indigo-700 font-bold font-mono">{row.dSpacing.toFixed(4)}</td>
                <td className="px-6 py-3 font-mono text-slate-700">{row.qVector.toFixed(4)}</td>
                <td className="px-6 py-3 font-mono text-slate-700">{row.sinThetaOverLambda.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
