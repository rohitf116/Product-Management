const regexName = /^[a-z ,.'-]+$/i;
const regexPassword = /^([a-zA-Z0-9@$!%*#?&]{8,15})$/;

const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const regexNumber = /^([9876]{1})(\d{1})(\d{8})$/;
const regexPinCode = /^[1-9][0-9]{5}$}*$/;

const isValid = value => {
  if (typeof value === 'undefined' || value === null) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return true;
};

const titleRegex = /^\w+$/;
const priceRegex = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;

module.exports = {
  regexName,
  regexEmail,
  regexPassword,
  regexNumber,
  regexPinCode,
  isValid,
  titleRegex,
  priceRegex
};
