const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connect using the URI from your environment variables
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // CRITICAL: Stop the server immediately if the database fails to connect.
        // An API without its database is useless and will just throw errors to users.
        process.exit(1);
    }
};

module.exports = connectDB;
