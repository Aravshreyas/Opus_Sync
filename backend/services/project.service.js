const mongoose = require("mongoose");
const ProjectModel = require("../models/project.model");
const TaskModel = require("../models/task.model");
const { NotFoundException } = require("../utils/appError");
const { TaskStatusEnum } = require("../enums/task.enum");

const createProjectService = async (userId, workspaceId, body) => {
    const projectData = {
        name: body.name,
        description: body.description,
        workspace: workspaceId,
        createdBy: userId,
    };

    if (body.emoji !== undefined) {
        projectData.emoji = body.emoji;
    }

    const project = new ProjectModel(projectData);
    await project.save();
    return { project };
};

const getProjectsInWorkspaceService = async (workspaceId, pageSize, pageNumber) => {
    const totalCount = await ProjectModel.countDocuments({ workspace: workspaceId });
    const skip = (pageNumber - 1) * pageSize;
    const projects = await ProjectModel.find({ workspace: workspaceId })
        .skip(skip)
        .limit(pageSize)
        .populate("createdBy", "_id name profilePicture -password")
        .sort({ createdAt: -1 });
    const totalPages = Math.ceil(totalCount / pageSize);
    return { projects, totalCount, totalPages, skip };
};

const getProjectByIdAndWorkspaceIdService = async (workspaceId, projectId) => {
    const project = await ProjectModel.findOne({
        _id: projectId,
        workspace: workspaceId,
    }).select("_id emoji name description");

    if (!project) {
        throw new NotFoundException(
            "Project not found or does not belong to the specified workspace"
        );
    }
    return { project };
};

const getProjectAnalyticsService = async (workspaceId, projectId) => {
    const project = await ProjectModel.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
        throw new NotFoundException(
            "Project not found or does not belong to this workspace"
        );
    }

    const currentDate = new Date();
    const taskAnalytics = await TaskModel.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $facet: {
                totalTasks: [{ $count: "count" }],
                overdueTasks: [
                    {
                        $match: {
                            dueDate: { $lt: currentDate },
                            status: { $ne: TaskStatusEnum.DONE },
                        },
                    },
                    { $count: "count" },
                ],
                completedTasks: [
                    {
                        $match: { status: TaskStatusEnum.DONE },
                    },
                    { $count: "count" },
                ],
            },
        },
    ]);

    const _analytics = taskAnalytics[0];
    const analytics = {
        totalTasks: _analytics.totalTasks[0]?.count || 0,
        overdueTasks: _analytics.overdueTasks[0]?.count || 0,
        completedTasks: _analytics.completedTasks[0]?.count || 0,
    };
    return { analytics };
};

const updateProjectService = async (workspaceId, projectId, body) => {
    const { name, emoji, description } = body;
    const project = await ProjectModel.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new NotFoundException(
            "Project not found or does not belong to the specified workspace"
        );
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (emoji !== undefined) project.emoji = emoji;

    await project.save();
    return { project };
};

const deleteProjectService = async (workspaceId, projectId) => {
    const project = await ProjectModel.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new NotFoundException(
            "Project not found or does not belong to the specified workspace"
        );
    }

    await project.deleteOne();
    await TaskModel.deleteMany({ project: project._id });
    return project;
};

module.exports = {
    createProjectService,
    getProjectsInWorkspaceService,
    getProjectByIdAndWorkspaceIdService,
    getProjectAnalyticsService,
    updateProjectService,
    deleteProjectService,
};