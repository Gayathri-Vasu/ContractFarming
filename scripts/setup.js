const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envExample = path.join(root, 'backend', '.env.example');
const envFile = path.join(root, 'backend', '.env');

if (!fs.existsSync(envExample)) {
  console.error('backend/.env.example not found.');
  process.exit(1);
}

if (fs.existsSync(envFile)) {
  console.log('backend/.env already exists. Skipping.');
} else {
  fs.copyFileSync(envExample, envFile);
  console.log('Created backend/.env from .env.example. Edit it with your MongoDB URI and secrets.');
}

console.log('\nNext steps:');
console.log('  1. (Optional) Edit backend/.env - set MONGODB_URI and JWT_SECRET at minimum.');
console.log('  2. Ensure MongoDB is running (local or Atlas).');
console.log('  3. From this folder run: npm run install:all  (then)  npm run dev');
