
const  asyncHandler  = require("../middlewares/asyncHandler.middleware");
const { HTTPSTATUS } = require("../config/http.config");
const { Permissions } = require("../enums/role.enum");
const { getMemberRoleInWorkspace } = require("../services/member.service");
const { roleGuard } = require("../utils/roleGuard");
const {
    createTaskService,
    deleteTaskService,
    getAllTasksService,
    getTaskByIdService,
    updateTaskService,
} = require("../services/task.service");
const { BadRequestException, UnauthorizedException } = require("../utils/appError");

const createTaskController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body; 
    const projectId = req.params.projectId;
    const workspaceId = req.params.workspaceId;

    if (!title) {
        throw BadRequestException("Title is required");
    }
    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(workspaceId, projectId, userId, {
        title,
        description,
        status,
        priority,
        dueDate,
        assignedTo,
    });

    return res.status(HTTPSTATUS.OK).json({
        message: "Task created successfully",
        task,
    });
});

const updateTaskController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body; // Assuming these fields
    const taskId = req.params.id;
    const projectId = req.params.projectId;
    const workspaceId = req.params.workspaceId;

    if (!taskId) {
        throw BadRequestException("Task ID is required");
    }
    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { updatedTask } = await updateTaskService(workspaceId, projectId, taskId, {
        title,
        description,
        status,
        priority,
        dueDate,
        assignedTo,
    });

    return res.status(HTTPSTATUS.OK).json({
        message: "Task updated successfully",
        task: updatedTask,
    });
});

const getAllTasksController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const filters = {
        projectId: req.query.projectId || undefined,
        status: req.query.status ? req.query.status.split(",") : undefined,
        priority: req.query.priority ? req.query.priority.split(",") : undefined,
        assignedTo: req.query.assignedTo ? req.query.assignedTo.split(",") : undefined,
        keyword: req.query.keyword || undefined,
        dueDate: req.query.dueDate || undefined,
    };

    const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
    };

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllTasksService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
        message: "All tasks fetched successfully",
        ...result,
    });
});

const getTaskByIdController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const taskId = req.params.id;
    const projectId = req.params.projectId;
    const workspaceId = req.params.workspaceId;

    if (!taskId) {
        throw BadRequestException("Task ID is required");
    }
    if (!projectId) {
        throw BadRequestException("Project ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(workspaceId, projectId, taskId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task fetched successfully",
        task,
    });
});

const deleteTaskController = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
        throw UnauthorizedException("User not authenticated");
    }

    const taskId = req.params.id;
    const workspaceId = req.params.workspaceId;

    if (!taskId) {
        throw BadRequestException("Task ID is required");
    }
    if (!workspaceId) {
        throw BadRequestException("Workspace ID is required");
    }

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);

    await deleteTaskService(workspaceId, taskId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task deleted successfully",
    });
});

module.exports = {
    createTaskController,
    updateTaskController,
    getAllTasksController,
    getTaskByIdController,
    deleteTaskController,
};