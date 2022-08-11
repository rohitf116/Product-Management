const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;
const cartSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', unique: true, required: true },
    items: [
      {
        quantity: { type: Number, min: 1 },
        productId: { type: ObjectId, ref: 'Product' },
        _id: false
      }
    ],
    totalPrice: { type: Number, required: true },
    totalItems: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
