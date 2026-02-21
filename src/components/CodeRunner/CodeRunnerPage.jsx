import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Save, Settings, Upload, X, Check, AlertCircle, Plus } from 'lucide-react';
import CodeEditor from './CodeEditor';
import ExecutionPanel from './ExecutionPanel';
import TestCaseManager from './TestCaseManager';

const API_URL = 'http://localhost:3001/api';

const SaveTestCasesModal = ({ isOpen, onClose, testCases, onSave }) => {
    const [selectedIds, setSelectedIds] = useState(new Set(testCases.map(tc => tc.id)));
    const [titlePrefix, setTitlePrefix] = useState(`Runner Test Case - ${new Date().toLocaleDateString()}`);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(testCases.map(tc => tc.id)));
        }
    }, [isOpen, testCases]);

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const selectedCases = testCases.filter(tc => selectedIds.has(tc.id));
        await onSave(selectedCases, titlePrefix);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50">
                    <h3 className="text-xl font-semibold text-slate-100">Save Test Cases to Project</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Test Case Title Prefix
                        </label>
                        <input
                            type="text"
                            value={titlePrefix}
                            onChange={(e) => setTitlePrefix(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Generated titles will be: "{titlePrefix} #1", "{titlePrefix} #2", etc.</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-300">Select Test Cases to Save</label>
                            <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
                        </div>
                        <div className="border border-slate-700 rounded-md bg-slate-900/30 divide-y divide-slate-700/50 max-h-60 overflow-y-auto">
                            {testCases.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">No test cases available.</div>
                            ) : (
                                testCases.map((tc, index) => (
                                    <div
                                        key={tc.id}
                                        className={`flex items-start p-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedIds.has(tc.id) ? 'bg-blue-900/10' : ''}`}
                                        onClick={() => toggleSelection(tc.id)}
                                    >
                                        <div className="pt-0.5 mr-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(tc.id)}
                                                onChange={() => { }} // Handled by div click
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 pointer-events-none"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-300">Case #{index + 1}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tc.status === 'passed' ? 'bg-green-900/30 text-green-400' :
                                                    tc.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                                                        'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {tc.status ? tc.status.toUpperCase() : 'PENDING'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                                                <div className="truncate" title={tc.input}>In: {tc.input}</div>
                                                <div className="truncate" title={tc.expectedOutput}>Exp: {tc.expectedOutput}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end px-6 py-4 border-t border-slate-700 bg-slate-900/50 gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || selectedIds.size === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <><check size={16} /> Save {selectedIds.size} Test Cases</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

import ProgramList from './ProgramList';

import { io } from 'socket.io-client';

const CodeRunnerPage = ({ currentUser, importId, highlightedTestCaseId }) => {
    const [code, setCode] = useState('// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}');
    const [language, setLanguage] = useState('java');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [input, setInput] = useState('');
    const [testCases, setTestCases] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentImportId, setCurrentImportId] = useState(null);
    const [filename, setFilename] = useState('Main.java');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState('testcases');

    // TestIt State
    const [testItUrl, setTestItUrl] = useState('http://localhost:5173');
    const [isTestItRunning, setIsTestItRunning] = useState(false);
    const [testItResult, setTestItResult] = useState(null);

    // Socket Ref
    const socketRef = React.useRef(null);

    useEffect(() => {
        // Initialize Socket
        socketRef.current = io('http://localhost:3001');

        socketRef.current.on('connect', () => {
            console.log('Connected to execution server');
        });

        socketRef.current.on('output', (data) => {
            if (data.type === 'stdout') {
                setOutput(prev => prev + data.data);
            } else if (data.type === 'stderr') {
                // Append stderr to output for interactive feel, or separate?
                // Usually terminals show mixed. Let's mix but maybe check error state?
                // Actually, let's just append to output for now to simulate terminal
                setOutput(prev => prev + data.data);
            } else if (data.type === 'error') {
                setError(data.data);
                setIsRunning(false);
            } else if (data.type === 'system') {
                // Process exit
                if (data.data.includes('exited')) setIsRunning(false);
            }
        });

        socketRef.current.on('status', (status) => {
            setIsRunning(status === 'running');
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // ... (rest of initial load logic)

    // Initial Load Logic: Check URL for importId or load last active
    useEffect(() => {
        const loadInitialData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const params = new URLSearchParams(window.location.search);
            const urlImportId = params.get('importId');
            const targetId = importId || urlImportId;

            if (targetId) {
                await loadProgram(targetId);
            } else {
                // Auto-load last active
                try {
                    const res = await axios.get(`${API_URL}/code-imports?limit=1&sort=-updatedAt`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success && res.data.data.codeImports.length > 0) {
                        await loadProgram(res.data.data.codeImports[0]._id);
                    }
                } catch (e) { console.error(e); }
            }
        };

        loadInitialData();
    }, [importId]);

    const loadProgram = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/code-imports/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const dataToLoad = res.data.data.codeImport;
                setCurrentImportId(dataToLoad._id);
                setCode(dataToLoad.content);
                setLanguage(dataToLoad.language);
                setFilename(dataToLoad.filename);

                // Map linked test cases to runner format
                if (dataToLoad.testCaseIds && dataToLoad.testCaseIds.length > 0) {
                    const mappedCases = dataToLoad.testCaseIds.map((tc, index) => {
                        let status = null;
                        if (tc.status === 'completed') status = 'passed';
                        else if (tc.status === 'failed') status = 'failed';

                        return {
                            id: tc._id || `restored-${index}`,
                            input: tc.customInput || '',
                            expectedOutput: tc.expectedOutput || '',
                            status: status
                        };
                    });
                    setTestCases(mappedCases);
                } else {
                    setTestCases([]);
                }
            }
        } catch (err) {
            console.error("Failed to load program:", err);
            // showNotification("Failed to load program", "error"); // Helper might not be defined yet if below
        }
    };

    const getSampleCode = (lang) => {
        switch (lang) {
            case 'java': return '// Write your code here\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("Enter a number:");\n        if(sc.hasNextInt()) {\n            int num = sc.nextInt();\n            System.out.println("You entered: " + num);\n        }\n    }\n}';
            case 'python': return '# Write your code here\ndef main():\n    name = input("Enter your name: ")\n    print(f"Hello {name}")\n\nif __name__ == "__main__":\n    main()';
            case 'javascript': return '// Write your code here\nconsole.log("Hello World");';
            case 'cpp': return '// Write your code here\n#include <iostream>\n\nint main() {\n    int num;\n    std::cout << "Enter number: ";\n    std::cin >> num;\n    std::cout << "Val: " << num << std::endl;\n    return 0;\n}';
            default: return '';
        }
    };

    const handleNew = () => {
        if (code !== getSampleCode(language) && !window.confirm("Start new program? Unsaved changes will be lost.")) {
            return;
        }
        setCurrentImportId(null);
        setCode(getSampleCode(language));
        setFilename(`Main.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : 'java'}`);
        setTestCases([]);
        setOutput('');
        setError('');
        // We'll use setNotification directly to avoid hoisting issues with showNotification if it's defined later
        setNotification({ message: "Started new coding session", type: "success" });
        setTimeout(() => setNotification(null), 3000);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const saveCode = async () => {
        try {
            const payload = {
                filename,
                content: code,
                language
                // removed testCaseIds to prevent overwriting with empty array
            };

            let response;
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (currentImportId) {
                response = await axios.put(`${API_URL}/code-imports/${currentImportId}`, payload, config);
            } else {
                response = await axios.post(`${API_URL}/code-imports`, payload, config);
                setCurrentImportId(response.data.data.codeImport._id);
            }
            return response.data.data.codeImport._id;
        } catch (err) {
            setError(`Failed to save code: ${err.response?.data?.message || err.message}`);
            return null;
        }
    };

    const handleSaveTestCases = async (selectedCases, titlePrefix) => {
        setError('');
        let savedCount = 0;
        let failCount = 0;
        const newTestCaseIds = [];
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // 1. Save Code First
            const codeId = await saveCode();
            if (!codeId) throw new Error("Could not save code before saving test cases.");

            // 2. Create Test Cases
            for (let i = 0; i < selectedCases.length; i++) {
                const tc = selectedCases[i];
                const payload = {
                    title: `${titlePrefix} #${i + 1}`,
                    description: `Generated from Code Runner execution. Linked to saved code.`,
                    expectedResult: tc.expectedOutput,
                    isCustom: true,
                    customInput: tc.input,
                    expectedOutput: tc.expectedOutput,
                    status: tc.status === 'passed' ? 'completed' : tc.status === 'failed' ? 'failed' : 'ready',
                    priority: 'medium',
                    assignedTo: currentUser._id,
                    linkedCode: codeId,
                    steps: [{
                        stepNumber: 1,
                        action: `Execute code with input: ${tc.input}`,
                        expectedResult: tc.expectedOutput
                    }]
                };

                try {
                    const res = await axios.post(`${API_URL}/testcases`, payload, config);
                    if (res.data.success) {
                        savedCount++;
                        newTestCaseIds.push(res.data.data.testCase._id || res.data.data.testCase.id);
                    }
                } catch (err) {
                    console.error("Failed to save individual test case", err);
                    failCount++;
                }
            }

            // 3. Update Code Import with new Test Case IDs
            if (newTestCaseIds.length > 0) {
                // Fetch current code import to get existing IDs (to avoid overwriting)
                // Or simplistic approach: just push the new ones. 
                // Since we rely on simple Object.assign in backend, we need to send the FULL list OR 
                // we should improve backend to support $push. 
                // For now, let's fetch current state first to be safe.
                try {
                    const currentCodeRes = await axios.get(`${API_URL}/code-imports/${codeId}`, config);
                    const currentIds = currentCodeRes.data.data.codeImport.testCaseIds.map(t => t._id || t);
                    const updatedIds = [...new Set([...currentIds, ...newTestCaseIds])];

                    await axios.put(`${API_URL}/code-imports/${codeId}`, { testCaseIds: updatedIds }, config);
                } catch (updateErr) {
                    console.error("Failed to link test cases back to code import", updateErr);
                    showNotification("Saved test cases but failed to link them in code history", "warning");
                }
            }

            setIsSaveModalOpen(false);
            if (savedCount > 0) {
                showNotification(`Successfully saved ${savedCount} test cases to project!`, 'success');
            }
            if (failCount > 0) {
                setError(`Failed to save ${failCount} test cases. Check console for details.`);
            }

        } catch (err) {
            setError(`Bulk save process failed: ${err.message}`);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setError('');
        setOutput('');

        // Also save code (optional, but good practice)
        saveCode();

        if (socketRef.current) {
            socketRef.current.emit('run_code', { code, language });
        }
    };

    const handleInput = (data) => {
        if (socketRef.current) {
            // Append input to output for visual feedback
            setOutput(prev => prev + data + '\n');
            socketRef.current.emit('input', data);
        }
    };

    const handleRunTests = async (casesToRun = null) => {
        // Use provided cases or fallback to all
        const targetCases = casesToRun || testCases;

        if (targetCases.length === 0) {
            setError("No test cases selected/defined.");
            return;
        }

        setIsRunning(true);
        setError('');
        setOutput(`Running ${targetCases.length} test cases...`);

        const id = await saveCode();
        if (!id) {
            setIsRunning(false);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/code-imports/${id}/execute`, {
                testCases: targetCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                }))
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const results = response.data.data.executionResults;

            // Update local test case statuses
            // We need to map results back to the original testCases array using IDs if possible, or index if full run
            // Since we might run a subset, we must find the matching test case in the main list.
            // CAUTION: The backend returns results in the same order as the request.
            // So result[0] corresponds to targetCases[0].

            const newTestCases = [...testCases]; // Mutation copy

            targetCases.forEach((targetTc, index) => {
                const result = results[index];
                // Find index in main list
                const mainIndex = newTestCases.findIndex(tc => tc.id === targetTc.id);
                if (mainIndex !== -1) {
                    newTestCases[mainIndex] = {
                        ...newTestCases[mainIndex],
                        status: result.status,
                        actualOutput: result.actualOutput
                    };
                }
            });

            setTestCases(newTestCases);

            // Persist results to backend for updated cases
            // Only persist if it's a real test case (not temp)
            targetCases.forEach(async (targetTc, index) => {
                const result = results[index];
                if (targetTc.id && !targetTc.id.startsWith('restored') && !targetTc.id.startsWith('temp')) {
                    try {
                        const backendStatus = result.status === 'passed' ? 'completed' : 'failed';
                        await axios.put(`${API_URL}/testcases/${targetTc.id}`, {
                            status: backendStatus
                        }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    } catch (saveErr) {
                        console.error(`Failed to save result for TC ${targetTc.id}`, saveErr);
                    }
                }
            });

            setOutput(`Ran ${results.length} test cases.\nPassed: ${results.filter(r => r.status === 'passed').length}\nFailed: ${results.filter(r => r.status === 'failed').length}`);

        } catch (err) {
            setError(`Test execution failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunTestIt = async () => {
        if (!testItUrl) {
            setError("Please enter a Target URL for testing.");
            return;
        }

        // Use highlightedTestCaseId if available, otherwise just use a dummy 'new' string for the route
        // since the controller might expect an ID. Let's send the highlighted one, or skip if none.
        if (!highlightedTestCaseId && testCases.length === 0) {
            showNotification("Please select or create at least one test case to associate this test result with.", "error");
            return;
        }

        const targetId = highlightedTestCaseId || (testCases.length > 0 ? testCases[0].id : 'temp');

        setIsTestItRunning(true);
        setTestItResult(null);

        try {
            const response = await fetch(`${API_URL}/testresults/${targetId}/automate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetUrl: testItUrl })
            });

            const data = await response.json();
            if (data.success) {
                setTestItResult({
                    success: true,
                    actualResult: data.data.outcome.actualResult,
                    status: data.data.outcome.status,
                    time: data.data.outcome.executionTimeMs
                });
                showNotification("Automated test completed successfully!", "success");
            } else {
                setTestItResult({ success: false, error: data.message });
            }
        } catch (err) {
            setTestItResult({ success: false, error: err.message });
        } finally {
            setIsTestItRunning(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)]flex flex-col p-4 bg-slate-950 text-slate-200 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded shadow-lg flex items-center animate-in slide-in-from-right-5 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check className="mr-2" size={18} /> : <AlertCircle className="mr-2" size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 bg-slate-900 p-2 rounded border border-slate-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white px-2">Code Runner</h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="cpp">C++</option>
                        </select>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-blue-500 font-mono"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        title="New Program"
                    >
                        <Plus size={16} /> New
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Run...' : <><Play size={16} /> Run Code</>}
                    </button>
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        title="Save to Project"
                    >
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                {/* Editor Area */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                    <CodeEditor
                        language={language}
                        value={code}
                        onChange={(val) => setCode(val)}
                    />
                    {/* Execution Panel (Bottom of Editor) */}
                    <div className="h-1/3 min-h-[250px]">
                        <ExecutionPanel
                            input={input}
                            setInput={setInput} // This might need to change to handleInput
                            output={output}
                            error={error}
                            isRunning={isRunning}
                            executionTime={null}
                            onClear={() => { setOutput(''); setError(''); }}
                            onInput={handleInput}
                        />
                    </div>
                </div>

                {/* Sidebar: Test Cases & History */}
                <div className="col-span-12 lg:col-span-5 flex flex-col h-full bg-slate-800 border-slate-700 rounded-md overflow-hidden border">
                    <div className="flex border-b border-slate-700 bg-slate-900">
                        <button
                            className={`flex-1 py-2 text-sm font-medium ${activeSidebarTab === 'testcases' ? 'bg-slate-800 text-white border-t-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setActiveSidebarTab('testcases')}
                        >
                            Test Cases ({testCases.length})
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium ${activeSidebarTab === 'testit' ? 'bg-slate-800 text-white border-t-2 border-purple-500' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setActiveSidebarTab('testit')}
                        >
                            TestIt (Auto)
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium ${activeSidebarTab === 'programs' ? 'bg-slate-800 text-white border-t-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setActiveSidebarTab('programs')}
                        >
                            History & Programs
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {activeSidebarTab === 'testcases' ? (
                            <TestCaseManager
                                testCases={testCases}
                                setTestCases={setTestCases}
                                onRunTests={handleRunTests}
                                highlightedId={highlightedTestCaseId}
                            />
                        ) : activeSidebarTab === 'testit' ? (
                            <div className="flex flex-col h-full bg-slate-800 p-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                                    <Play className="mr-2 text-purple-500" size={20} /> TestIt Automation
                                </h3>
                                <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-700">
                                    Run a headless browser Black Box test against your application URLs.
                                    This uses Playwright to verify the page loads and dynamic elements are present.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Target URL to Test
                                        </label>
                                        <input
                                            type="url"
                                            value={testItUrl}
                                            onChange={(e) => setTestItUrl(e.target.value)}
                                            placeholder="e.g., http://localhost:5173"
                                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-3 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                        />
                                    </div>

                                    <button
                                        onClick={handleRunTestIt}
                                        disabled={isTestItRunning || !testItUrl}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isTestItRunning ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                Executing Playwright Script...
                                            </>
                                        ) : (
                                            <>Run Automated UI Test</>
                                        )}
                                    </button>

                                    {/* Results Area */}
                                    {testItResult && (
                                        <div className={`mt-6 p-4 rounded-lg border shadow-inner ${testItResult.success
                                            ? (testItResult.status === 'Passed' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30')
                                            : 'bg-red-900/20 border-red-500/30'}`}>
                                            <div className="flex items-center mb-3 text-sm font-bold uppercase tracking-wider">
                                                {testItResult.success && testItResult.status === 'Passed'
                                                    ? <Check className="mr-2 text-green-400" size={16} />
                                                    : <AlertCircle className="mr-2 text-red-400" size={16} />}
                                                <span className={testItResult.success && testItResult.status === 'Passed' ? 'text-green-400' : 'text-red-400'}>
                                                    Test Execution Result
                                                </span>
                                            </div>

                                            <div className="font-mono text-sm text-slate-300 space-y-2 bg-slate-950/50 p-3 rounded">
                                                {testItResult.success ? (
                                                    <>
                                                        <p><span className="text-slate-500">Status:</span> <span className={testItResult.status === 'Passed' ? 'text-green-400' : 'text-red-400'}>{testItResult.status}</span></p>
                                                        <p><span className="text-slate-500">Output:</span> {testItResult.actualResult}</p>
                                                        {testItResult.time && <p><span className="text-slate-500">Time:</span> {testItResult.time}ms</p>}
                                                    </>
                                                ) : (
                                                    <p className="text-red-400">Error: {testItResult.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <ProgramList
                                onSelectProgram={(id) => { loadProgram(id); setActiveSidebarTab('testcases'); }}
                                activeImportId={currentImportId}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <SaveTestCasesModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                testCases={testCases}
                onSave={handleSaveTestCases}
            />
        </div>
    );
};

export default CodeRunnerPage;
