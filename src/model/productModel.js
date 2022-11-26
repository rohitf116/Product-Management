const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currencyId: { type: String, required: true },
    currencyFormat: { type: String, required: true },
    isFreeShipping: { type: Boolean, default: false },
    productImage: { type: String, required: true }, // s3 link
    style: { type: String },
    availableSizes: { type: [String], required: true },
    countInStock: { type: Number, default: 100 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    installments: { type: Number },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
