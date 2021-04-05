const express = require('express');
const { PrismaClient } = require('@prisma/client');
// const moment = require('moment');
const loggedInCheck = require('../middleware.js').loggedInCheck;

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', loggedInCheck, (req, res) => {
  // const currentWeekStart = moment().startOf('week').format();
  prisma.user.findUnique({
    where: {
      userId: req.user.id
    },
    select: {
      firstname: true,
      lastname: true,
      email: true,
      profilePictureUrl: true,
      activities: {
        orderBy: {
          startDateLocal: 'desc'
        },
        take: 5,
        select: {
          distance: true,
          movingTime: true,
          type: true,
          startDateLocal: true
        }
      }
    }
  }).then(user => {
    res.json(user);
  }).catch(error => {
    res.json({ error: error.message });
  });
});

module.exports = router;