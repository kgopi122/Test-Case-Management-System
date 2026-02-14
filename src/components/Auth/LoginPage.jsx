import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = ({ onLogin, onNavigateToSignup }) => {
    const [mode, setMode] = useState('individual'); // 'individual' (includes lead) or 'member'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        teamName: '',
        username: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = mode === 'member'
                ? { teamName: formData.teamName, username: formData.username, password: formData.password }
                : { email: formData.email, password: formData.password };

            const res = await axios.post('http://localhost:3001/api/auth/signin', payload);

            if (res.data.success) {
                localStorage.setItem('token', res.data.data.token);
                onLogin(res.data.data.user);
            }
        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.response?.data?.message || 'Authentication failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">TestCase AI</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'individual'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        onClick={() => { setMode('individual'); setError(''); }}
                    >
                        Individual / Lead
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'member'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        onClick={() => { setMode('member'); setError(''); }}
                    >
                        Team Member
                    </button>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'individual' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                                <input
                                    type="text"
                                    name="teamName"
                                    value={formData.teamName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {mode === 'individual' && (
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <button
                                onClick={onNavigateToSignup}
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Register here
                            </button>
                        </p>
                    </div>
                )}
                {mode === 'member' && (
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Team members must be added by their Team Lead.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
