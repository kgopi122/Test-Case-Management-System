const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/tcm_database';

mongoose.connect(uri)
    .then(() => {
        console.log('✅ MongoDB Connection Successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    });
