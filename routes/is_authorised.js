const express = require('express');
const jwt = require('jsonwebtoken');
const {accessSecret } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const jwtToken = req.header('token');
  // Checking for string 'null' here
  if (jwtToken === 'null') {
    return res.json({ message: 'no token' })
  };
  try {
  const payload = jwt.verify(jwtToken, accessSecret);
  const user = payload.user;
  res.json({ userId: user.id })
  } catch (error) {
    res.json({ message: 'invalid token' });
  }
});

module.exports = router;