import React, { useState } from 'react';
import axios from 'axios';

const SignupPage = ({ onSignupSuccess, onNavigateToLogin }) => {
    const [mode, setMode] = useState('individual'); // 'individual' or 'team' (lead)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        teamName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                mode: mode,
                ...(mode === 'team' && { teamName: formData.teamName })
            };

            const res = await axios.post('http://localhost:3001/api/auth/signup', payload);

            if (res.data.success) {
                // Auto login or redirect to login? Let's auto login for better UX
                localStorage.setItem('token', res.data.data.token);
                onSignupSuccess(res.data.data.user);
            }
        } catch (err) {
            console.error("Signup Error:", err);
            const msg = err.response?.data?.message || 'Registration failed';
            const validationErrors = err.response?.data?.errors?.map(e => e.msg).join(', ');
            setError(validationErrors ? `${msg}: ${validationErrors}` : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">TestCase AI</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {mode === 'individual' ? 'Create an Individual Account' : 'Register a New Team'}
                    </p>
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
                        Individual
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'team'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        onClick={() => { setMode('team'); setError(''); }}
                    >
                        Team Lead
                    </button>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'team' && (
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
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
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
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            onClick={onNavigateToLogin}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
