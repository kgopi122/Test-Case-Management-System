const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// @route   GET /api/activity
// @desc    Get recent activity for the user's team
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // If individual, they don't have a team activity feed (or we could implement personal activity later)
        // For now, return empty or specific personal logs if we had them.
        if (req.user.accessMode === 'individual') {
            return res.json({ success: true, data: [] });
        }

        const teamId = req.user.team;
        if (!teamId) {
            return res.status(400).json({ success: false, message: 'User not in a team' });
        }

        const activities = await Activity.find({ team: teamId })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'name');

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error fetching activity:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
