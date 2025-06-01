const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
const cwlRouter = require('./routers/cwlRouter');

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

app.use('/api/v1', cwlRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
