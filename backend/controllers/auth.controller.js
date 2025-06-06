
const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { config } = require("../config/app.config");
const { HTTPSTATUS } = require("../config/http.config");
const { registerUserService } = require("../services/auth.service");
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
    const { email, password, name } = req.body; // Assuming these are required fields

    if (!email) {
        throw BadRequestException("Email is required");
    }
    if (!password) {
        throw BadRequestException("Password is required");
    }
    if (!name) {
        throw BadRequestException("Name is required");
    }

    const { userId, workspaceId } = await registerUserService({ email, password, name });
    const user = await UserModel.findById(userId); // Fetch user after registration
    const token = generateToken(user);

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"?"None":"Lax",
        maxAge: 60 * 60 * 1000
    });
    return res.status(HTTPSTATUS.CREATED).json({
        message: "User created successfully",
        token,
        user: user.omitPassword(),
        workspaceId
    });
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

module.exports = { googleLoginCallback, registerUserController, loginController, logOutController };
