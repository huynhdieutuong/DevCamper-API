const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = express();

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

app.get('/', (req, res) => res.send('Hello'));

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);
