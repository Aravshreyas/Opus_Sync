const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { getMemberRoleInWorkspace } = require("../services/member.service");
const { roleGuard } = require("../utils/roleGuard");
const { Permissions } = require("../enums/role.enum");
const {
    createProjectService,
    deleteProjectService,
    getProjectAnalyticsService,
    getProjectByIdAndWorkspaceIdService,
    getProjectsInWorkspaceService,
    updateProjectService,
} = require("../services/project.service");
const { BadRequestException, UnauthorizedException } = require("../utils/appError");

const createProjectController = asyncHandler(async (req, res) => {
    const { name, description, emoji } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!name) {
        throw BadRequestException("Name is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const projectData = { name, description, emoji };
    const { project } = await createProjectService(userId, workspaceId, projectData);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Project created successfully",
        project,
    });
});

const getAllProjectsInWorkspaceController = asyncHandler(async (req, res) => {
    const workspaceId = req.params.workspaceId;

    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize) || 10;
    const pageNumber = parseInt(req.query.pageNumber) || 1;

    const { projects, totalCount, totalPages, skip } =
        await getProjectsInWorkspaceService(workspaceId, pageSize, pageNumber);

    return res.status(HTTPSTATUS.OK).json({
        message: "Projects fetched successfully",
        projects,
        pagination: {
            totalCount,
            pageSize,
            pageNumber,
            totalPages,
            skip,
            limit: pageSize,
        },
    });
});

const getProjectByIdAndWorkspaceIdController = asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const workspaceId = req.params.workspaceId;

    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { project } = await getProjectByIdAndWorkspaceIdService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project fetched successfully",
        project,
    });
});

const getProjectAnalyticsController = asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const workspaceId = req.params.workspaceId;

    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { analytics } = await getProjectAnalyticsService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project analytics retrieved successfully",
        analytics,
    });
});

const updateProjectController = asyncHandler(async (req, res) => {
    const { name, description, emoji } = req.body;
    const projectId = req.params.id;
    const workspaceId = req.params.workspaceId;

    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_PROJECT]);

    const projectUpdateData = { name, description, emoji };
    Object.keys(projectUpdateData).forEach(key => projectUpdateData[key] === undefined && delete projectUpdateData[key]);

    const { project } = await updateProjectService(workspaceId, projectId, projectUpdateData);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project updated successfully",
        project,
    });
});

const deleteProjectController = asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const workspaceId = req.params.workspaceId;

    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_PROJECT]);

    await deleteProjectService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project deleted successfully",
    });
});

module.exports = {
    createProjectController,
    getAllProjectsInWorkspaceController,
    getProjectByIdAndWorkspaceIdController,
    getProjectAnalyticsController,
    updateProjectController,
    deleteProjectController,
};