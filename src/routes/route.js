const express = require('express');
const {
  updatedUser,
  userLogin,
  getProfile,
  register
} = require('../controller/userController');
const { authentication, authorization } = require('../middleware/auth');
const {
  createProduct,
  newUpdate,
  getProduct,
  getProductById,
  deleteProduct
} = require('../controller/productController');
const {
  createCart,
  updateCart,
  getCart,
  deleteCart
} = require('../controller/cartController');
const { createOrder, updateOrder } = require('../controller/orderController');

const router = express.Router();

router.post('/register', register);

router.get('/user/:userId/profile', authentication, authorization, getProfile);

router.post('/login', userLogin);

router.put('/user/:userId/profile', authentication, authorization, updatedUser);

router.post('/products', createProduct);

router.get('/products/', getProduct);

router.get('/products/:productId', getProductById);

router.put('/products/:productId', newUpdate);

router.delete('/products/:productId', deleteProduct);

router.post('/users/:userId/cart', authentication, authorization, createCart);

router.put('/users/:userId/cart', authentication, authorization, updateCart);

router.get('/users/:userId/cart', authentication, authorization, getCart);

router.delete('/users/:userId/cart', authentication, authorization, deleteCart);

router.post(
  '/users/:userId/orders',
  authentication,
  authorization,
  createOrder
);

router.put('/users/:userId/orders', authentication, authorization, updateOrder);

module.exports = router;
