
const mongoose = require("mongoose");
const { Roles } = require("../enums/role.enum");
const MemberModel = require("../models/member.model");
const RoleModel = require("../models/roles-permission.model");
const UserModel = require("../models/user.model");
const WorkspaceModel = require("../models/workspace.model");
const { BadRequestException, NotFoundException } = require("../utils/appError");
const TaskModel = require("../models/task.model");
const { TaskStatusEnum } = require("../enums/task.enum");
const ProjectModel = require("../models/project.model");

// CREATE NEW WORKSPACE
const createWorkspaceService = async (userId, body) => {
    const { name, description } = body;

    const user = await UserModel.findById(userId);
    if (!user) {
        throw NotFoundException("User not found");
    }

    const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });
    if (!ownerRole) {
        throw NotFoundException("Owner role not found");
    }

    const workspace = new WorkspaceModel({
        name: name,
        description: description,
        owner: user._id,
    });

    await workspace.save();

    const member = new MemberModel({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
        joinedAt: new Date(),
    });

    await member.save();

    user.currentWorkspace = workspace._id;
    await user.save();

    return { workspace };
};

// GET WORKSPACES USER IS A MEMBER
const getAllWorkspacesUserIsMemberService = async (userId) => {
    const memberships = await MemberModel.find({ userId })
        .populate("workspaceId")
        .select("-password")
        .exec();

    const workspaces = memberships.map((membership) => membership.workspaceId);

    return { workspaces };
};

const getWorkspaceByIdService = async (workspaceId) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw NotFoundException("Workspace not found");
    }

    const members = await MemberModel.find({ workspaceId }).populate("role");

    const workspaceWithMembers = {
        ...workspace.toObject(),
        members,
    };

    return { workspace: workspaceWithMembers };
};

// GET ALL MEMBERS IN WORKSPACE
const getWorkspaceMembersService = async (workspaceId) => {
    const members = await MemberModel.find({ workspaceId })
        .populate("userId", "name email profilePicture -password")
        .populate("role", "name");

    const roles = await RoleModel.find({}, { name: 1, _id: 1 })
        .select("-permission")
        .lean();

    return { members, roles };
};

const getWorkspaceAnalyticsService = async (workspaceId) => {
    const currentDate = new Date();

    const totalTasks = await TaskModel.countDocuments({ workspace: workspaceId });

    const overdueTasks = await TaskModel.countDocuments({
        workspace: workspaceId,
        dueDate: { $lt: currentDate },
        status: { $ne: TaskStatusEnum.DONE },
    });

    const completedTasks = await TaskModel.countDocuments({
        workspace: workspaceId,
        status: TaskStatusEnum.DONE,
    });

    const analytics = {
        totalTasks,
        overdueTasks,
        completedTasks,
    };

    return { analytics };
};

const changeMemberRoleService = async (workspaceId, memberId, roleId) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw NotFoundException("Workspace not found");
    }

    const role = await RoleModel.findById(roleId);
    if (!role) {
        throw NotFoundException("Role not found");
    }

    const member = await MemberModel.findOne({ userId: memberId, workspaceId });
    if (!member) {
        throw new Error("Member not found in the workspace");
    }

    member.role = role;
    await member.save();

    return { member };
};

// UPDATE WORKSPACE
const updateWorkspaceByIdService = async (workspaceId, name, description) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw NotFoundException("Workspace not found");
    }

    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    await workspace.save();

    return { workspace };
};

const deleteWorkspaceService = async (workspaceId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const workspace = await WorkspaceModel.findById(workspaceId).session(session);
        if (!workspace) {
            throw NotFoundException("Workspace not found");
        }
        
        if (workspace.owner.toString() !== userId.toString()) {
            throw BadRequestException("You are not authorized to delete this workspace");
        }
       
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            throw NotFoundException("User not found");
        }

        await ProjectModel.deleteMany({ workspace: workspace._id }).session(session);
        await TaskModel.deleteMany({ workspace: workspace._id }).session(session);

        await MemberModel.deleteMany({ workspaceId: workspace._id }).session(session);

        if (user.currentWorkspace && user.currentWorkspace.equals(workspaceId)) {
            const memberWorkspace = await MemberModel.findOne({ userId }).session(session);
            user.currentWorkspace = memberWorkspace ? memberWorkspace.workspaceId : null;
            await user.save({ session });
        }

        await workspace.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();

        return { currentWorkspace: user.currentWorkspace };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

module.exports = {
    createWorkspaceService,
    getAllWorkspacesUserIsMemberService,
    getWorkspaceByIdService,
    getWorkspaceMembersService,
    getWorkspaceAnalyticsService,
    changeMemberRoleService,
    updateWorkspaceByIdService,
    deleteWorkspaceService,
};