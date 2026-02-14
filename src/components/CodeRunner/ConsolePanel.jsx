import React from "react";

const ConsolePanel = ({ output, error, onClear, input, setInput }) => {
    return (
        <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-md shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200">Console</h3>
                <button
                    onClick={onClear}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                    Clear
                </button>
            </div>

            {/* Output Display */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-sm">
                {error ? (
                    <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
                ) : output ? (
                    <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                ) : (
                    <span className="text-slate-500 italic">No output yet...</span>
                )}
            </div>

            {/* Input Area (Stdin) */}
            <div className="border-t border-slate-700 p-2 bg-slate-800">
                <label className="text-xs text-slate-400 mb-1 block">Standard Input (stdin):</label>
                <textarea
                    className="w-full h-16 bg-slate-950 text-slate-200 border border-slate-700 rounded p-2 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input for your program here..."
                />
            </div>
        </div>
    );
};

export default ConsolePanel;
