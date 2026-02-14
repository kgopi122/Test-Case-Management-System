const mongoose = require('mongoose');

const connectAtlas = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    return false;
  }
};

module.exports = connectAtlas;


