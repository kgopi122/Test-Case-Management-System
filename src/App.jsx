import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import "./App.css"
import CodeRunnerPage from './components/CodeRunner/CodeRunnerPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import TeamDashboard from './components/Dashboard/TeamDashboard';

// --- ICONS (as inline SVG components) ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const Icons = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    testcases: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 6h-3v3H9v-3H6V9h3V6h3v3h3v3z",
    users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    settings: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    sun: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3zm0-7h-1v3h1V2zm0 18h-1v3h1v-3zM4.22 5.64l-.71-.71L2.1 6.34l.71.71 1.41-1.41zM18.36 19.78l-.71-.71-1.41 1.41.71.71 1.41-1.41zM22 11v1h-3v-1h3zM5 11v1H2v-1h3zM18.36 4.22l.71.71-1.41 1.41-.71-.71 1.41-1.41zM3.51 18.36l.71.71 1.41-1.41-.71-.71-1.41 1.41z",
    moon: "M10 2c-1.74 0-3.41.81-4.5 2.26C5.23 2.2 5 2.08 5 2c0-.55.45-1 1-1h3c.55 0 1 .45 1 1zM8.5 4c-.83 0-1.5.67-1.5 1.5S7.67 7 8.5 7s1.5-.67 1.5-1.5S9.33 4 8.5 4zm4.33 11.05c-.35-.27-.79-.34-1.21-.21l-1.42.45c-1.12.35-2.32-.12-2.92-1.14l-.62-1.05c-.2-.33-.52-.55-.88-.55s-.68.22-.88.55l-.62 1.05c-.6 1.02-1.8 1.49-2.92 1.14l-1.42-.45c-.43-.13-.86-.06-1.21.21C.91 15.42 0 16.57 0 17.85V20h18v-2.15c0-1.28-.91-2.43-2.17-2.8z",
    chevronDown: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
    search: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 17.59 13.41 12 19 6.41z",
    checkCircle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    cancel: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
    block: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-12h2v4h-2zm0 6h2v2h-2z",
    upload: "M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z",
    download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    history: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z",
    play: "M8 5v14l11-7z"
};

// --- Helper Functions ---
const formatDate = (isoString) => new Date(isoString).toLocaleString();
const getStatusStyles = (status) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Passed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'blocked': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'Blocked': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'ready': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'Not Run': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        default: return 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100';
    }
};
const getPriorityStyles = (priority) => {
    switch (priority ? priority.toLowerCase() : '') {
        case 'high': return 'bg-red-500';
        case 'critical': return 'bg-red-700';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-blue-500';
        default: return 'bg-gray-500';
    }
};

// --- UI Components ---

const Sidebar = ({ currentPage, setCurrentPage, onLogout, user }) => {
    const navItems = [
        { name: 'Dashboard', icon: 'dashboard' },
        { name: 'Test Cases', icon: 'testcases' },
        { name: 'Code Runner', icon: 'settings' },
    ];

    if (user?.role === 'Test Lead/Admin' || user?.role === 'admin' || user?.accessMode === 'team_lead' || user?.accessMode === 'individual') {
        navItems.push({ name: 'Team Management', icon: 'users' });
    }
    // Only show "Users" (global) if admin, maybe separate from Team Management
    if (user?.role === 'admin' && user?.accessMode !== 'team_lead') {
        navItems.push({ name: 'Users', icon: 'users' });
    }
    navItems.push({ name: 'Settings', icon: 'settings' });

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                <Icon path="M13.88,14.56L12,12.68L10.12,14.56L9,13.44L10.88,11.56L9,9.68L10.12,8.56L12,10.44L13.88,8.56L15,9.68L13.12,11.56L15,13.44M7.5,2C8.33,2 9,2.67 9,3.5V11.5C9,12.33 8.33,13 7.5,13H4C3.17,13 2.5,12.33 2.5,11.5V3.5C2.5,2.67 3.17,2 4,2H7.5M4.5,4V11H7.5L4.5,4M19,2A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V14H5V20H19V4H5V11H3V4A2,2 0 0,1 5,2H19Z" className="w-8 h-8 mr-2 text-indigo-500" />
                <h1 className="text-xl font-bold">TestCase AI</h1>
            </div>
            <nav className="flex-1 py-6 px-4">
                <ul>
                    {navItems.map(item => (
                        <li key={item.name}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage(item.name); }}
                                className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${currentPage === item.name ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <Icon path={Icons[item.icon]} className="w-5 h-5 mr-3" />
                                {item.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onLogout(); }}
                    className="flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <Icon path={Icons.logout} className="w-5 h-5 mr-3" />
                    Logout
                </a>
            </div>
        </aside>
    );
};

