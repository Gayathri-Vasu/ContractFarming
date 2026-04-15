const mongoose = require('mongoose');

const ROLES = ['farmer', 'buyer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    // Optional extra fields depending on role
    farmSize: {
      type: String,
    },
    mainCrops: {
      type: String,
    },
    companyName: {
      type: String,
    },
    preferredCommodities: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    phone: this.phone,
    location: this.location,
    farmSize: this.farmSize,
    mainCrops: this.mainCrops,
    companyName: this.companyName,
    preferredCommodities: this.preferredCommodities,
    createdAt: this.createdAt,
  };
};

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};

