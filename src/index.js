const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const route = require('./routes/route');

const app = express();

app.use(express.json());

app.use(multer().any())



mongoose
  .connect(
    'mongodb+srv://rohit_sonawane:SuperSu@cluster0.e9hjfiy.mongodb.net/group38Database'
  )
  .then(() => console.log('MongoDb is connected'))
  .catch(err => console.log(err));

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
  console.log(`Express app running on port ${process.env.PORT || 3000}`);
});
