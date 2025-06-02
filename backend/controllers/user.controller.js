const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { getCurrentUserService, updateCurrentWorkspaceService } = require("../services/user.service");

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

module.exports = { getCurrentUserController, updateCurrentWorkspaceController };