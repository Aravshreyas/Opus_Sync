// routes/projectRoutes.js
const { Router } = require("express");
const {
    createProjectController,
    deleteProjectController,
    getAllProjectsInWorkspaceController,
    getProjectAnalyticsController,
    getProjectByIdAndWorkspaceIdController,
    updateProjectController,
} = require("../controllers/project.controller");

const projectRoutes = Router();

projectRoutes.post("/workspace/:workspaceId/create", createProjectController);

projectRoutes.put("/:id/workspace/:workspaceId/update", updateProjectController);

projectRoutes.delete("/:id/workspace/:workspaceId/delete", deleteProjectController);

projectRoutes.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);

projectRoutes.get("/:id/workspace/:workspaceId/analytics", getProjectAnalyticsController);

projectRoutes.get("/:id/workspace/:workspaceId", getProjectByIdAndWorkspaceIdController);

module.exports = projectRoutes;