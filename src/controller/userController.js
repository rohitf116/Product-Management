const userModel = require('../model/userModel');
const aws = require('aws-sdk');
const dotevn = require('dotenv');
dotevn.config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  regexName,
  regexEmail,
  regexPassword,
  regexNumber,
  regexPinCode,
  isValid,
  isValidObjectId
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
      ACL: 'public-read',
      Bucket: 'my-product-management-project', //HERE
      Key: `ecommerce-user/${file.originalname}`, //HERE
      Body: file.buffer
    };

    s3.upload(uploadParams, function(err, data) {
      if (err) {
        return reject({ error: err });
      }
      return resolve(data.Location);
    });
  });
};

exports.register = async function(req, res) {
  try {
    let { fname, lname, password, email, phone, address } = req.body;
    address = JSON.parse(address);

    if (!Object.keys(req.body).length)
      return res
        .status(400)
        .send({ status: false, message: 'Body cannot be empty' });
    let { files } = req;
    if (!files?.length) {
      return res
        .status(400)
        .send({ status: false, message: 'profileimage  is missing' });
    }
    if (files[0].fieldname != 'profileImage')
      // upload only png and jpg format
      return res.status(400).send({
        status: false,
        message: 'Only images allowed as profileImage'
      });
    if (!files[0].originalname.match(/\.(png|jpg|jpeg|webp|gif)$/))
      // upload only png and jpg format
      return res
        .status(400)
        .send({ status: false, message: 'Only images allowed' });
    //upload to s3 and get the uploaded link
    // res.send the link back to frontend/postman
    const uploadedFileURL = await uploadFile(files[0]);
    //   console.log(uploadedFileURL)
    if (!isValid(fname))
      return res
        .status(400)
        .send({ status: false, message: 'fname cannot be empty' });
    if (!regexName.test(fname))
      return res
        .status(400)
        .send({ status: false, message: 'please enter valid characters' });
    if (!isValid(lname))
      return res
        .status(400)
        .send({ status: false, message: 'lname cannot be empty' });
    if (!regexName.test(lname))
      return res.status(400).send({
        status: false,
        message: 'please enter valid lname characters'
      });
    if (!isValid(password))
      return res
        .status(400)
        .send({ status: false, message: 'password cannot be empty' });
    const maskedPassword = await bcrypt.hash(password, 12);
    if (!isValid(email))
      return res
        .status(400)
        .send({ status: false, message: 'email cannot be empty' });
    if (!regexEmail.test(email))
      return res.status(400).send({
        status: false,
        message: 'please enter valid email characters'
      });
    const foundEmail = await userModel.findOne({ email });
    if (foundEmail)
      return res
        .status(400)
        .send({ status: false, message: 'This email is already being used' });
    if (!isValid(phone))
      return res
        .status(400)
        .send({ status: false, message: 'phone cannot be empty' });
    if (!regexNumber.test(phone))
      return res.status(400).send({
        status: false,
        message: 'please enter valid phone Number'
      });
    const foundPhone = await userModel.findOne({ phone });
    if (foundPhone)
      return res
        .status(400)
        .send({ status: false, message: 'This phone is already being used' });
    // address=JSON.parse(address)
    if (!isValid(address?.shipping?.street))
      return res
        .status(400)
        .send({ status: false, message: 'street of shipping cannot be empty' });
    if (!isValid(address?.shipping?.city))
      return res
        .status(400)
        .send({ status: false, message: 'city of shipping cannot be empty' });
    if (!isValid(address?.shipping?.pincode))
      return res.status(400).send({
        status: false,
        message: 'pincode of shipping  cannot be empty'
      });
    if (!regexPinCode.test(address?.shipping?.pincode))
      return res.status(400).send({
        status: false,
        message: 'please use valid pincode of shipping'
      });
    if (!isValid(address?.billing?.street))
      return res
        .status(400)
        .send({ status: false, message: 'street of billing cannot be empty' });
    if (!isValid(address?.billing?.city))
      return res
        .status(400)
        .send({ status: false, message: 'city of billing cannot be empty' });
    if (!isValid(address?.billing?.pincode))
      return res
        .status(400)
        .send({ status: false, message: 'pincode of billing cannot be empty' });
    if (!regexPinCode.test(address.billing.pincode))
      return res.status(400).send({
        status: false,
        message: 'please use valid pincode of billing'
      });
    const userCreated = await userModel.create({
      fname,
      lname,
      password: maskedPassword,
      email,
      profileImage: uploadedFileURL,
      phone,
      address
    });
    res.status(201).send({
      status: true,
      message: 'User created successfully',
      data: userCreated
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getProfile = async function(req, res) {
  try {
    let { userId } = req.params;

    // if userId is not a valid ObjectId
    if (!isValidObjectId(userId)) {
      return res.status(400).send({
        status: false,
        message: 'userId is invalid'
      });
    }

    // if user does not exist
    let userDoc = await userModel.findById(userId);
    if (!userDoc) {
      return res.status(400).send({
        status: false,
        message: 'user does not exist'
      });
    }

    res.status(200).send({
      status: true,
      message: 'Sucess',
      data: userDoc
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: false,
      message: ' Server Error',
      error: err.message
    });
  }
};

exports.userLogin = async function(req, res) {
  try {
    const { email, password } = req.body;
    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send({ status: false, message: 'All fields are mandatory.' });
    }
    // for validation
    if (!isValid(email)) {
      return res
        .status(400)
        .send({ status: false, message: 'Email must be present' });
    }
    if (!isValid(password)) {
      return res
        .status(400)
        .send({ status: false, message: 'Password must be present' });
    }
    if (!regexEmail.test(email))
      return res.status(400).send({
        status: false,
        message: 'please enter valid email'
      });
    let UsersData = await userModel.findOne({
      email
    });
    // UsersData = UsersData.toObject();
    if (!UsersData)
      return res.status(401).send({ status: false, message: 'User Not found' });
    const unmasked = await bcrypt.compare(password, UsersData.password);
    console.log(UsersData.fname);
    if (!UsersData || !unmasked) {
      return res
        .status(401)
        .send({ status: false, message: 'Enter a valid Email or Password' });
    }

    const token = jwt.sign(
      {
        userId: UsersData._id.toString(),
        expiresIn: '24h'
      },
      'functionup-radon'
    );
    console.log(token);
    res.setHeader('x-api-key', token);
    res.status(200).send({
      status: true,
      message: 'User Login Succesful',
      data: { userId: UsersData._id, name: UsersData.fname, token: token }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ status: false, message: err.message });
  }
};

exports.updatedUser = async function(req, res) {
  try {
    let { userId } = req.params;
    const { fname, lname, password, email, phone, address } = req.body;
    const savedObj = {};
    if (!Object.keys(req.body).length)
      return res
        .status(400)
        .send({ status: false, message: 'Body cannot be empty' });
    let { files } = req;
    let uploadedFileURL;
    console.log(files.fieldname);
    if (files.length) {
      console.log(files.fieldname);
      if (files[0].fieldname != 'profileImage')
        // upload only png and jpg format
        return res.status(400).send({
          status: false,
          message: 'Only images allowed as profileImage'
        });
      if (!files[0].originalname.match(/\.(png|jpg|gif|webp|jpeg)$/))
        // upload only png and jpg format
        return res
          .status(400)
          .send({ status: false, message: 'Only images allowed' });

      //upload to s3 and get the uploaded link
      // res.send the link back to frontend/postman
      uploadedFileURL = await uploadFile(files[0]);
    }
    //   console.log(uploadedFileURL)
    if (fname) {
      if (!isValid(fname))
        return res
          .status(400)
          .send({ status: false, message: 'fname cannot be empty' });
      if (!regexName.test(fname))
        return res
          .status(400)
          .send({ status: false, message: 'please enter valid characters' });
    }
    if (lname) {
      if (!isValid(lname))
        return res
          .status(400)
          .send({ status: false, message: 'lname cannot be empty' });
      if (!regexName.test(lname))
        return res.status(400).send({
          status: false,
          message: 'please enter valid lname characters'
        });
    }
    let maskedPassword;
    if (password) {
      if (!isValid(password))
        return res
          .status(400)
          .send({ status: false, message: 'password cannot be empty' });
      if (!regexPassword.test(password))
        return res.status(400).send({
          status: false,
          message:
            'password must be between 8 to 15 digits one numbbe and one alphabet'
        });
      //hashing password

      maskedPassword = await bcrypt.hash(password, 12);
    }
    if (email) {
      if (!isValid(email))
        return res
          .status(400)
          .send({ status: false, message: 'email cannot be empty' });
      if (!regexEmail.test(email))
        return res.status(400).send({
          status: false,
          message: 'please enter valid email characters'
        });
      const foundEmail = await userModel.findOne({ email });
      if (foundEmail)
        return res
          .status(400)
          .send({ status: false, message: 'This email is already being used' });
    }
    if (phone) {
      if (!isValid(phone))
        return res
          .status(400)
          .send({ status: false, message: 'phone cannot be empty' });
      if (!regexNumber.test(phone))
        return res.status(400).send({
          status: false,
          message: 'please enter valid phone characters'
        });
      const foundPhone = await userModel.findOne({ phone });
      if (foundPhone)
        return res
          .status(400)
          .send({ status: false, message: 'This phone is already being used' });
    }
    if (address) {
      add = JSON.parse(address);

      const { shipping, billing } = add;
      if (shipping) {
        let { street, city, pincode } = shipping;
        if (street) {
          if (!isValid(street))
            return res.status(400).send({
              status: false,
              message: 'Shipping street   must be alphabetic characters'
            });
          savedObj['address.shipping.street'] = street;
        }
        if (city) {
          if (!isValid(city))
            return res.status(400).send({
              status: false,
              message: 'Shipping city must be alphabetic characters'
            });
          savedObj['address.shipping.city'] = city;
        }
        if (pincode) {
          if (!regexPinCode.test(pincode))
            return res.status(400).send({
              status: false,
              message: 'Shipping pincode must be number min length 6'
            });
          savedObj['address.shipping.pincode'] = pincode;
        }
      }
      if (billing) {
        let { street, city, pincode } = billing;
        if (street) {
          if (!isValid(street))
            return res.status(400).send({
              status: false,
              message: 'Billing street   must be alphabetic characters'
            });
          savedObj['address.billing.street'] = street;
        }
        if (city) {
          if (!isValid(city))
            return res.status(400).send({
              status: false,
              message: 'Billing city must be alphabetic characters'
            });
          savedObj['address.billing.city'] = city;
        }
        if (pincode) {
          if (!regexPinCode.test(pincode))
            return res.status(400).send({
              status: false,
              message: 'Billing pincode must be number min length 6'
            });
          savedObj['address.billing.phone'] = pincode;
        }
      }
    }

    if (fname) savedObj.fname = fname;
    if (lname) savedObj.lname = lname;
    if (password) savedObj.password = maskedPassword;
    if (email) savedObj.email = email;
    if (files.length && files[0].fieldname == 'profileImage')
      savedObj.profileImage = uploadedFileURL;
    if (phone) savedObj.phone = phone;

    const updatedData = await userModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: savedObj
      },
      { new: true }
    );
    return res.status(200).send({
      status: true,
      message: 'User profile updated',
      data: updatedData
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ err: err.message });
  }
};
