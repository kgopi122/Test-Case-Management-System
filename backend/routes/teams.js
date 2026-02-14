const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Team = require('../models/Team');
const Activity = require('../models/Activity');
const { body, validationResult } = require('express-validator');

// @route   POST /api/teams/members
// @desc    Add a new member to the team (Team Lead only)
// @access  Private (Team Lead)
router.post('/members', [
    auth,
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim(),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
    body('testerId').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Check if user is a team lead
        if (req.user.accessMode !== 'team_lead' || !req.user.team) {
            return res.status(403).json({ success: false, message: 'Only Team Leads can add members' });
        }

        const { username, password, name, email, testerId } = req.body;
        const teamId = req.user.team;

        // Check for existing member with same username, email, or testerId IN THIS TEAM
        // We use $or query to check all conditions at once
        const duplicateQuery = {
            team: teamId,
            $or: [{ username }]
        };

        if (email) duplicateQuery.$or.push({ email });
        if (testerId) duplicateQuery.$or.push({ testerId });

        const existingMember = await User.findOne(duplicateQuery);

        if (existingMember) {
            let msg = 'Member already exists';
            if (existingMember.username === username) msg = 'Username already exists in this team';
            else if (email && existingMember.email === email) msg = 'Email already exists in this team';
            else if (testerId && existingMember.testerId === testerId) msg = 'Tester ID already exists in this team';

            return res.status(400).json({ success: false, message: msg });
        }

        // Create new member
        const memberData = {
            username,
            password,
            name: name || username,
            role: 'tester',
            accessMode: 'team_member',
            team: teamId
        };
        if (email) memberData.email = email;
        if (testerId) memberData.testerId = testerId;

        const member = new User(memberData);

        await member.save();

        // Add to team members
        await Team.findByIdAndUpdate(teamId, { $push: { members: member._id } });

        // Real-time Notification
        const io = req.app.get('io');
        if (io) {
            console.log(`[API] Emitting member_added to team_${teamId}`);
            io.to(`team_${teamId}`).emit('member_added', {
                member: member.toJSON(),
                message: `${member.username} added to the team`
            });
        }

        // Create Activity Log
        await Activity.create({
            type: 'MEMBER_ADDED',
            title: 'New Team Member',
            description: `${member.name || member.username} joined the team`,
            user: req.user._id, // The requester (Team Lead)
            team: teamId,
            metadata: { memberId: member._id.toString() }
        });

        res.status(201).json({
            success: true,
            message: 'Team member added successfully',
            data: { member: member.toJSON() }
        });

    } catch (error) {
        console.error('Add member error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }

});

// @route   POST /api/teams
// @desc    Create a new team (Upgrade Individual to Team Lead)
// @access  Private (Individual)
router.post('/', [
    auth,
    body('name').trim().notEmpty().withMessage('Team name is required').isLength({ max: 50 }).withMessage('Team name too long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name } = req.body;

        // Check if user is already in a team
        if (req.user.team) {
            return res.status(400).json({ success: false, message: 'You are already part of a team.' });
        }

        // Check if team name exists
        const existingTeam = await Team.findOne({ name });
        if (existingTeam) {
            return res.status(400).json({ success: false, message: 'Team name already taken.' });
        }

        // Create Team
        const team = new Team({
            name,
            lead: req.user._id,
            members: [req.user._id]
        });
        await team.save();

        // Update User
        const user = await User.findByIdAndUpdate(req.user._id, {
            team: team._id,
            accessMode: 'team_lead',
            role: 'admin' // Upgrade role to admin/lead
        }, { new: true }); // Return updated user

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: {
                team,
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('Create team error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/teams/members
// @desc    Get all members of the current user's team
// @access  Private
router.get('/members', auth, async (req, res) => {
    try {
        if (!req.user.team) {
            return res.status(400).json({ success: false, message: 'User is not part of a team' });
        }

        const members = await User.find({ team: req.user.team }).select('-password').sort({ name: 1 });

        res.json({
            success: true,
            data: { members }
        });

    } catch (error) {
        console.error('Get members error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
