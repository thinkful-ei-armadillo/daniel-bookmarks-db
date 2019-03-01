'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const validate = require('./validate');
const errorHandler = require('./error-handler');
const bookmarksRoute = require('./bookmarks/bookmarks-route');

const app = express();

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', { skip: () => NODE_ENV === 'test'}));
app.use(express.json());
app.use(cors());
app.use(helmet());
// app.use(validate);

app.use(bookmarksRoute);

app.post('/articles', (req, res, next) => {
  res.status(201).send('stuff');
});

// placeholder response for / location
app.get('/', (req,res) => {
  res.send('Hello, world!');
});

app.use(errorHandler);

module.exports = app;