
const UserModel = require("../models/user.model");

const getCurrentUserService = async (userId) => {
    const user = await UserModel.findById(userId)
        .populate("currentWorkspace")
        .select("-password");
    return { user }; 
};


const updateCurrentWorkspaceService = async (userId, workspaceId) => {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { currentWorkspace: workspaceId } },
      { new: true }
    )
      .populate("currentWorkspace")
      .select("-password");
    console.log("Updated user with new currentWorkspace:", user); 
    return { user };
  };
  
  module.exports = { getCurrentUserService, updateCurrentWorkspaceService };