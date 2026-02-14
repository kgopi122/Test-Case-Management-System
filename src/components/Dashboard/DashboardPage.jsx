import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Activity,
    Calendar,
    ArrowUpRight,
    Briefcase,
    UserPlus // Added UserPlus icon
} from 'lucide-react';

const DashboardPage = ({ testCases, currentUser }) => {
    const [activities, setActivities] = useState([]);

    // Fetch Activities
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3001/api/activity', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setActivities(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch activities", err);
            }
        };

        if (currentUser.team) {
            fetchActivities();
        }
    }, [currentUser]);

    // Listen for real-time member additions
    useEffect(() => {
        if (currentUser && currentUser.team) {
            const socket = io('http://localhost:3001');
            const teamId = typeof currentUser.team === 'object' ? currentUser.team._id : currentUser.team;

            if (teamId) socket.emit('join_team', teamId);

            socket.on('member_added', (data) => {
                // Construct a temporary activity object
                const newActivity = {
                    _id: Date.now().toString(), // Temp ID
                    type: 'MEMBER_ADDED',
                    title: 'New Team Member',
                    description: `${data.member.name || data.member.username} joined the team`,
                    createdAt: new Date().toISOString(),
                    user: { name: 'System' } // simplified
                };
                setActivities(prev => [newActivity, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [currentUser]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        const total = testCases.length;
        const passed = testCases.filter(tc => ['completed', 'passed'].includes(tc.status?.toLowerCase())).length;
        const failed = testCases.filter(tc => ['failed'].includes(tc.status?.toLowerCase())).length;
        const blocked = testCases.filter(tc => ['blocked'].includes(tc.status?.toLowerCase())).length;
        const pending = total - passed - failed - blocked;

        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        return { total, passed, failed, blocked, pending, passRate };
    }, [testCases]);

    // --- Derived Data for Widgets ---
    const recentActivity = useMemo(() => {
        // Map test cases to activity format
        const tcActivities = testCases.map(tc => ({
            _id: tc._id || tc.id,
            type: 'TEST_CASE_UPDATE',
            title: tc.title,
            description: `Status updated to ${tc.status}`,
            createdAt: tc.updatedAt,
            status: tc.status // keep for styling
        }));

        // Combine with fetched activities
        const combined = [...tcActivities, ...activities];

        return combined
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }, [testCases, activities]);

    const assignedToMe = useMemo(() => {
        return testCases.filter(tc => (tc.assignedTo?._id || tc.assignedTo) === currentUser._id);
    }, [testCases, currentUser]);

    // --- Helper Components ---

    // Modern Stat Card
    const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }) => (
        <div className={`p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:shadow-md`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
                    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-lg ${bgClass} ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    // Simple Donut Chart
    const DonutChart = ({ data }) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulative = 0;

        if (total === 0) return <div className="text-center text-slate-400 py-10">No data available</div>;

        return (
            <div className="relative w-64 h-64 mx-auto">
                <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                    {data.map((item, index) => {
                        const percentage = item.value / total;
                        const dasharray = 2 * Math.PI * 15.9155;
                        const strokeDasharray = `${dasharray * percentage} ${dasharray * (1 - percentage)}`;
                        const strokeDashoffset = dasharray * (1 - cumulative); // Fixed offset calculation
                        cumulative += percentage;

                        return (
                            <circle
                                key={index}
                                cx="16" cy="16" r="15.9155"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="5"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500 ease-out"
                            />
                        );
                    })}
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Total</span>
                </div>
            </div>
        );
    };

    const chartData = [
        { label: 'Passed', value: stats.passed, color: '#22c55e' }, // green-500
        { label: 'Failed', value: stats.failed, color: '#ef4444' }, // red-500
        { label: 'Blocked', value: stats.blocked, color: '#eab308' }, // yellow-500
        { label: 'Pending', value: stats.pending, color: '#cbd5e1' }, // slate-300
    ].filter(d => d.value > 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400">Welcome back, {currentUser.name}</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <Calendar size={18} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Test Cases"
                    value={stats.total}
                    icon={Briefcase}
                    bgClass="bg-indigo-50 dark:bg-indigo-900/20"
                    colorClass="text-indigo-600 dark:text-indigo-400"
                />
                <StatCard
                    title="Pass Rate"
                    value={`${stats.passRate}%`}
                    subtext={`${stats.passed} passed`}
                    icon={CheckCircle}
                    bgClass="bg-green-50 dark:bg-green-900/20"
                    colorClass="text-green-600 dark:text-green-400"
                />
                <StatCard
                    title="Failed"
                    value={stats.failed}
                    subtext="Requires attention"
                    icon={XCircle}
                    bgClass="bg-red-50 dark:bg-red-900/20"
                    colorClass="text-red-600 dark:text-red-400"
                />
                <StatCard
                    title="Blocked"
                    value={stats.blocked}
                    icon={AlertCircle}
                    bgClass="bg-yellow-50 dark:bg-yellow-900/20"
                    colorClass="text-yellow-600 dark:text-yellow-400"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Feed */}
                    {/* Activity Feed - Only for Team Users */}
                    {(currentUser.accessMode === 'team_lead' || currentUser.accessMode === 'team_member') && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Activity size={20} className="text-indigo-500" />
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {recentActivity.length > 0 ? recentActivity.map((item) => (
                                    <div key={item._id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'MEMBER_ADDED' ? 'bg-purple-500' :
                                            item.status === 'failed' ? 'bg-red-500' :
                                                item.status === 'passed' || item.status === 'completed' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {item.title}
                                                </p>
                                                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 text-sm py-4">No recent activity.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* My Tasks */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" />
                            Assigned to Me
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Title</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {assignedToMe.length > 0 ? assignedToMe.map(tc => (
                                        <tr key={tc._id || tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                                {tc.title}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tc.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    tc.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                    {tc.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${tc.status === 'failed' ? 'bg-red-500' :
                                                        tc.status === 'passed' || tc.status === 'completed' ? 'bg-green-500' :
                                                            'bg-slate-400'
                                                        }`} />
                                                    <span className="capitalize">{tc.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                                                No tasks assigned to you.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="col-span-1 space-y-6">
                    {/* Chart Widget */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 w-full text-left">Execution Status</h3>
                        {stats.total > 0 ? (
                            <>
                                <DonutChart data={chartData} />
                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {d.label} <span className="text-xs text-slate-400">({d.value})</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-400 py-10 flex flex-col items-center">
                                <Activity size={48} className="mb-2 opacity-50" />
                                <p>No execution data yet</p>
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