const Header = ({ title, user, theme, toggleTheme }) => (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
            {user?.team?.name && (
                <span className="px-3 py-1 text-sm font-medium text-indigo-100 bg-indigo-600 rounded-full dark:bg-indigo-500 dark:text-indigo-50">
                    {user.team.name}
                </span>
            )}
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                <Icon path={theme === 'dark' ? Icons.sun : Icons.moon} className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
                <img src={user.avatar || "https://placehold.co/100x100/7c3aed/ffffff?text=" + (user.name ? user.name.charAt(0) : 'U')} alt="user avatar" className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
            </div>
        </div>
    </header>
);



const TestCasesPage = ({ testCases, setTestCases, users, currentUser, onNavigateToRunner }) => {
    const [filteredCases, setFilteredCases] = useState(testCases);
    const [filters, setFilters] = useState({
        status: 'All',
        priority: 'All',
        search: '',
        assignee: 'All',
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState(null);

    useEffect(() => {
        let result = testCases;
        if (filters.status !== 'All') {
            result = result.filter(tc => tc.status === filters.status);
        }
        if (filters.priority !== 'All') {
            result = result.filter(tc => tc.priority === filters.priority);
        }
        if (filters.assignee !== 'All') {
            result = result.filter(tc => (tc.assignedTo?._id || tc.assignedTo) === filters.assignee);
        }
        if (filters.search) {
            result = result.filter(tc =>
                tc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                (tc._id || tc.id).toLowerCase().includes(filters.search.toLowerCase())
            );
        }
        setFilteredCases(result);
    }, [filters, testCases]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSaveTestCase = async (testCase) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (testCase.isNew) {
                // Create
                const { isNew, ...data } = testCase;
                // Clean up data for API
                if (!data.assignedTo) delete data.assignedTo;

                const res = await axios.post('http://localhost:3001/api/testcases', data, config);
                if (res.data.success) {
                    setTestCases([res.data.data.testCase, ...testCases]);
                }
            } else {
                // Update
                const { isNew, ...data } = testCase;
                const id = data._id || data.id;
                const res = await axios.put(`http://localhost:3001/api/testcases/${id}`, data, config);
                if (res.data.success) {
                    setTestCases(testCases.map(tc => (tc._id === id || tc.id === id) ? res.data.data.testCase : tc));
                }
            }
            setIsModalOpen(false);
            setEditingCase(null);
        } catch (error) {
            console.error("Error saving test case:", error);
            alert("Failed to save test case: " + (error.response?.data?.message || error.message));
        }
    };

    const openCreateModal = () => {
        setEditingCase({
            isNew: true,
            title: '', description: '', preconditions: '', steps: '', expectedResult: '',
            priority: 'medium', status: 'draft', tags: [], assignedTo: currentUser._id
        });
        setIsModalOpen(true);
    };

    const openEditModal = (testCase) => {
        setEditingCase(testCase);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this test case? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:3001/api/testcases/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTestCases(testCases.filter(tc => (tc._id || tc.id) !== id));
            } catch (error) {
                console.error("Error deleting test case:", error);
                alert("Failed to delete: " + error.message);
            }
        }
    };

    const handleOpenInRunner = (testCase) => {
        if (!testCase.linkedCode) {
            alert("This test case is not linked to any code session.");
            return;
        }
        onNavigateToRunner(testCase.linkedCode, testCase._id || testCase.id);
    };

    return (
        <div className="p-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Filters */}
                    <div className="relative col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by ID or Title..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="absolute inset-y-0 left-0 top-6 pl-3 flex items-center pointer-events-none">
                            <Icon path={Icons.search} className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
                            <option>All</option>
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                        <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
                            <option>All</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                        <select name="assignee" value={filters.assignee} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="All">All</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Test Cases ({filteredCases.length})
                </h3>
                <div className="space-x-2">
                    <button onClick={openCreateModal} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <Icon path={Icons.plus} className="w-5 h-5 mr-2" />
                        Create Test Case
                    </button>
                    {/* Import/Export can be implemented later */}
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="p-4">ID</th>
                            <th scope="col" className="p-4">Title</th>
                            <th scope="col" className="p-4">Status</th>
                            <th scope="col" className="p-4">Priority</th>
                            <th scope="col" className="p-4">Assignee</th>
                            <th scope="col" className="p-4">Last Updated</th>
                            <th scope="col" className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCases.map((tc, index) => {
                            // Backend populates assignedTo as object, or if simplistic fetch, might not. Plan ensured population.
                            const assigneeName = tc.assignedTo?.name || (users.find(u => u._id === tc.assignedTo)?.name) || 'Unassigned';
                            return (
                                <tr key={tc._id || tc.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">#{index + 1}</td>
                                    <td className="p-4 max-w-sm truncate" title={tc.title}>{tc.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyles(tc.status)}`}>
                                            {tc.status === 'completed' ? 'PASSED' : tc.status === 'failed' ? 'FAILED' : tc.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${getPriorityStyles(tc.priority)}`}></div>
                                            {tc.priority}
                                        </div>
                                    </td>
                                    <td className="p-4">{assigneeName}</td>
                                    <td className="p-4">{formatDate(tc.updatedAt)}</td>
                                    <td className="p-4 flex space-x-2">
                                        {tc.linkedCode && (
                                            <button
                                                onClick={() => handleOpenInRunner(tc)}
                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                title="Open in Runner"
                                            >
                                                <Icon path={Icons.play} className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button onClick={() => openEditModal(tc)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit">
                                            <Icon path={Icons.edit} className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(tc._id || tc.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                                            <Icon path={Icons.delete} className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredCases.length === 0 && <div className="p-4 text-center">No test cases found.</div>}
            </div>

            {isModalOpen && (
                <TestCaseModal
                    testCase={editingCase}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTestCase}
                    users={users}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

const TestCaseModal = ({ testCase, onClose, onSave, users, currentUser }) => {
    const [formData, setFormData] = useState(testCase);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagChange = (e) => {
        const val = e.target.value;
        const tags = val.split(',').map(tag => tag.trim());
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {formData.isNew ? 'Create New Test Case' : `Edit Test Case`}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Icon path={Icons.close} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="p-6 grid grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="mt-1 block w-full input-style"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preconditions</label>
                                <textarea name="preconditions" value={formData.preconditions} onChange={handleChange} rows="2" className="mt-1 block w-full input-style"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Steps to Execute</label>
                                {/* Steps logic skipped for brevity, keeping simple text or existing array logic */}
                                <div className="text-xs text-gray-500">Steps editing not fully implemented in this modal refactor.</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Result</label>
                                <textarea name="expectedResult" value={formData.expectedResult || ''} onChange={handleChange} rows="2" className="mt-1 block w-full input-style"></textarea>
                            </div>
                        </div>

                        {/* Sidebar Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full input-style">
                                    <option value="draft">Draft</option>
                                    <option value="ready">Ready</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full input-style">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To</label>
                                <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} className="mt-1 block w-full input-style">
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
                                <input type="text" value={formData.tags?.join(', ')} onChange={handleTagChange} className="mt-1 block w-full input-style" />
                            </div>
                        </div>
                    </div>

                    {/* History Section (Read Only) */}
                    <div className="px-6 pb-6 border-t dark:border-gray-700 pt-4">
                        <button type="button" className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none">
                            View History (Not implemented in modal)
                        </button>
                    </div>

                    <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Save Test Case
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagementPage = ({ users, setUsers }) => {
    return (
        <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">User Management</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(user => (
                        <li key={user._id || user.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full" src={user.avatar || `https://placehold.co/100x100/7c3aed/ffffff?text=${user.name ? user.name.charAt(0) : 'U'}`} alt="" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {user.role}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// Inline LoginPage Removed in favor of dedicated component

export default function App() {
    const [theme, setTheme] = useState('light');
    const [currentUser, setCurrentUser] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false); // New state for toggling Login/Signup
    const [users, setUsers] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [activeImportId, setActiveImportId] = useState(null);
    const [activeTestCaseId, setActiveTestCaseId] = useState(null);

    // Global Socket Connection for Notifications
    useEffect(() => {
        if (currentUser && currentUser.team) {
            const socket = io('http://localhost:3001');
            const teamId = typeof currentUser.team === 'object' ? currentUser.team._id : currentUser.team;

            socket.on('connect', () => {
                console.log('Global Socket connected:', socket.id);
                if (teamId) socket.emit('join_team', teamId);
            });

            socket.on('member_added', (data) => {
                // Use a more distinct alert or eventual toast
                alert(`New Team Member: ${data.message}`);
            });

            return () => socket.disconnect();
        }
    }, [currentUser]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Restore session
            axios.get('http://localhost:3001/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.data.success) {
                    setCurrentUser(res.data.data.user);
                }
            }).catch(err => {
                console.error("Session restore failed", err);
                localStorage.removeItem('token');
            });
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, currentPage]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch users
            const usersRes = await axios.get('http://localhost:3001/api/auth/users', config);
            if (usersRes.data.success) setUsers(usersRes.data.data.users);

            // Fetch test cases
            const tcRes = await axios.get('http://localhost:3001/api/testcases', config);
            if (tcRes.data.success) setTestCases(tcRes.data.data.testCases);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setTestCases([]);
        setUsers([]);
        setActiveImportId(null);
        setActiveTestCaseId(null);
    };

    const handleUserUpdate = (updatedUser) => {
        setCurrentUser(updatedUser);
    };

    if (!currentUser) {
        if (isRegistering) {
            return (
                <SignupPage
                    onSignupSuccess={(user) => setCurrentUser(user)}
                    onNavigateToLogin={() => setIsRegistering(false)}
                />
            );
        }
        return (
            <LoginPage
                onLogin={(user) => setCurrentUser(user)}
                onNavigateToSignup={() => setIsRegistering(true)}
            />
        );
    }

    return (
        <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 flex text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200`}>
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} user={currentUser} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header title={currentPage} user={currentUser} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {currentPage === 'Dashboard' && <DashboardPage testCases={testCases} currentUser={currentUser} />}
                    {currentPage === 'Test Cases' &&
                        <TestCasesPage
                            testCases={testCases}
                            setTestCases={setTestCases}
                            users={users}
                            currentUser={currentUser}
                            onNavigateToRunner={(importId, testCaseId) => {
                                if (importId) setActiveImportId(importId);
                                if (testCaseId) setActiveTestCaseId(testCaseId);
                                setCurrentPage('Code Runner');
                            }}
                        />}
                    {currentPage === 'Users' && <UserManagementPage users={users} setUsers={setUsers} />}
                    {currentPage === 'Team Management' && <TeamDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />}
                    {currentPage === 'Code Runner' && <CodeRunnerPage currentUser={currentUser} importId={activeImportId} highlightedTestCaseId={activeTestCaseId} />}
                    {currentPage === 'Settings' && <div className="p-6">Settings Page Placeholder</div>}
                </main>
            </div>
        </div>
    );
}
