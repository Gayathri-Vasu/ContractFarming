const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming';
  
  console.log('🔍 Testing MongoDB Connection...\n');
  console.log(`Connection string: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);
  
  try {
    console.log('Attempting to connect...');
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ SUCCESS! MongoDB is connected.\n');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Collections found: ${collections.length}`);
    if (collections.length > 0) {
      console.log('Collections:', collections.map(c => c.name).join(', '));
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 MongoDB is not running!\n');
      console.error('To start MongoDB on Windows:');
      console.error('  1. Open Command Prompt as Administrator');
      console.error('  2. Run: net start MongoDB\n');
      console.error('Or use MongoDB Atlas (cloud):');
      console.error('  1. Sign up at https://www.mongodb.com/cloud/atlas');
      console.error('  2. Create free cluster');
      console.error('  3. Update MONGODB_URI in .env file\n');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔧 Authentication failed!');
      console.error('Check your MongoDB username and password in .env file\n');
    } else if (error.message.includes('timeout')) {
      console.error('\n🔧 Connection timeout!');
      console.error('Check if MongoDB is running and accessible\n');
    }
    
    console.error('See MONGODB_SETUP.md for detailed instructions\n');
    process.exit(1);
  }
};

testConnection();





