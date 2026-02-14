import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const Icons = {
    userAdd: "M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
};

const TeamDashboard = ({ currentUser, onUserUpdate }) => {
    const [members, setMembers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMember, setNewMember] = useState({ username: '', password: '', name: '', email: '', testerId: '' });
    const [newTeamName, setNewTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser.team) {
            fetchMembers();

            // Socket connection
            const socket = io('http://localhost:3001');

            const teamId = typeof currentUser.team === 'object' ? currentUser.team._id : currentUser.team;
            socket.emit('join_team', teamId);

            socket.on('member_added', (data) => {
                console.log('Received member_added:', data);
                setMembers(prev => [...prev, data.member]);
                // Alert handled globally in App.jsx
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [currentUser.team]);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3001/api/teams/members', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMembers(res.data.data.members);
            }
        } catch (err) {
            console.error("Failed to fetch members", err);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3001/api/teams', { name: newTeamName }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Update parent state with new user info (containing team and accessMode)
                onUserUpdate(res.data.data.user);
            }
        } catch (err) {
            console.error("Create team error", err);
            setError(err.response?.data?.message || "Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3001/api/teams/members', newMember, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMembers([...members, res.data.data.member]);
                setIsAddModalOpen(false);
                setNewMember({ username: '', password: '', name: '', email: '', testerId: '' });
                setIsAddModalOpen(false); // Close modal
            }
        } catch (err) {
            console.error("Add member error", err);
            setError(err.response?.data?.message || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser.team) {
        return (
            <div className="p-6">
                <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                            <Icon path={Icons.userAdd} className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Your Team</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            You are currently an Individual user. Create a team to invite members and collaborate.
                        </p>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                    <form onSubmit={handleCreateTeam} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g. QA Warriors"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating Team...' : 'Create Team & Upgrade'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {currentUser.team.name ? currentUser.team.name : 'Team Management'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        {members.length} Members &bull; Manage your team members and their access.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Icon path={Icons.userAdd} className="w-5 h-5 mr-2" />
                    Add Member
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                        <tr>
                            <th className="p-4 border-b dark:border-gray-600">Name</th>
                            <th className="p-4 border-b dark:border-gray-600">Tester ID</th>
                            <th className="p-4 border-b dark:border-gray-600">Username</th>
                            <th className="p-4 border-b dark:border-gray-600">Email</th>
                            <th className="p-4 border-b dark:border-gray-600">Role</th>
                            <th className="p-4 border-b dark:border-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr key={member._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold text-xs uppercase">
                                            {member.name ? member.name.charAt(0) : 'U'}
                                        </div>
                                        {member.name}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">{member.testerId || '-'}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">@{member.username}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">{member.email || '-'}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 capitalize">{member.role}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No team members found. Start by adding one!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Team Member</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name (Optional)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tester ID (Optional)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                                    value={newMember.testerId}
                                    onChange={e => setNewMember({ ...newMember, testerId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Optional)</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                                    value={newMember.email}
                                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                                    value={newMember.username}
                                    onChange={e => setNewMember({ ...newMember, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                                    value={newMember.password}
                                    onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamDashboard;
