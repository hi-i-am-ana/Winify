const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const {accessSecret } = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', (req, res) => {
  const jwtToken = req.header('token');
  // Checking for string 'null' here
  if (jwtToken === 'null') {
    return res.json({ message: 'no token' })
  };
  try {
  const payload = jwt.verify(jwtToken, accessSecret);
  const user = payload.user;
  prisma.user.findUnique({
    where: {
      userId: user.id
    },
    select: {
      userId: true,
      profilePictureUrl: true
    }
  })
  .then(user => {
    res.json({ userId: user.userId, profilePictureUrl: user.profilePictureUrl});
  })
  } catch (error) {
    res.json({ message: 'invalid token' });
  }
});

module.exports = router;