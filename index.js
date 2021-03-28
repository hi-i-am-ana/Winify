const express = require('express');
const path = require('path');

const axios = require('axios');
const fetch = require('node-fetch');

const jwt = require('jsonwebtoken');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { port } = require('./config');

const loginRouter = require('./routes/login.js');
const logoutRouter = require('./routes/logout.js');
const signupRouter = require('./routes/signup.js');
const emailRouter = require('./routes/email.js');
const passwordRouter = require('./routes/password.js');
const homeRouter = require('./routes/home.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(morgan('dev'));  // static routes won't be logged if logger is instantiated after static routes
app.use('/static', express.static(path.join(__dirname, 'public')));

// app.use('/signup', signupRouter);
// app.use('/login', loginRouter);
// app.use('/logout', logoutRouter);
// app.use('/email', emailRouter);
// app.use('/password', passwordRouter);
// app.use('/', homeRouter);

app.get('/', (req, res) => {
  res.json({
    test: 'hello world'
  });
});

// Add route for handling 404 requests - unavailable routes (should be in the end)
app.use((req, res) => {
  res.status(404).render("pages/error", {
    err: { message: "HTTP ERROR 404. This page does not exist" },
    title: "Error | STRAVA APP",
  });
});

app.listen(port, () =>
  console.log(`Server is listening on localhost:${port}\n`)
);