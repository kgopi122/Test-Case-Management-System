const mongoose = require('mongoose');
const User = require('../models/User');
// We need to define TestCase schema inline or require it if available, 
// strictly speaking we should require it, but for a standalone script, let's keep it simple or require the model.
// Assuming models are in ../models
// Let's try to require TestCase model, if it fails we skip it.

const uri = 'mongodb://localhost:27017/tcm_database';

const connect = async () => {
    try {
        await mongoose.connect(uri);
        console.log('\n🔌 Connected to Local MongoDB');
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
};

const viewData = async () => {
    await connect();

    // 1. View Users
    console.log('\n──────────────────────────────────────────');
    console.log(' 👤 USERS REQUESTED');
    console.log('──────────────────────────────────────────');
    const users = await User.find().sort({ createdAt: -1 }); // Newest first

    if (users.length === 0) {
        console.log('No users found.');
    } else {
        console.table(users.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            ID: u._id.toString()
        })));
    }

    console.log('\n(Passwords are hidden for security)\n');

    process.exit(0);
};

viewData();
