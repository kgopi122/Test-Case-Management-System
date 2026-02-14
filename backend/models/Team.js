const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Team name cannot exceed 50 characters']
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Team lead is required']
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
