/* eslint-disable node/no-unsupported-features/es-syntax */
const { compareSync } = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');
const userModel = require('../model/userModel');

exports.authentication = function (req, res, next) {
  try {
    const { userId } = req.params;
     // if userId is not a valid ObjectId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).send({
        status: false,
        message: 'userId is invalid'
      });
    }
    let token = req.headers.authorization;
    if (!token) {
      return res
      .status(400)
        .send({ status: false, message: 'Token must be present' });
    }
    console.log(token)
    token = token.split(' ')[1];
    console.log(token)
    const decodedToken = jwt.verify(token, 'functionup-radon', function(
      err,

      tokeneed
    ) {
      if (err) return null;
      return tokeneed;
    });
    if (!decodedToken)
      return res
        .status(401)
        .send({ status: false, message: 'Token is invalid' });
    req.key = token;
    next();
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

exports.authorization = async function(req, res, next) {
  const token = req.key;
  //If no token is present in the request header return error
  if (!token)
    return res
      .status(400)
      .send({ status: false, msg: 'token must be present' });
  const decodedtoken = jwt.verify(token, 'functionup-radon');
  const { userId } = req.params;
  const searchForId = await userModel.findById(userId);
  if (!searchForId)
    return res.status(400).send({ status: false, msg: 'invalid id' });
  if (decodedtoken.userId == userId) {
    next()
  } else {
    return res.status(403).send({
      status: false,
      msg: 'The Login User Are not authorize to do this actions'
    });
  }
};
