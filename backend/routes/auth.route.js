const express = require("express");
const passport = require("passport");
const { config } = require("../config/app.config");
const {
  googleLoginCallback,
  loginController,
  logOutController,
  registerUserController,
   verifyOtpController,  
  resendOtpController ,
  forgotPasswordController,
  verifyPasswordResetOtpController,
  resetPasswordController,
} = require("../controllers/auth.controller");

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = express.Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginController);
authRoutes.post("/logout", logOutController);
authRoutes.post("/verify-otp", verifyOtpController);
authRoutes.post("/resend-otp", resendOtpController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/verify-password-otp", verifyPasswordResetOtpController);
authRoutes.post("/reset-password", resetPasswordController);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect:failedUrl,
    session: false
  }),
  googleLoginCallback
);

module.exports = authRoutes;
