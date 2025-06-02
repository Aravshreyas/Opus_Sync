const { Router } = require("express");
const { getCurrentUserController,updateCurrentWorkspaceController} = require("../controllers/user.controller");

const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);
userRoutes.put("/current-workspace", updateCurrentWorkspaceController);

module.exports = userRoutes;