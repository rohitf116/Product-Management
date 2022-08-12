/* eslint-disable node/no-unsupported-features/es-syntax */
const cartModel = require('../model/cartModel');
const userModel = require('../model/userModel');
const productModel = require('../model/productModel');
const { isValid } = require('../validations/validations');
const { isValidObjectId } = require('mongoose');

exports.createCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cartId, productId } = req.body;

    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: 'invalid userId' });
    const user = await userModel.findOne({ _id: userId });
    if (!user)
      return res
        .status(404)
        .send({ status: false, message: 'no such user found' });
    if (!isValid(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'Product Id is requried' });
    }

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: 'invalid productId' });
    const findProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false
    });
    if (!findProduct)
      return res.status(404).send({
        status: false,
        message: 'no such product found or maybe deleted'
      });

    const productPrice = findProduct.price;

    const productDetails = {
      productId,
      quantity: 1
    };

    let findCart;

    if ('cartId' in req.body) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: 'invalid cartId' });
      findCart = await cartModel.findOne({ _id: cartId });
      if (!findCart)
        return res
          .status(404)
          .send({ status: false, message: 'cart id does not exists' });
    }
    findCart = await cartModel.findOne({ userId: userId });

    if (findCart) {
      const alreadyProductsId = findCart.items.map(x => x.productId.toString());
      if (alreadyProductsId.includes(productId)) {
        const updatedCart = await cartModel.findOneAndUpdate(
          { 'items.productId': productId, userId: userId },
          { $inc: { 'items.$.quantity': 1, totalPrice: productPrice } },
          { new: true }
        );
        //positional operator($) is used to increase in array
        return res
          .status(201)
          .send({ status: true, message: 'Success', data: updatedCart });
      }
      const updatedCart = await cartModel.findOneAndUpdate(
        { userId: userId },
        {
          $push: { items: productDetails },
          $inc: { totalItems: 1, totalPrice: productPrice }
        },
        { new: true }
      );

      return res
        .status(201)
        .send({ status: true, message: 'Success', data: updatedCart });
    }

    const cartCreate = {
      userId,
      items: [productDetails],
      totalItems: 1,
      totalPrice: productPrice
    };
    const cartCreated = await cartModel.create(cartCreate);
    res.status(201).send({
      status: true,
      message: 'cart created successfully',
      data: cartCreated
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

// **********************Update Api********************
exports.updateCart = async function (req, res) {
  try {
      const {userId} = req.params
      const data = req.body

      const { cartId, productId, removeProduct } = data

      if (Object.keys(data).length < 0) return res.status(400).send({ status: false, message: "Please enter only valid keys" });

      if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter a valid prductId" });

      if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter a valid cartId" });

      if (!isValid(removeProduct)) return res.status(400).send({ status: false, message: "removeProduct is required" });

      removeProduct = Number(removeProduct)
      if (removeProduct < 0 || removeProduct > 1) return res.status(400).send({ status: false, message: 'please enter 0 or 1 in removeProduct' })

      let cart = await cartModel.findOne({ userId: userId })
      console.log(cart)
      if (!cart) return res.status(404).send({ status: false, message: 'This user has no cart' })
      if (cart._id.toString() !== cartId) return res.status(400).send({ status: false, message: 'This cartId is not for the user who logged in' })

      let product = await productModel.findOne({ _id: productId, isDeleted: false })
      if (!product) return res.status(404).send({ status: false, message: 'product not found' })

      //using loop
      let index = 0
      for (let i = 0; i < cart.items.length; i++) {
          if (cart.items[i].productId == productId) {
              index = i;
          }
      }

      //removeProduct == 0
      if (removeProduct == 0 && cart.items[index].quantity) {
          let total = cart.totalPrice - (product.price * cart.items[index].quantity)
          cart.totalPrice = total
          cart.items.splice(index, 1)
      }

      //removeProduct == 1
      if (removeProduct == 1 && cart.items[index].quantity) {
          if (cart.items[index].quantity == 1) {
              cart.items.splice(index, 1)
              cart.totalItems = cart.totalItems - 1
              let total = cart.totalPrice - product.price
              cart.totalPrice = total
          } else {
              cart.items[index].quantity = cart.items[index].quantity - 1
              let total = cart.totalPrice - product.price
              cart.totalPrice = total
          }
      }
      cart.totalItems = cart.items.length
      await cart.save()
      return res.status(200).send({ status: true, message: 'Success', data: cart })

  } catch (err) {
      console.log(err)
      return res.status(500).send(err.message)
  }
}

// ***************** Get Api********************
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: 'userId is invalid' });
    }

    const userDoc = await userModel.findById(userId);
    if (!userDoc) {
      return res
        .status(400)
        .send({ status: false, message: 'user does not exist' });
    }

    const findCart = await cartModel
      .findOne({ userId, isDeleted: false })
      .populate('items.productId');

    if (!findCart)
      return res.status(404).send({
        status: false,
        message: `No cart found with this ${userId} userId`
      });

    res.status(200).send({ status: true, message: 'Success', data: findCart });
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

// *******************Delete Api*********************
exports.deleteCart = async function(req, res) {
  try {
    const { userId } = req.params;
    if (req.params.userId) {
      if (!userId)
        return res
          .status(404)
          .send({ status: false, msg: 'Please provide valid userId' });
    }

    const checkCart = await cartModel.findOne({ userId, isDeleted: false });
    console.log(checkCart);
    if (!checkCart['items']?.length)
      return res.status(404).send({ status: false, msg: 'No Cart Found' });
    const deleteData = await cartModel.findOneAndUpdate(
      { _id: checkCart._id, isDeleted: false },
      { items: [], totalPrice: 0, totalItems: 0 },
      { new: true }
    );

    res.status(200).send({
      status: true,
      msg: 'Product has been deleted successfully',
      data: deleteData
    });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};
