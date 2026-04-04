// NOTE: This controller is disabled because it imports a non-existent
// "google-auth.service.js" file. Google auth is already handled via
// passport.config.js and auth.controller.js (googleLoginCallback).
//
// const asyncHandler = require("../middlewares/asyncHandler.middleware");
// const { HTTPSTATUS } = require("../config/http.config");
// const { googleLoginService } = require("../services/google-auth.service");
//
// const googleLoginController = asyncHandler(async (req, res) => {
//     const { token } = req.body;
//     const { user, authToken } = await googleLoginService(token);
//     res.cookie("token", authToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: process.env.NODE_ENV === "production"?"None":"Lax",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//     return res.status(HTTPSTATUS.OK).json({
//         message: "Google login successful",
//         user,
//         token
//     });
// });

module.exports = {};
