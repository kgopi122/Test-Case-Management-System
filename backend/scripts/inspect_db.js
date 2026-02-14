const mongoose = require('mongoose');
const User = require('../models/User');

const uri = 'mongodb://localhost:27017/tcm_database';

const inspect = async () => {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB: tcm_database');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📂 Collections:', collections.map(c => c.name).join(', '));

        const userCount = await User.countDocuments();
        console.log(`\n👥 Total Users: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find().limit(3);
            console.log('\n📝 Recent Users (Passwords are hashed):');
            users.forEach(u => {
                console.log(`- ${u.name} (${u.email})`);
                console.log(`  Role: ${u.role}`);
                console.log(`  Password Hash: ${u.password.substring(0, 20)}...`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

inspect();
