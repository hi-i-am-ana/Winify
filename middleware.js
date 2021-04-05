const jwt = require('jsonwebtoken');
const {accessSecret } = require('./config');

const loggedInCheck = (req, res, next) => {
  const jwtToken = req.header('token');
  if (!jwtToken) {
    return res.status(403).json({ message: 'Not Authorized' } )
  };
  try {
  const payload = jwt.verify(jwtToken, accessSecret);
  req.user = payload.user;
  next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports.loggedInCheck = loggedInCheck;