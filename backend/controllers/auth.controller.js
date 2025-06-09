
const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { config } = require("../config/app.config");
const { HTTPSTATUS } = require("../config/http.config");
const { registerUserService,sendOtpForVerificationService, 
    verifyOtpService } = require("../services/auth.service");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { BadRequestException } = require("../utils/appError");

const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

const googleLoginCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Google authentication failed" });
  }

  const currentWorkspace = req.user.currentWorkspace;
  if (!currentWorkspace) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "No workspace assigned" });
  }

  const token = generateToken(req.user);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production"?"None":"Lax",
    maxAge: 60 * 60 * 1000,
  });

  const ua = req.headers['user-agent'] || "";
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(ua) && isSafari;

  if (isAppleDevice) {
    // iOS/macOS Safari -> respond with JSON for frontend handling
    return res.redirect(`${config.FRONTEND_ORIGIN}/google-oauth-success#token=${token}&workspaceId=${currentWorkspace}`);

    return res.status(HTTPSTATUS.OK).json({
      message: "Google login successful",
      token,
      user: req.user.omitPassword(),
      workspaceId: currentWorkspace,
    });
  } else {
    // Other devices -> redirect directly from backend
    return res.redirect(`${config.FRONTEND_ORIGIN}/workspace/${currentWorkspace}`);
  }
})

const registerUserController = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email) {
        throw BadRequestException("Email is required");
    }
    if (!password) {
        throw BadRequestException("Password is required");
    }
    if (!name) {
        throw BadRequestException("Name is required");
    }

    // Step 1: Create an unverified user account.
    // The service should handle cases where an unverified user with this email already exists.
    const { email: userEmail } = await registerUserService({ email, password, name });
    
    // Step 2: Trigger the OTP email to be sent.
    await sendOtpForVerificationService({ email: userEmail });

    // Step 3: Respond to the frontend, telling it to show the OTP verification page.
    return res.status(HTTPSTATUS.CREATED).json({
        message: "Registration successful. An OTP has been sent to your email for verification.",
        email: userEmail, // Send back email so frontend knows who to verify
    });
});

const verifyOtpController = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // The service will throw an error if OTP is invalid/expired
    const { user } = await verifyOtpService({ email, otp });

    // If verification is successful, log the user in by creating and sending a token
    const token = generateToken(user);
    
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"?"None":"Lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully. Logged in.",
        token,
        user: user.omitPassword ? user.omitPassword() : user // Use omitPassword if it exists
    });
});

// --- NEW CONTROLLER: Resend OTP ---
const resendOtpController = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new BadRequestException("Email is required.");
    }
    
    // The service handles finding the user and sending the new OTP
    await sendOtpForVerificationService({ email });

    return res.status(HTTPSTATUS.OK).json({ message: "A new OTP has been sent to your email." });
});


const loginController = asyncHandler(async (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: info?.message || "Invalid email or password" });
        const token = generateToken(user);
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"?"None":"Lax",
            maxAge: 60 * 60 * 1000
        });
        return res.status(HTTPSTATUS.OK).json({
            message: "Logged in successfully",
            token,
            user: user.omitPassword()
        });
    })(req, res, next);
});

const logOutController = asyncHandler(async (req, res) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"?"None":"Lax"
    });
    return res.status(HTTPSTATUS.OK).json({ message: "Logged out successfully - discard token on client" });
});

module.exports = { googleLoginCallback, registerUserController, loginController, logOutController,verifyOtpController, resendOtpController };
