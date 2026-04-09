const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const xss = require("xss");
require("dotenv").config();
const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/userModel");
const { serializeUser } = require("../utils/serializeUser");

const buildToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

const createAuthResponse = (res, user, message, statusCode = 200) =>
  res.status(statusCode).json({
    token: buildToken(user),
    user: serializeUser(user),
    message,
  });

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "JWT_SECRET is not configured on the server",
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email, and password are required",
    });
  }

  const sanitizedName = xss(String(name).trim());
  const sanitizedEmail = xss(String(email).trim().toLowerCase());
  const normalizedPassword = String(password);

  if (sanitizedName.length < 2) {
    return res.status(400).json({
      error: "Name must be at least 2 characters long",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(sanitizedEmail)) {
    return res.status(400).json({
      error: "Please enter a valid email address",
    });
  }

  if (normalizedPassword.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long",
    });
  }

  const existingUser = await User.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return res.status(409).json({
      error: "An account with this email already exists",
    });
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  const user = await User.create({
    name: sanitizedName,
    email: sanitizedEmail,
    password: passwordHash,
    role: sanitizedEmail.endsWith(process.env.DOMAIN_NAME || "@admin.com")
      ? "admin"
      : "user",
  });

  return createAuthResponse(res, user, "Account created successfully", 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "JWT_SECRET is not configured on the server",
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  const sanitizedEmail = xss(String(email).trim().toLowerCase());
  const normalizedPassword = String(password);

  const user = await User.findOne({ email: sanitizedEmail });
  if (!user || !user.password) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  return createAuthResponse(res, user, "Login successful");
});
