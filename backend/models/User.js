const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');



const userSchema = new mongoose.Schema({

  name: {

    type: String,

    required: [true, 'Please provide a name'],

    trim: true

  },

  email: {

    type: String,

    required: [true, 'Please provide an email'],

    unique: true,

    lowercase: true,

    trim: true

  },

  password: {

    type: String,

    required: [true, 'Please provide a password'],

    minlength: 4,

    select: false

  },

  role: {

    type: String,

    enum: ['farmer', 'buyer', 'admin'],

    required: true

  },

  userId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  phone: {

    type: String,

    required: [true, 'Please provide a phone number']

  },

  address: {

    street: String,

    city: String,

    state: String,

    pincode: String,

    country: { type: String, default: 'India' }

  },

  // Farmer-specific fields

  farmSize: {

    type: Number,

    default: null

  },

  cropsGrown: [{

    type: String

  }],

  // Buyer-specific fields

  businessName: {

    type: String,

    default: null

  },

  businessType: {

    type: String,

    enum: ['retailer', 'exporter', 'company', null],

    default: null

  },

  licenseNumber: {

    type: String,

    default: null

  },

  // Verification fields

  isVerified: {

    type: Boolean,

    default: false

  },

  verificationDocuments: [{

    documentType: String,

    documentUrl: String,

    uploadedAt: Date

  }],

  // Rating system

  rating: {

    average: { type: Number, default: 0 },

    count: { type: Number, default: 0 }

  },

  // Avatar image (optional)

  avatarUrl: {

    type: String,

    default: ''

  },

  // Account status

  isActive: {

    type: Boolean,

    default: true

  },

  createdAt: {

    type: Date,

    default: Date.now

  },

  updatedAt: {

    type: Date,

    default: Date.now

  }

});



// Hash password before saving

userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) {

    return next();

  }

  this.password = await bcrypt.hash(this.password, 10);

  next();

});



// Compare password method

userSchema.methods.comparePassword = async function(candidatePassword) {

  return await bcrypt.compare(candidatePassword, this.password);

};



module.exports = mongoose.model('User', userSchema);



