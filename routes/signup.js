const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const { host, port, gmailhost, gmailport, gmailuser, gmailpassword} = require('../config');
// Import shared validation function
const validation = require('../public/js/shared_signup_validation.js');

const router = express.Router();
const prisma = new PrismaClient();

// POST route for signup
router.post('/', (req, res) => {
  let validationParams = {
    emailExistsAlert: false,
    emailEmptyAlert: false,
    emailInvalidAlert: false,
    passwordEmptyAlert: false,
    passwordInvalidAlert: false,
    confirmPasswordEmptyAlert: false,
    confirmPasswordMatchAlert: false,
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
    // Check if user with entered email (req.body.email) exists in database
    if (user !== null) {
      setInvalid('emailExistsAlert');
    } else {
      // Validate inputs (req.boby)
      validation(
        req.body.email,
        'emailEmptyAlert',
        'emailInvalidAlert',
        req.body.password,
        'passwordEmptyAlert',
        'passwordInvalidAlert',
        req.body.confirmPassword,
        'confirmPasswordEmptyAlert',
        'confirmPasswordMatchAlert',
        setInvalid
      );
    };
    if (!validForm) {
      // If invalid form, res.json validation parameters
      res.json(validationParams)
    } else {
      // If valid form, add new user to database
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        prisma.user.create({
          data: {
            email: req.body.email.toLowerCase(),
            password: hash,
            active: false
          }
        }).then((user) => {
          // Genereate hash for email confirmation link and save it in database
          const emailHash = crypto.randomBytes(30).toString('hex');
          prisma.emailHash.create({
            data: {
              email: user.email,
              hash: emailHash
            }
          }).then((emailHash) => {
            // TODO: Move email sending function to a separate module
            // Send email with link to confirm entered email address
            const transporter = nodemailer.createTransport({
              host: gmailhost,
              port: gmailport,
              secure: false,
              auth: {
                user: gmailuser,
                pass: gmailpassword,
              },
              tls: {
                rejectUnauthorized: false
              }
            });
            const mailOptions = {
              from: '"WINIFY" <hi.i.am.anastasia@gmail.com>',
              to: `${user.email}`,
              subject: 'Please confirm your email address for WINIFY',
              html: `
              <h3>Thank you for creating your account on WINIFY</h3>
              <p>Please confirm your email address:</p>
              <a href="http://${host}:${port}/email/${emailHash.hash}">http://${host}:${port}/email/${emailHash.hash}</a>
              `
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.json({ok: false, error: error.message});
              } else {
                console.log('signup route - email sent')
                res.json({ok: true, userId: user.userId});
              };
            });
          }).catch((error) => {
            res.json({ok: false, error: error.message});
          });
        }).catch((error) => {
          res.json({ok: false, error: error.message});
        });
      });
    };
  }).catch((error) => {
    res.json({ok: false, error: error.message});
  });
});

module.exports = router;