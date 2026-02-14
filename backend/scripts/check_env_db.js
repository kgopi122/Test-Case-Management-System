const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const checkConnection = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        fs.writeFileSync('result.txt', '❌ MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        fs.writeFileSync('result.txt', '✅ MongoDB Connection Successful using .env URI');
        console.log('Connected successfully');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        fs.writeFileSync('result.txt', `❌ MongoDB Connection Failed: ${error.message}`);
        console.error('Connection failed');
        process.exit(1);
    }
};

checkConnection();
