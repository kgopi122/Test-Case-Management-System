const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const listDbContent = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log(`🔌 Connecting to: ${uri}`);

        if (!uri) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📂 Found ${collections.length} collections:`);

        if (collections.length === 0) {
            console.log('   (Database is empty)');
        }

        for (const collection of collections) {
            const name = collection.name;
            const count = await mongoose.connection.db.collection(name).countDocuments();
            console.log(`\n--- Collection: ${name} (${count} documents) ---`);

            if (count > 0) {
                const docs = await mongoose.connection.db.collection(name).find({}).limit(5).toArray();
                docs.forEach((doc, index) => {
                    console.log(`[${index + 1}]`, JSON.stringify(doc, null, 2));
                });
                if (count > 5) {
                    console.log(`... and ${count - 5} more documents.`);
                }
            } else {
                console.log('   (Empty collection)');
            }
        }

        console.log('\n✨ Database inspection complete.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
        process.exit(0);
    }
};

listDbContent();
