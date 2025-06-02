// controllers/workspace.controller.js
const  asyncHandler  = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const {
    changeMemberRoleService,
    createWorkspaceService,
    deleteWorkspaceService,
    getAllWorkspacesUserIsMemberService,
    getWorkspaceAnalyticsService,
    getWorkspaceByIdService,
    getWorkspaceMembersService,
    updateWorkspaceByIdService,
} = require("../services/workspace.service");
const { getMemberRoleInWorkspace } = require("../services/member.service");
const { Permissions } = require("../enums/role.enum");
const { roleGuard } = require("../utils/roleGuard");
const { BadRequestException } = require("../utils/appError");

const createWorkspaceController = asyncHandler(async (req, res) => {
    let { name, description } = req.body;

    
    if (!name) {
        throw BadRequestException("Name is required");
    }
    if (name.length > 255) {
        throw BadRequestException("Name must be 255 characters or less");
    }

 

    const userId = req.user ? req.user._id : null;
    const { workspace } = await createWorkspaceService(userId, { name, description });

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Workspace created successfully",
        workspace,
    });
});

const getAllWorkspacesUserIsMemberController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    const { workspaces } = await getAllWorkspacesUserIsMemberService(userId);

    return res.status(HTTPSTATUS.OK).json({
        message: "User workspaces fetched successfully",
        workspaces,
    });
});

const getWorkspaceByIdController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;

  
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    await getMemberRoleInWorkspace(userId, workspaceId);

    const { workspace } = await getWorkspaceByIdService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Workspace fetched successfully",
        workspace,
    });
});

const getWorkspaceMembersController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;

    // Validate workspaceId
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { members, roles } = await getWorkspaceMembersService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Workspace members retrieved successfully",
        members,
        roles,
    });
});

const getWorkspaceAnalyticsController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;

    // Validate workspaceId
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { analytics } = await getWorkspaceAnalyticsService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Workspace analytics retrieved successfully",
        analytics,
    });
});

const changeWorkspaceMemberRoleController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;
    let { memberId, roleId } = req.body;

    // Validate workspaceId
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    // Validate changeRoleSchema
    if (!memberId) {
        throw BadRequestException("Member ID is required");
    }
    if (!roleId) {
        throw BadRequestException("Role ID is required");
    }

    const userId = req.user ? req.user._id : null;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CHANGE_MEMBER_ROLE]);

    const { member } = await changeMemberRoleService(workspaceId, memberId, roleId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Member Role changed successfully",
        member,
    });
});

const updateWorkspaceByIdController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;
    let { name, description } = req.body;

    // Validate workspaceId
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    // Validate name (nameSchema)
    if (!name) {
        throw BadRequestException("Name is required");
    }
    if (name.length > 255) {
        throw BadRequestException("Name must be 255 characters or less");
    }

    // Validate description (descriptionSchema)
    // Optional, so no required check

    const userId = req.user ? req.user._id : null;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);

    const { workspace } = await updateWorkspaceByIdService(workspaceId, name, description);

    return res.status(HTTPSTATUS.OK).json({
        message: "Workspace updated successfully",
        workspace,
    });
});

const deleteWorkspaceByIdController = asyncHandler(async (req, res) => {
    let workspaceId = req.params.id;

    // Validate workspaceId
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user?._id 
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    console.log("role", role);
    roleGuard(role, [Permissions.DELETE_WORKSPACE]);

    const { currentWorkspace } = await deleteWorkspaceService(workspaceId, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Workspace deleted successfully",
        currentWorkspace,
    });
});

module.exports = {
    createWorkspaceController,
    getAllWorkspacesUserIsMemberController,
    getWorkspaceByIdController,
    getWorkspaceMembersController,
    getWorkspaceAnalyticsController,
    changeWorkspaceMemberRoleController,
    updateWorkspaceByIdController,
    deleteWorkspaceByIdController,
};