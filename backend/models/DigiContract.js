const mongoose = require("mongoose");

const digiContractSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      unique: true,
      index: true,
    },
    contractId: { type: String, unique: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    crop: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    deliveryDate: { type: Date, required: true },
    paymentStatus: { type: String, default: "Pending" },
    status: { type: String, default: "Pending" },
    pdfPath: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DigiContract", digiContractSchema);
