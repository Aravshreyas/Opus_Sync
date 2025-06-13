const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { getCurrentUserService, updateCurrentWorkspaceService,updateUserProfileService,deleteUserProfilePictureService,getAllChatContactsService } = require("../services/user.service");
const { BadRequestException, UnauthorizedException } = require("../utils/appError");
const getCurrentUserController = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.userId || req.user._id : null;
  console.log("User ID from req.user:", userId);

  const user = await getCurrentUserService(userId);
  console.log("User:", user);

  return res.status(HTTPSTATUS.OK).json({
    message: "User fetched successfully",
    user,
  });
});

const updateCurrentWorkspaceController = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.userId || req.user._id : null;
  const { workspaceId } = req.body;

  if (!userId) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({
      message: "User not authenticated",
    });
  }

  if (!workspaceId) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Workspace ID is required",
    });
  }

  const user = await updateCurrentWorkspaceService(userId, workspaceId);

  return res.status(HTTPSTATUS.OK).json({
    message: "Current workspace updated successfully",
    user,
  });
});

const updateUserProfileController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw new UnauthorizedException("User not authenticated");
    }

    // Now expecting name and profilePicture (as a string URL) directly from the body
    const updateData = req.body;

    // Basic validation
    if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("No update data provided.");
    }
    
    const { user } = await updateUserProfileService(userId, updateData);

    return res.status(HTTPSTATUS.OK).json({
        message: "Profile updated successfully",
        user,
    });  
});



const deleteUserProfilePictureController = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : null;
  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  const { user } = await deleteUserProfilePictureService(userId);

  return res.status(HTTPSTATUS.OK).json({
    message: "Profile picture removed and set to default",
    user,
  });
});

const getAllChatContactsController = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const { contacts } = await getAllChatContactsService(currentUserId);
    return res.status(HTTPSTATUS.OK).json({ contacts });
});


module.exports = { getCurrentUserController, updateCurrentWorkspaceController,updateUserProfileController,deleteUserProfilePictureController, getAllChatContactsController   };