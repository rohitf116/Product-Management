const regexName = /^[a-z ,.'-]+$/i;
const regexPassword = /^([a-zA-Z0-9@$!%*#?&]{8,15})$/;

const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const regexNumber = /^([9876]{1})(\d{1})(\d{8})$/;
const regexPinCode = /^[1-9][0-9]{5}$}*$/;

const mongoose = require('mongoose');

const isValid = value => {
  if (typeof value === 'undefined' || value === null) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return true;
};

const isValidObjectId = function(objectId) {
  return mongoose.Types.ObjectId.isValid(objectId); // returns a boolean
};


const titleRegex = /^\w+$/;
const priceRegex = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;



const isValidFile = pw => {
  if (/(\/*\.(?:png|gif|webp|jpeg|jpg))/.test(pw)) return true;
};

module.exports = {
  regexName,
  regexEmail,
  regexPassword,
  regexNumber,
  regexPinCode,
  isValid,
  titleRegex,
  priceRegex,
  isValidObjectId,
  isValidFile
};
