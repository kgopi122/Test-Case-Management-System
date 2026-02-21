import React, { useState } from 'react';
import { Play, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const TestItPage = ({ testCases }) => {
    const [testItUrl, setTestItUrl] = useState('http://localhost:5173');
    const [isTestItRunning, setIsTestItRunning] = useState(false);
    const [testItResult, setTestItResult] = useState(null);
    const [notification, setNotification] = useState(null);

    // New Test Types States
    const [testType, setTestType] = useState('ping');

    // Assertion States
    const [locatorStrategy, setLocatorStrategy] = useState('getByRole');
    const [targetSelector, setTargetSelector] = useState('');
    const [expectedText, setExpectedText] = useState('');

    // Login Flow States
    const [usernameSelector, setUsernameSelector] = useState('');
    const [usernameValue, setUsernameValue] = useState('');
    const [passwordSelector, setPasswordSelector] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const [submitSelector, setSubmitSelector] = useState('');
    const [assertionSelector, setAssertionSelector] = useState('');

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRunTestIt = async () => {
        if (!testItUrl) {
            showNotification("Please enter a Target URL for testing.", "error");
            return;
        }

        const targetId = testCases.length > 0 ? testCases[0]._id || testCases[0].id : 'temp';

        setIsTestItRunning(true);
        setTestItResult(null);

        try {
            const payload = {
                testType,
                targetUrl: testItUrl,
                locatorStrategy,
                targetSelector,
                expectedText,
                usernameSelector,
                usernameValue,
                passwordSelector,
                passwordValue,
                submitSelector,
                assertionSelector
            };

            const response = await axios.post(`${API_URL}/testresults/${targetId}/automate`, payload, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = response.data;
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
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg flex items-center animate-in slide-in-from-right-5 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check className="mr-2" size={18} /> : <AlertCircle className="mr-2" size={18} />}
                    {notification.message}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Play size={24} />
                        </div>
                        Automated TestIt Section
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Run a headless Black Box browser test against your application URLs.
                        This module uses Playwright to verify the page loads and dynamic elements are present.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Target URL to Test
                        </label>
                        <input
                            type="url"
                            value={testItUrl}
                            onChange={(e) => setTestItUrl(e.target.value)}
                            placeholder="e.g., http://localhost:5173"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono shadow-sm"
                        />
                    </div>

                    {/* Test Type Tabs */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                        {['ping', 'assertion', 'login'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setTestType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${testType === type
                                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {type === 'ping' ? 'Ping Test' : type === 'assertion' ? 'Text Assertion' : 'Login Flow'}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Inputs based on Test Type */}
                    {testType === 'assertion' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Locator Strategy</label>
                                <select
                                    value={locatorStrategy} onChange={(e) => setLocatorStrategy(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100"
                                >
                                    <option value="getByRole">getByRole</option>
                                    <option value="getByTestId">getByTestId</option>
                                    <option value="css">CSS Selector</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Target Selector</label>
                                <input type="text" value={targetSelector} onChange={(e) => setTargetSelector(e.target.value)} placeholder="e.g., button, heading" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Expected Text</label>
                                <input type="text" value={expectedText} onChange={(e) => setExpectedText(e.target.value)} placeholder="e.g., Welcome" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                        </div>
                    )}

                    {testType === 'login' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Username Selector</label>
                                <input type="text" value={usernameSelector} onChange={(e) => setUsernameSelector(e.target.value)} placeholder="e.g., #email" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Username Value</label>
                                <input type="text" value={usernameValue} onChange={(e) => setUsernameValue(e.target.value)} placeholder="e.g., admin@example.com" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Password Selector</label>
                                <input type="text" value={passwordSelector} onChange={(e) => setPasswordSelector(e.target.value)} placeholder="e.g., #password" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Password Value</label>
                                <input type="password" value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} placeholder="••••••••" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Submit Button Selector</label>
                                <input type="text" value={submitSelector} onChange={(e) => setSubmitSelector(e.target.value)} placeholder="e.g., button[type='submit']" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Success Assertion Selector (Visible)</label>
                                <input type="text" value={assertionSelector} onChange={(e) => setAssertionSelector(e.target.value)} placeholder="e.g., .dashboard-header" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-100" />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleRunTestIt}
                        disabled={isTestItRunning || !testItUrl}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 text-base font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                    >
                        {isTestItRunning ? (
                            <>
                                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                Executing Playwright Script...
                            </>
                        ) : (
                            <>
                                <Play size={20} />
                                Run Automated UI Test
                            </>
                        )}
                    </button>

                    {/* Results Area */}
                    {testItResult && (
                        <div className={`mt-8 p-6 rounded-xl border animate-in fade-in slide-in-from-bottom-4 ${testItResult.success
                            ? (testItResult.status === 'Passed' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-red-50/50 dark:bg-red-900/10 border-red-500')
                            : 'bg-red-50/50 dark:bg-red-900/10 border-red-500'}`}>

                            <div className="flex items-center mb-4 text-sm font-bold uppercase tracking-wider">
                                {testItResult.success && testItResult.status === 'Passed'
                                    ? <Check className="mr-2 text-green-500" size={20} />
                                    : <AlertCircle className="mr-2 text-red-500" size={20} />}
                                <span className={testItResult.success && testItResult.status === 'Passed' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                                    Test Execution Result
                                </span>
                            </div>

                            <div className={`font-mono text-sm space-y-3 p-4 rounded-lg border shadow-sm ${testItResult.success && testItResult.status === 'Passed' ? 'bg-white dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800' : 'bg-red-50/50 dark:bg-red-900/20 text-red-500 border-red-500'}`}>
                                {testItResult.success ? (
                                    <>
                                        <div className={`flex justify-between items-center border-b pb-2 ${testItResult.status === 'Passed' ? 'border-slate-100 dark:border-slate-800' : 'border-red-200 dark:border-red-800/50'}`}>
                                            <span className={testItResult.status === 'Passed' ? 'text-slate-500' : 'text-red-500'}>Status:</span>
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${testItResult.status === 'Passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-500 text-white'}`}>{testItResult.status}</span>
                                        </div>
                                        <div className="flex justify-between items-start pt-1">
                                            <span className={`min-w-[80px] ${testItResult.status === 'Passed' ? 'text-slate-500' : 'text-red-500'}`}>Output:</span>
                                            <span className={`text-right whitespace-pre-wrap ${testItResult.status === 'Passed' ? '' : 'text-red-500'}`}>{testItResult.actualResult}</span>
                                        </div>
                                        {testItResult.time && (
                                            <div className={`flex justify-between items-center border-t pt-2 text-xs ${testItResult.status === 'Passed' ? 'border-slate-100 dark:border-slate-800' : 'border-red-200 dark:border-red-800/50'}`}>
                                                <span className={`${testItResult.status === 'Passed' ? 'text-slate-500' : 'text-red-500'}`}>Execution Time:</span>
                                                <span className={`${testItResult.status === 'Passed' ? 'text-slate-400' : 'text-red-400'}`}>{testItResult.time}ms</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-red-500 flex items-start gap-2">
                                        <AlertCircle className="shrink-0 mt-0.5" size={16} />
                                        Error: {testItResult.error}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestItPage;
