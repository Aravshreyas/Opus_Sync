const { Router } = require("express");
const { getCurrentUserController,updateCurrentWorkspaceController,updateUserProfileController,deleteUserProfilePictureController } = require("../controllers/user.controller");
const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);
userRoutes.put("/current-workspace", updateCurrentWorkspaceController);
userRoutes.put(
    "/profile",   
    updateUserProfileController
);
userRoutes.delete('/profile/picture',deleteUserProfilePictureController)
module.exports = userRoutes;