require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const companion = require('@uppy/companion');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./utils/errorHandler');
const routes = require('./routes');
const { companionConfig } = require('./config/companion');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use(routes);

// Companion
app.use(companion.app(companionConfig));

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Companion server listening on port ${port}`);
}); 