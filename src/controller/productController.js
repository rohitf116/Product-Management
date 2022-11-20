const productModel = require('../model/productModel');
const aws = require('aws-sdk');
const mongoose = require('mongoose');
const dotevn = require('dotenv');
dotevn.config();
const {
  titleRegex,
  priceRegex,
  isValid,
  isValidFile
} = require('../validations/validations');
aws.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: 'ap-south-1'
});

const uploadFile = async function(file) {
  return new Promise(function(resolve, reject) {
    // this function will upload file to aws and return the link
    const s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

    const uploadParams = {
      Bucket: 'my-product-management-project', //HERE
      ContentType: 'jpeg',
      Key: `productManagement5grp38/${file.originalname}`, //HERE
      Body: file.buffer
    };

    s3.upload(uploadParams, function(err, data) {
      if (err) {
        return reject({ error: err });
      }
      return resolve(data.Location);
    });

    // let data= await s3.upload( uploadParams)
    // if( data) return data.Location
    // else return "there is an error"
  });
};

exports.createProduct = async function(req, res) {
  try {
    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      productImage,
      style,
      availableSizes,
      installments
    } = req.body;
    // installments = installments - 0;
    price = price * 1;

    if (!Object.keys(req.body).length)
      return res
        .status(400)
        .send({ status: false, message: 'Body cannot be empty' });
    if (!isValid(title))
      return res
        .status(400)
        .send({ status: false, msg: 'title cannot be empty' });
    if (!titleRegex.test(title))
      return res
        .status(400)
        .send({ status: false, msg: 'title must be valid character' });
    const alreadytitle = await productModel.findOne({ title });
    if (alreadytitle)
      return res
        .status(400)
        .send({ status: false, msg: 'This title is already being used' });
    if (!isValid(description))
      return res
        .status(400)
        .send({ status: false, msg: 'description cannot be empty' });
    if (!isValid(price))
      return res
        .status(400)
        .send({ status: false, msg: 'price cannot be empty' });
    if (!priceRegex.test(price))
      return res
        .status(400)
        .send({ status: false, msg: 'price must be a number' });
    if (!isValid(currencyId))
      return res
        .status(400)
        .send({ status: false, msg: 'currencyId cannot be empty' });
    if (currencyId !== 'INR')
      return res
        .status(400)
        .send({ status: false, msg: 'currencyId must be INR' });
    if (!isValid(currencyFormat))
      return res
        .status(400)
        .send({ status: false, msg: 'currencyFormat cannot be empty' });
    if (currencyFormat !== '₹')
      return res
        .status(400)
        .send({ status: false, msg: 'currencyFormat must be ₹' });
    if (isFreeShipping) {
      if (!isValid(isFreeShipping))
        return res
          .status(400)
          .send({ status: false, msg: 'isFreeShipping cannot be empty' });
      if (!(isFreeShipping == 'true' || isFreeShipping == 'false'))
        return res
          .status(400)
          .send({ status: false, msg: 'isFreeShipping must be true or false' });
    }
    let files = req.files;
    if (files.length == 0)
      return res
        .status(400)
        .send({ status: false, message: 'Please Provide Product Image' });
    if (!isValidFile(files[0].originalname))
      return res.status(400).send({
        status: false,
        message: 'Image type should be png|gif|webp|jpeg|jpg'
      });
    if (files[0].fieldname !== 'productImage')
      return res.status(400).send({
        status: false,
        message: 'Please Provide Product Image as productImage'
      });
    productImage = await uploadFile(files[0]);

    if (style) {
      if (!isValid(style))
        return res
          .status(400)
          .send({ status: false, msg: 'style cannot be empty' });
      if (!titleRegex.test(style))
        return res
          .status(400)
          .send({ status: false, msg: 'style must be a valid character' });
    }
    if (availableSizes) {
      availableSizes = availableSizes.split(',');
      if (!isValid(availableSizes))
        return res
          .status(400)
          .send({ status: false, msg: 'availableSizes cannot be empty' });

      let sizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'];
      let newArr = [];
      for (let j = 0; j < availableSizes.length; j++) {
        newArr.push(availableSizes[j].trim());
      }
      for (let i = 0; i < newArr.length; i++) {
        if (sizes.includes(newArr[i]) == false) {
          return res
            .status(400)
            .send({ status: false, message: 'Please put valid size' });
        }
      }
      availableSizes = newArr;
    } else {
      return res.status(400).send({
        status: false,
        msg: 'availableSizes atleast one size require '
      });
    }
    if (installments) {
      if (!isValid(installments))
        return res
          .status(400)
          .send({ status: false, msg: 'installments cannot be empty' });
      if (!priceRegex.test(installments))
        return res
          .status(400)
          .send({ status: false, msg: 'installments must be number' });
    }
    const productCreated = await productModel.create({
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      productImage,
      style,
      availableSizes,
      installments
    });
    res
      .status(201)
      .send({ status: true, message: 'Product Created', data: productCreated });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

//get product

exports.getProduct = async (req, res) => {
  try {
    let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query;

    let query = { isDeleted: false };

    if (size) {
      let size1 = size.split(',').map(x => x.trim().toUpperCase());
      if (size1.map(x => x).filter(x => x === false).length !== 0)
        return res.status(400).send({
          status: false,
          message: 'Size Should be among  S,XS,M,X,L,XXL,XL'
        });
      query.availableSizes = { $all: size1 };
    }

    if (name) {
      query['title'] = { $regex: name };
    }

    if (priceGreaterThan) {
      query['price'] = { $gt: priceGreaterThan };
    }

    if (priceLessThan) {
      query['price'] = { $lt: priceLessThan };
    }

    if (priceGreaterThan && priceLessThan) {
      query['price'] = { $gt: priceGreaterThan, $lt: priceLessThan };
    }

    if (priceSort) {
      if (!(priceSort == -1 || priceSort == 1)) {
        return res.status(400).send({
          status: false,
          message:
            'You can only use 1 for Ascending and -1 for Descending Sorting'
        });
      }
    }
    let getAllProduct = await productModel
      .find(query)
      .sort({ price: priceSort });

    if (!(getAllProduct.length > 0)) {
      return res
        .status(404)
        .send({ status: false, message: 'Products Not Found' });
    }
    return res.status(200).send({
      status: true,
      count: getAllProduct.length,
      message: 'Success',
      data: getAllProduct
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
//get by id
exports.getProductById = async function(req, res) {
  try {
    let { productId } = req.params;
    if (!isValid(productId.trim())) {
      return res
        .status(400)
        .send({ status: false, msg: 'productId is required' });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: 'productId is Invalid' });
    }
    let productList = await productModel.findOne({
      _id: productId,
      isDeleted: false
    });
    if (!productList) {
      return res
        .status(404)
        .send({ status: false, msg: 'productId is not found' });
    }
    return res.status(200).send({
      status: true,
      msg: 'succesfully get product profile detail',
      data: productList
    });
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};
//newUpdate
exports.newUpdate = async function(req, res) {
  try {
    const { productId } = req.params;
    const {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments
    } = req.body;
    if (!mongoose.isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: 'productId is invalid' });
    if (!Object.keys(req.body).length)
      return res
        .status(400)
        .send({ status: false, message: 'Please give some value to chagne' });
    if (title) {
      if (!isValid(title))
        return res
          .status(400)
          .send({ status: false, message: 'title cannot be empty' });
      if (!titleRegex.test(title))
        return res
          .status(400)
          .send({ status: false, message: 'title contains invalid chaarc' });
      const alreadytitle = await productModel.findOne({ title });
      if (alreadytitle)
        return res
          .status(400)
          .send({ status: false, message: 'This tile is already being used' });
    }
    if (description) {
      if (!isValid(description))
        return res
          .status(400)
          .send({ status: false, message: 'description cannot be empty' });
    }
    if (price) {
      if (!isValid(price))
        return res
          .status(400)
          .send({ status: false, message: 'price cannot be empty' });
      if (!priceRegex.test(price))
        return res
          .status(400)
          .send({ status: false, message: 'price must be a number' });
    }
    if (currencyId) {
      if (!isValid(currencyId))
        return res
          .status(400)
          .send({ status: false, message: 'currencyId cannot be empty' });
      if (currencyId != 'INR')
        return res
          .status(400)
          .send({ status: false, message: 'currencyId must be INR' });
    }
    if (currencyFormat) {
      if (!isValid(currencyFormat))
        return res
          .status(400)
          .send({ status: false, message: 'currencyFormat cannot be empty' });
      if (currencyFormat != '₹')
        return res
          .status(400)
          .send({ status: false, message: 'currencyFormat must be ₹' });
    }
    console.log(isFreeShipping);
    if (isFreeShipping) {
      if (!isValid(isFreeShipping))
        return res
          .status(400)
          .send({ status: false, message: 'isFreeShipping cannot be empty' });
      if (!(isFreeShipping == 'true' || isFreeShipping == 'false'))
        return res
          .status(400)
          .send({ status: false, message: 'isFreeShipping must be boolean' });
    }
    if (style) {
      if (!isValid(style))
        return res
          .status(400)
          .send({ status: false, message: 'style cannot be empty' });
    }
    if (availableSizes) {
      if (!isValid(availableSizes))
        return res
          .status(400)
          .send({ status: false, message: 'availableSizes cannot be empty' });
      let sizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'];
      let newArr = [];
      for (let j = 0; j < availableSizes.length; j++) {
        newArr.push(availableSizes[j].trim());
      }
      for (let i = 0; i < newArr.length; i++) {
        if (sizes.includes(newArr[i]) == false) {
          return res
            .status(400)
            .send({ status: false, message: 'Please put valid size' });
        }
      }
      availableSizes = newArr;
    }
    if (installments) {
      if (!isValid(installments))
        return res
          .status(400)
          .send({ status: false, message: 'installments cannot be empty' });
    }

    let { files } = req;
    let uploadedFileURL;
    if (files?.length) {
      if (files[0].fieldname != 'productImage')
        // upload only png and jpg format
        return res
          .status(400)
          .send({ status: false, msg: 'Only images allowed as profileImage' });
      if (!files[0].originalname.match(/\.(png|jpg|gif|webp|jpeg)$/))
        // upload only png and jpg format
        return res
          .status(400)
          .send({ status: false, msg: 'Only images allowed' });
      uploadedFileURL = await uploadFile(files[0]);
    }
    //upload to s3 and get the uploaded link
    // res.send the link back to frontend/postman
    const savedObj = {};
    if (title) savedObj.title = title;
    if (description) savedObj.description = description;
    if (price) savedObj.price = price;
    if (uploadedFileURL) savedObj.productImage = uploadedFileURL;
    if (isFreeShipping) savedObj.isFreeShipping = isFreeShipping;
    if (currencyId) savedObj.currencyId = currencyId;
    if (currencyFormat) savedObj.currencyFormat = currencyFormat;
    if (style) savedObj.style = style;
    if (availableSizes) savedObj.availableSizes = availableSizes;
    if (installments) savedObj.installments = installments;
    const updateProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      savedObj,
      { new: true }
    );
    if (updateProduct == null)
      return res.status(404).send({ status: false, message: 'Not found' });
    res.status(200).send({
      status: true,
      message: 'product is successfully updated',
      data: updateProduct
    });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

//delete
exports.deleteProduct = async function(req, res) {
  try {
    const { productId } = req.params;

    if (!productId)
      return res
        .status(404)
        .send({ status: false, msg: 'Please provide valid productId' });

    const checkProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false
    });
    if (!checkProduct)
      return res.status(404).send({ status: false, msg: 'No Product Found' });
    await productModel.findOneAndUpdate(
      { _id: productId },
      { isDeleted: true, deletedAt: Date.now() },
      { new: true }
    );

    res.status(204).send({
      status: true,
      msg: 'Product has been deleted successfully'
    });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};
