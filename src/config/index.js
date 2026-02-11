require('dotenv').config();

const config = {
  secretKey: process.env.SECRET_KEY || null
};

module.exports = config;