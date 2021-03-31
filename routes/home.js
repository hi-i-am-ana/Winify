const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const moment = require('moment');

const { port, stravaClient, stravaSecret } = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// GET route ?????
router.get('/', (req, res) => {
  console.log(req.query);
  if (req.query) {
    // TODO: Check auth scope here - must include activity:read
    // TODO: Check if error=access_denied
    // TODO: Load all user activities for the last month and before today
    if (req.query.error || req.query.scope !== 'read,activity:read') {
      res.redirect('/login')
    } else {
      axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${stravaClient}&client_secret=${stravaSecret}&code=${req.query.code}&grant_type=authorization_code`)
      .then(response => {
        console.log(response);
        const stravaAcTokExpiresAt = moment(response.data.expires_at * 1000).utc().format();
        console.log(stravaAcTokExpiresAt)
        prisma.user.update({
          where: {
            userId: +req.query.state,
          },
          data: {
            stravaUserId: response.data.athlete.id,
            firstname: response.data.athlete.firstname,
            lastname: response.data.athlete.lastname,
            stravaRefreshToken: response.data.refresh_token,
            stravaAccessToken: response.data.access_token,
            stravaAcTokExpiresAt: stravaAcTokExpiresAt,
            profilePictureUrl: response.data.athlete.profile
          }
        })
        // TODO: Can I chain it to previous then?
        .then(() => {
          res.json({message: 'Success!'});
        })
        .catch((err) => {
          res.json();
        })
      })
      .catch(error => {
        console.log(error);
      });
    };
  };
});

module.exports = router;