const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { host, port, stravaClient, accessSecret } = require('../config'); // clean up this!!!
// Import shared validation function
const validation = require('../public/js/shared_login_validation.js');

const router = express.Router();
const prisma = new PrismaClient();

// POST route for login
router.post('/', (req, res) => {
  let validationParams = {
    emailEmptyAlert: false,
    emailInvalidAlert: false,
    emailMissingAlert: false,
    emailUnconfirmedAlert: false,
    passwordEmptyAlert: false,
    passwordInvalidAlert: false,
    passwordIncorrectAlert: false,
  };
  let validForm = true;
  const setInvalid = (inputAlert) => {
    validationParams[inputAlert] = true;
    validForm = false;
  };
  prisma.user.findUnique({
    where: {
      email: req.body.email.toLowerCase()
    }
  }).then((user) => {
    // Validate inputs (req.boby)
    validation(
      req.body.email,
      'emailEmptyAlert',
      'emailInvalidAlert',
      req.body.password,
      'passwordEmptyAlert',
      'passwordInvalidAlert',
      setInvalid
    );
    if (validForm) {
      // Check if user with submitted email (req.body.email) missing in database
      if (user === null) {
        setInvalid('emailMissingAlert');
      };
    };
    if (!validForm) {
      // If invalid form, res.json validation parameters
      res.json(validationParams);
    } else {
      // If valid form, compare password from database (user.password) and submitted password (req.body.password)
      bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (result === false) {
          // If incorrect password, res.json validation parameters
          setInvalid('passwordIncorrectAlert');
          res.json(validationParams);
        } else if (!user.active) {
          // If correct password but email hasn't been confirmed, res.json validation parameters
          setInvalid('emailUnconfirmedAlert');
          res.json(validationParams);
        } else {
          // If correct password and email has been confirmed, genereate jwt
          const payload = {
            user: {
              id: user.userId
            }
          };
          const accessToken = jwt.sign(payload, accessSecret, {expiresIn: '1hr'})
          res.json({ accessToken: accessToken });
        };
      });
    };
  }).catch((error) => {
    res.json({ ok: false, error: error.message });
  });
});

module.exports = router;
