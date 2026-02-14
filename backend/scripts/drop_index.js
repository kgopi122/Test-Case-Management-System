const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const collection = mongoose.connection.collection('users');
        try {
            await collection.dropIndex('email_1');
            console.log('✅ Dropped email_1 index');
        } catch (e) {
            console.log('Index might not exist:', e.message);
        }

        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

dropIndex();
