import React, { useState, useEffect, useRef } from 'react';
import { Terminal, AlignLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

const ExecutionPanel = ({
    input,
    setInput,
    output,
    error,
    isRunning,
    executionTime,
    onClear,
    onInput
}) => {
    const [activeTab, setActiveTab] = useState('testcase'); // 'testcase' | 'result'
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of output
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [output, error, activeTab]);

    // Auto-focus input when running and tab is result
    useEffect(() => {
        if (isRunning && activeTab === 'result' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRunning, activeTab]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700">
            {/* Tabs Header */}
            <div className="flex items-center bg-slate-800 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('testcase')}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors border-r border-slate-700 ${activeTab === 'testcase'
                        ? 'bg-slate-900 text-green-400 border-b-2 border-b-green-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                >
                    <AlignLeft size={16} />
                    <span>Testcase</span>
                </button>
                <button
                    onClick={() => setActiveTab('result')}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors border-r border-slate-700 ${activeTab === 'result'
                        ? 'bg-slate-900 text-blue-400 border-b-2 border-b-blue-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                >
                    <Terminal size={16} />
                    <span>Code Result</span>
                    {output && !error && <span className="ml-2 w-2 h-2 rounded-full bg-green-500"></span>}
                    {error && <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>}
                </button>
                <div className="flex-1"></div>
                {/* Execution Time (if any) */}
                {executionTime && (
                    <div className="px-4 text-xs text-slate-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {executionTime}ms
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-sm">

                {/* --- TESTCASE INPUT TAB --- */}
                <div className={`${activeTab === 'testcase' ? 'block' : 'hidden'} h-full flex flex-col`}>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wide">
                        Standard Input (stdin)
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter input for your program here..."
                        className="flex-1 w-full bg-slate-900 text-slate-200 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none transition-all"
                        spellCheck="false"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Enter each input value as required by your `Scanner` or `input()` calls.
                    </p>
                </div>

                {/* --- RESULT OUTPUT TAB --- */}
                <div className={`${activeTab === 'result' ? 'block' : 'hidden'} h-full flex flex-col`}>

                    {/* Output Stream */}
                    <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-md p-3 text-slate-300 font-mono whitespace-pre-wrap mb-2 shadow-inner">
                        {output || <span className="text-slate-600 italic">... waiting for execution ...</span>}
                        {error && <span className="text-red-400 block mt-2 border-t border-red-900/50 pt-2">{error}</span>}
                        <div ref={bottomRef}></div>
                    </div>

                    {/* Interactive Input */}
                    <div className={`flex gap-2 items-center transition-opacity ${isRunning ? 'opacity-100' : 'opacity-75'}`}>
                        <span className="text-green-500 font-mono font-bold animate-pulse">{'>'}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (onInput) onInput(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            placeholder={isRunning ? "Type input here and press Enter..." : "Execution finished"}
                            disabled={!isRunning}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 font-mono text-white placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionPanel;
