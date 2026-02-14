const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['MEMBER_ADDED', 'TEST_CASE_UPDATE', 'TEST_CASE_CREATE'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
