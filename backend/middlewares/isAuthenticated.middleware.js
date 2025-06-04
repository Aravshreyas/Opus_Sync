// middleware/isAuthenticated.js
const jwt = require("jsonwebtoken");
const { UnauthorizedException } = require("../utils/appError");
const User = require("../models/user.model");

const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null);
    if (!token) {
        return next(UnauthorizedException("Unauthorized. Please log in."));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log("User not found with ID:", decoded.userId);
            return next(UnauthorizedException("User not found"));
        }
        req.user = user; // Set req.user to the full Mongoose document
        console.log("User set on req.user:", user._id);
        next();
    } catch (error) {
        console.log("JWT Error:", error.message);
        return next(UnauthorizedException("Invalid or expired token. Please log in again."));
    }
};

module.exports = isAuthenticated;