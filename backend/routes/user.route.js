const { Router } = require("express");
const { getCurrentUserController,updateCurrentWorkspaceController,updateUserProfileController,deleteUserProfilePictureController,getAllChatContactsController } = require("../controllers/user.controller");
const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);
userRoutes.put("/current-workspace", updateCurrentWorkspaceController);
userRoutes.put(
    "/profile",   
    updateUserProfileController
);
userRoutes.delete('/profile/picture',deleteUserProfilePictureController)
userRoutes.get("/chat-contacts",  getAllChatContactsController);
module.exports = userRoutes;