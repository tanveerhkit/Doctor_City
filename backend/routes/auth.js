const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { signup, login } = require("../controllers/authController");
const { validateRequest } = require("../middlewares/validate");

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").trim().isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  validateRequest,
  signup
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

module.exports = router;
