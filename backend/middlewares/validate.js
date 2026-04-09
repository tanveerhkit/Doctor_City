const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  return (
    req.cookies?.token ||
    req.body?.token ||
    (authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null)
  );
};

const verifyDecodedToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Basic token validation
const verifyToken = (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    req.user = verifyDecodedToken(token);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const optionalVerifyToken = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    req.user = null;
    next();
    return;
  }

  try {
    req.user = verifyDecodedToken(token);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin access only' });
  }
};


// Validation result checker
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  isAdmin,
  validateRequest,
};
