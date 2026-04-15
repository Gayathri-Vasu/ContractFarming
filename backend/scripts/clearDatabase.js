const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('⚠️  Are you sure you want to clear ALL data? Type "yes" to confirm: ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      try {
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        console.log('Clearing collections...');
        for (let collection of collections) {
          await mongoose.connection.db.collection(collection.name).deleteMany({});
          console.log(`✅ Cleared: ${collection.name}`);
        }
        
        console.log('\n✅ Database cleared successfully!');
        process.exit(0);
      } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
      }
    } else {
      console.log('Operation cancelled.');
      process.exit(0);
    }
    readline.close();
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});





