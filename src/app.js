const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const db = require('./dataUtils/dbInit');

const middlewares = require('./middlewares');
const cwlRouter = require('./routers/cwlRouter');
const uploadRouter = require('./routers/uploadRouter');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'I am alive',
  });
});

app.use('/api/v1/cwl', cwlRouter);
app.use('/api/v1/upload', uploadRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;