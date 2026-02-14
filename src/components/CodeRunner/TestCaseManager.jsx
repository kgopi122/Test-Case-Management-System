import React, { useState } from "react";
import { Plus, Trash2, Edit2, Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";

/**
 * Manage test cases specific to this code execution
 */
const TestCaseManager = ({ testCases, setTestCases, onRunTests, highlightedId }) => {
    const [activeTab, setActiveTab] = useState("list"); // list, add, edit
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ input: "", expectedOutput: "" });
    const [selectedIds, setSelectedIds] = useState(new Set()); // New state for selection

    // Scroll to highlighted test case
    React.useEffect(() => {
        if (highlightedId && activeTab === 'list') {
            const element = document.getElementById(`tc-${highlightedId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedId, activeTab, testCases]);

    // Handle Selection
    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === testCases.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(testCases.map(tc => tc.id)));
        }
    };

    const handleRunClick = () => {
        if (selectedIds.size > 0) {
            const selectedCases = testCases.filter(tc => selectedIds.has(tc.id));
            onRunTests(selectedCases);
        } else {
            onRunTests(null); // Run all
        }
    };

    const handleCreate = () => {
        if (!formData.input || !formData.expectedOutput) return;

        const newTestCase = {
            id: Date.now().toString(), // Temp ID for local state
            input: formData.input,
            expectedOutput: formData.expectedOutput,
            status: "pending",
        };

        setTestCases([...testCases, newTestCase]);
        setFormData({ input: "", expectedOutput: "" });
        setActiveTab("list");
    };

    const handleDelete = (id) => {
        setTestCases(testCases.filter((tc) => tc.id !== id));
        if (selectedIds.has(id)) {
            const newSet = new Set(selectedIds);
            newSet.delete(id);
            setSelectedIds(newSet);
        }
    };

    const startEdit = (tc) => {
        setEditingId(tc.id);
        setFormData({ input: tc.input, expectedOutput: tc.expectedOutput });
        setActiveTab("edit");
    };

    const handleUpdate = () => {
        setTestCases(
            testCases.map((tc) =>
                tc.id === editingId
                    ? { ...tc, input: formData.input, expectedOutput: formData.expectedOutput, status: "pending", actualOutput: null }
                    : tc
            )
        );
        setEditingId(null);
        setFormData({ input: "", expectedOutput: "" });
        setActiveTab("list");
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900">
                <h3 className="font-semibold text-slate-200">Test Cases</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleRunClick}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs transition-colors font-medium"
                        title={selectedIds.size > 0 ? `Run ${selectedIds.size} selected test cases` : "Run all test cases"}
                    >
                        <Play size={14} /> {selectedIds.size > 0 ? `Run Selected (${selectedIds.size})` : "Run All"}
                    </button>
                    <button
                        onClick={() => { setActiveTab("add"); setFormData({ input: "", expectedOutput: "" }); }}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs transition-colors font-medium"
                    >
                        <Plus size={14} /> Add Case
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {(activeTab === "add" || activeTab === "edit") && (
                    <div className="bg-slate-800 p-4 border-b border-slate-700 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-200 mb-3">
                            {activeTab === "add" ? "New Test Case" : "Edit Test Case"}
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Input</label>
                                <textarea
                                    value={formData.input}
                                    onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter input..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Expected Output</label>
                                <textarea
                                    value={formData.expectedOutput}
                                    onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter expected output..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setActiveTab("list")}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={activeTab === "add" ? handleCreate : handleUpdate}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-medium shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {testCases.length === 0 && activeTab === "list" ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                        <p className="text-sm">No test cases added yet.</p>
                        <button
                            onClick={() => setActiveTab("add")}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                            Add your first test case
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/50 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-700 w-8">
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAll}
                                        checked={testCases.length > 0 && selectedIds.size === testCases.length}
                                        className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                </th>
                                <th className="px-4 py-3 border-b border-slate-700 w-1/4">Input</th>
                                <th className="px-4 py-3 border-b border-slate-700 w-1/4">Expected</th>
                                <th className="px-4 py-3 border-b border-slate-700 w-1/4">Actual</th>
                                <th className="px-4 py-3 border-b border-slate-700 w-24 text-center">Status</th>
                                <th className="px-4 py-3 border-b border-slate-700 w-20 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {testCases.map((tc) => (
                                <tr
                                    key={tc.id}
                                    id={`tc-${tc.id}`}
                                    onClick={(e) => {
                                        // Toggle selection if clicking row but not buttons
                                        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg' && e.target.tagName !== 'path' && e.target.type !== 'checkbox') {
                                            toggleSelection(tc.id);
                                        }
                                    }}
                                    className={`hover:bg-slate-700/30 transition-colors group cursor-pointer ${highlightedId && (tc.id === highlightedId || tc.id.toString() === highlightedId.toString())
                                            ? 'bg-yellow-900/40 ring-1 ring-yellow-500/50'
                                            : selectedIds.has(tc.id) ? 'bg-blue-900/10' : ''
                                        }`}
                                >
                                    <td className="px-4 py-3 align-top">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(tc.id)}
                                            onChange={() => toggleSelection(tc.id)}
                                            className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <code className="bg-slate-950/50 px-1.5 py-0.5 rounded text-xs font-mono text-slate-300 block max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                                            {tc.input}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <code className="bg-slate-950/50 px-1.5 py-0.5 rounded text-xs font-mono text-slate-300 block max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                                            {tc.expectedOutput}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        {tc.actualOutput !== undefined && tc.actualOutput !== null ? (
                                            <code className={`px-1.5 py-0.5 rounded text-xs font-mono block max-h-20 overflow-y-auto whitespace-pre-wrap break-all ${tc.status === 'failed' ? 'bg-red-900/20 text-red-300' : 'bg-slate-950/50 text-slate-300'
                                                }`}>
                                                {tc.actualOutput}
                                            </code>
                                        ) : (
                                            <span className="text-slate-600 text-xs italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tc.status === 'passed' ? 'bg-green-900/30 text-green-400 border border-green-900/50' :
                                            tc.status === 'failed' ? 'bg-red-900/30 text-red-400 border border-red-900/50' :
                                                'bg-slate-700 text-slate-400 border border-slate-600'
                                            }`}>
                                            {tc.status === 'passed' && <CheckCircle size={10} className="mr-1" />}
                                            {tc.status === 'failed' && <XCircle size={10} className="mr-1" />}
                                            {tc.status === 'pending' && <AlertCircle size={10} className="mr-1" />}
                                            {tc.status ? tc.status.toUpperCase() : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-top text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEdit(tc); }}
                                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(tc.id); }}
                                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TestCaseManager;
