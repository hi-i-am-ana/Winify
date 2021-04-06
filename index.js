const express = require('express');
const path = require('path');

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
// const passport = require('passport');
// const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const moment = require('moment');
const cron = require('node-cron');
const morgan = require('morgan');

const { port, stravaClient, stravaSecret } = require('./config');

const loginRouter = require('./routes/login.js');
const signupRouter = require('./routes/signup.js');
const emailRouter = require('./routes/email.js');
const passwordRouter = require('./routes/password.js');
const profileRouter = require('./routes/profile.js');
const dashboardRouter = require('./routes/dashboard.js');
const challengesRouter = require('./routes/challenges.js');
const isAuthorisedRouter = require('./routes/is_authorised.js');
const homeRouter = require('./routes/home.js');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressLayouts);
app.use(morgan('dev'));  // static routes won't be logged if logger is instantiated after static routes
app.use('/static', express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout extractScripts', true);

app.use('/signup', signupRouter);
app.use('/login', loginRouter);
// app.use('/email', emailRouter);
app.use('/password', passwordRouter);
app.use('/profile', profileRouter);
app.use('/dashboard', dashboardRouter);
app.use('/challenges', challengesRouter);
app.use('/is_authorised', isAuthorisedRouter);
app.use('/', homeRouter);

// Add route for handling 404 requests - unavailable routes (should be in the end)
app.use((req, res) => {
  res.status(404).render("pages/error", {
    err: { message: "HTTP ERROR 404. This page does not exist" },
    title: "Error | STRAVA APP",
  });
});

const getActivities = (stravaAccessToken) => {
  // TODO: set dates (before and after) and number of activities
  console.log(stravaAccessToken)
  axios.get(`https://www.strava.com/api/v3/athlete/activities?per_page=10`, {
    headers: {
      Authorization: `Bearer ${stravaAccessToken}`
    }
  })
  .then(response => {
    response.data.forEach((activity, index) => {
      // TODO: Filter only Run, Ride, Swim and Walk
      // Check if activity already exists
      prisma.activity.findUnique({
        where: {
          stravaActivityId: activity.id
        }
      })
      .then((savedActivity) => {
        // console.log(savedActivity)
        if (savedActivity === null) {
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
          .then(newActivity => {
          }) // end prisma create
        }; // end if
      }) // end prisma find unique
    }); // end forEach
  })// end axios.get
}

// Find users, for which access token has to be updated (<= 1 hour left)
// Make API request to get activities of all authorised users for the last day
cron.schedule('43 23 * * *', () => {
  // TODO: Change to 1 hour
  prisma.user.findMany({
    // TODO: What will happen if user deauthorise themselves from settings in Strava and still has StravaID in my app?
    where: {
      stravaUserId: {
        not: null,
      }
    }
  })
  .then(users => {
    users.forEach(user => {
      const hourAfterNow = moment().add(1, 'days').utc().format();
      const stravaAcTokExpiresAt = moment(user.stravaAcTokExpiresAt).utc().format();
      // TODO: Research axios interseptors for pre request
      if (stravaAcTokExpiresAt <= hourAfterNow) {
        axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${stravaClient}&client_secret=${stravaSecret}&refresh_token=${user.stravaRefreshToken}&grant_type=refresh_token`)
        .then(response => {
          // console.log(response);
          const stravaAcTokExpiresAt = moment(response.data.expires_at * 1000).utc().format();
          prisma.user.update({
            where: {
              userId: user.userId,
            },
            data: {
              stravaRefreshToken: response.data.refresh_token,
              stravaAccessToken: response.data.access_token,
              stravaAcTokExpiresAt: stravaAcTokExpiresAt
            }
          })
          .then(user => {
            getActivities(user.stravaAccessToken);
          }); // end prisma update
        }); // end axios post
      } else {
        getActivities(user.stravaAccessToken);
      }; //enf if
    }); //end forEach
  }); // end prisma findMany
}, {timezone: 'Australia/Sydney'});

app.listen(port, () =>
  console.log(`Server is listening on localhost:${port}\n`)
);