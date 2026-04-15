const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

console.log('ENV file:', path.resolve(__dirname, '..', '.env'));
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'missing');

