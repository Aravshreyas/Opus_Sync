
const { ErrorCodeEnum } = require("../enums/error-code.enum");
const { Roles } = require("../enums/role.enum");
const MemberModel = require("../models/member.model");
const RoleModel = require("../models/roles-permission.model");
const WorkspaceModel = require("../models/workspace.model");
const {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} = require("../utils/appError");

const getMemberRoleInWorkspace = async (userId, workspaceId) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const member = await MemberModel.findOne({ userId, workspaceId }).populate("role");

    if (!member) {
        throw new UnauthorizedException(
            "You are not a member of this workspace",
            ErrorCodeEnum.ACCESS_UNAUTHORIZED
        );
    }

    const roleName = member.role ? member.role.name : null;

    return { role: roleName };
};

const joinWorkspaceByInviteService = async (userId, inviteCode) => {
    const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
    if (!workspace) {
        throw new NotFoundException("Invalid invite code or workspace not found");
    }

    const existingMember = await MemberModel.findOne({
        userId,
        workspaceId: workspace._id,
    }).exec();

    if (existingMember) {
        throw new BadRequestException("You are already a member of this workspace");
    }

    const role = await RoleModel.findOne({ name: Roles.MEMBER });
    if (!role) {
        throw new NotFoundException("Role not found");
    }

    const newMember = new MemberModel({
        userId,
        workspaceId: workspace._id,
        role: role._id,
    });
    await newMember.save();

    return { workspaceId: workspace._id, role: role.name };
};

module.exports = {
    getMemberRoleInWorkspace,
    joinWorkspaceByInviteService,
};