const express = require('express');
const { PrismaClient } = require('@prisma/client');
const loggedInCheck = require('../middleware.js').loggedInCheck;

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', loggedInCheck, (req, res) => {
  res.json(req.user.id);
})

module.exports = router;