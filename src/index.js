const express = require('express');
const mongoose = require('mongoose');
const dotevn = require('dotenv');
const multer = require('multer');
const cors = require('cors');
const route = require('./routes/route');

const app = express();
dotevn.config();
app.use(cors());
app.use(express.json());

app.use(multer().any());

mongoose
  .connect(process.env.MONGO_STRING)
  .then(() => console.log('MongoDb is connected'))
  .catch(err => console.log(err));

app.use('/', route);

app.listen(process.env.PORT || 3001, function() {
  console.log(`Express app running on port ${process.env.PORT || 3000}`);
});
