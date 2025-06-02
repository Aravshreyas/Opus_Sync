
const { Router } = require("express");
const { joinWorkspaceController } = require("../controllers/member.controller"); 

const memberRoutes = Router();

memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

module.exports = memberRoutes;