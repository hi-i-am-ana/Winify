const jwt = require('jsonwebtoken');
const {accessSecret } = require('./config');

const loggedInCheck = (req, res, next) => {
  const jwtToken = req.header('token');
  if (!jwtToken) {
    return res.status(403).json({ message: 'Not Authorized' } )
  };
  const payload = jwt.verify(jwtToken, accessSecret);
  // TODO: Check this!
  req.user = payload.user;
  next();
};

module.exports.loggedInCheck = loggedInCheck;