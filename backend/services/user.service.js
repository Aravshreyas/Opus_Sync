
const UserModel = require("../models/user.model");
const MemberModel = require("../models/member.model");
const cloudinary = require('../config/cloudinary.config');

const {NotFoundException } = require("../utils/appError");
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
const updateUserProfileService = async (userId, updateData) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new NotFoundException("User not found");
    }

    // Update only the fields that were provided in the request
    if (updateData.name !== undefined) {
        user.name = updateData.name;
    }
    // Assumes profilePicture is now just a URL string from the body
    // If you want to allow removal, you can check for `null` specifically
    if (updateData.profilePicture !== undefined) {
        user.profilePicture = updateData.profilePicture;
        user.publicId = updateData.publicId; // This will be the URL string or null
    }

    await user.save();
    
    const updatedUserToReturn = user.omitPassword ? user.omitPassword() : { ...user.toObject() };
    if ('password' in updatedUserToReturn) delete updatedUserToReturn.password;
    
    return { user: updatedUserToReturn };
};

const deleteUserProfilePictureService = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Delete image from Cloudinary if publicId exists
//   if (user.publicId) {
//     try {
//       await cloudinary.uploader.destroy(user.publicId);
//     } catch (error) {
//       console.error("Cloudinary deletion error:", error);
      
//     }
//   }

  
  user.profilePicture = user.defaultProfilePictureUrl || null;
  user.publicId = null;

  await user.save();

  const updatedUserToReturn = user.omitPassword ? user.omitPassword() : user.toObject();
  if ('password' in updatedUserToReturn) delete updatedUserToReturn.password;

  return { user: updatedUserToReturn };
};
const getAllChatContactsService = async (currentUserId) => {
    const userMemberships = await MemberModel.find({ userId: currentUserId }).select('workspaceId');
    const workspaceIds = userMemberships.map(m => m.workspaceId);
    const allMembersInWorkspaces = await MemberModel.find({ workspaceId: { $in: workspaceIds } }).select('userId');
    const userIds = [...new Set(allMembersInWorkspaces.map(m => m.userId.toString()))];
    const contacts = await UserModel.find({ _id: { $in: userIds, $ne: currentUserId } })
        .select("name email profilePicture defaultProfilePictureUrl createdAt");
    return { contacts };
};


  
  module.exports = { getCurrentUserService, updateCurrentWorkspaceService,updateUserProfileService,deleteUserProfilePictureService,getAllChatContactsService };