import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileCode, Calendar, ChevronRight, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const ProgramList = ({ onSelectProgram, activeImportId }) => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL || 'http://localhost:3001/api'}/code-imports?sort=-updatedAt&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setPrograms(res.data.data.codeImports);
            }
        } catch (err) {
            setError("Failed to load history.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900">
                <h3 className="font-semibold text-slate-200">Program History</h3>
                <button onClick={fetchPrograms} className="text-slate-400 hover:text-white" title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {loading && <div className="p-4 text-slate-400 text-center text-sm">Loading...</div>}

                {!loading && programs.length === 0 && (
                    <div className="p-4 text-slate-500 text-center text-sm">No saved programs yet.</div>
                )}

                <ul className="divide-y divide-slate-700/50">
                    {programs.map(prog => (
                        <li
                            key={prog._id}
                            onClick={() => onSelectProgram(prog._id)}
                            className={`p-3 cursor-pointer transition-colors hover:bg-slate-700/50 ${activeImportId === prog._id ? 'bg-slate-700/80 border-l-2 border-blue-500' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-1.5 rounded ${activeImportId === prog._id ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                        <FileCode size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${activeImportId === prog._id ? 'text-white' : 'text-slate-300'}`}>
                                            {prog.filename || 'Untitled'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="uppercase">{prog.language}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                {formatDate(prog.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {activeImportId === prog._id && <ChevronRight size={14} className="text-blue-400" />}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ProgramList;
