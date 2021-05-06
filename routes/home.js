const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const moment = require('moment');

const { host, port, stravaClient, stravaSecret } = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// GET route for home page
router.get('/', (req, res) => {
  if (Object.keys(req.query).length === 0) {
    res.render('pages/home', {
      title: 'WINIFY',
      host: host,
      port: port,
      stravaClient: stravaClient,
      stravaAuthSuccess: false
    });
  };
  if (Object.keys(req.query).length !== 0) {
    // TODO: Check auth scope here - must include activity:read
    // TODO: Check if error=access_denied
    // TODO: Load all user activities for the last month and before today
    if (req.query.error || req.query.scope !== 'read,activity:read') {
      res.redirect('/')
    } else {
      axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${stravaClient}&client_secret=${stravaSecret}&code=${req.query.code}&grant_type=authorization_code`)
      .then(response => {
        console.log(response.data);
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
        .then(user => {
          // TODO: Create pagination here
          axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=200`, {
            headers: {
              Authorization: `Bearer ${user.stravaAccessToken}`
            }
          })
          .then(response => {
            response.data.forEach((activity, index) => {
              prisma.activity.create({
                data: {
                  stravaActivityId: activity.id,
                  stravaUserId: activity.athlete.id,
                  distance: activity.distance,
                  movingTime: activity.moving_time,
                  elapsedTime: activity.elapsed_time,
                  elevation: activity.total_elevation_gain,
                  averageSpeed: activity.average_speed,
                  type: activity.type,
                  startDate: activity.start_date,
                  startDateLocal: activity.start_date_local,
                  timezone: activity.timezone
                }
              })
              .then(() => {
                // TODO: Promise all here, at the moment it is executed for each activity
                console.log('home route - activity created')
                res.render('pages/home', {
                  title: 'WINIFY',
                  host: host,
                  port: port,
                  stravaClient: stravaClient,
                  stravaAuthSuccess: true
                });
              })
              .catch(error => {
                res.json({ok: false, error: error.message});
              });
            });
          })
          .catch(error => {
            res.json({ok: false, error: error.message});
          })
        })
        .catch(error => {
          // If new user uses already registered strava account, error will appear here (unique constraint on stravaUserId)
          res.json({ok: false, error: error.message});
        })
      })
      .catch(errors => {
        console.log(errors);
      });
    };
  };
});

module.exports = router;