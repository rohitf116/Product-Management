const orderModel = require('../model/orderModel');
const cartModel = require('../model/cartModel');
const userModel = require('../model/userModel');
const { isValid } = require('../validations/validations');

const { isValidObjectId } = require('mongoose');

const createOrder = async function (req, res) {
  try {
    const { userId } = req.params;

    const { cartId, cancellable } = req.body;
    if (!Object.keys(req.body))
      return res
        .status(400)
        .send({ status: false, message: 'body cannot be empty' });
    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: 'userId is invalid' });
    const user = await userModel.findOne({ _id: userId });
    if (!user)
      return res
        .status(400)
        .send({ status: false, message: 'userId does not exist' });
    if (!isValid(cartId))
      return res
        .status(400)
        .send({ status: false, message: 'cartId cannot be empty' });
    if (!isValidObjectId(cartId))
      return res
        .status(400)
        .send({ status: false, message: 'cartId is invalid' });
    const cart = await cartModel.findOne({
      _id: cartId,
      isDeleted: false,
    });
    if (cart && cart?.userId?.toString() !== userId)
      return res
        .status(400)
        .send({ status: false, message: 'cart does not exist on this user' });
    if (!cart)
      return res
        .status(400)
        .send({ status: false, message: 'cart does not exist ' });

    if (cancellable) {
      if (!isValid(cancellable))
        return res
          .status(400)
          .send({ status: false, message: 'cancellable cannot be empty' });
      if (!(cancellable == false || cancellable == true))
        return res
          .status(400)
          .send({ status: false, message: 'cancellable must be a boolean' });
    }
    let totalQuantity = 0;
    const cartItems = cart.items;
    cartItems.forEach((items) => (totalQuantity += items.quantity));
    const newOrder = {
      userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      totalItems: cart.totalItems,
      totalQuantity: totalQuantity,
      cancellable,
    };
    const createOrder = await orderModel.create(newOrder);
    return res.status(201).send({ status: true, data: createOrder });
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

const updateOrder = async function (req, res) {
  try {
    const { userId } = req.params;
    const { orderId,status } = req.body;

    //Validations
    if (!isValid(orderId)) {
      return res
        .status(400)
        .send({ status: false, message: 'Please enter orderId' });
    }

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: 'userId is invalid' });
    }
    if (!isValidObjectId(orderId)) {
      return res
        .status(400)
        .send({ status: false, message: 'orderId is invalid' });
    }

    const isUserExists = await userModel.findById(userId);
    if (!isUserExists) {
      return res
        .status(404)
        .send({ status: false, message: 'userData not found' });
    }

    const isOrderExists = await orderModel.findOne({
      _id: orderId,
      isDeleted: false,
    });
    console.log(isOrderExists,isUserExists)
    if (!isOrderExists) {
      return res
        .status(404)
        .send({ status: false, message: 'orderData not found' });
    }
    //If the cancellable is false then order can't be cancelled.
    if (isOrderExists.status == 'cancelled')
      return res
        .status(400)
        .send({ status: false, message: 'This order is already cancelled' });
    if (isOrderExists.cancellable != true && status=='cancelled')
      return res
        .status(400)
        .send({ status: false, message: "This order can't be cancelled" });

    if (isOrderExists.userId != userId) {
      return res
        .status(400)
        .send({ status: false, message: 'order not belongs to the user' });
    }

    const updatedData = await orderModel.findOneAndUpdate(
      { _id: orderId, isDeleted: false },
      { status: status },
      { new: true }
    );

    if (!updatedData) {
      return res
        .status(404)
        .send({ status: false, message: 'data not found for update' });
    }

    return res.status(200).send({
      status: true,
      message: 'order updated successfully',
      data: updatedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createOrder, updateOrder };
