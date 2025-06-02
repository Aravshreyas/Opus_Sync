// utils/roleGuard.js
const { PermissionType, Permissions } = require("../enums/role.enum");
const { UnauthorizedException } = require("./appError");
const { RolePermissions } = require("./role-permission");

const   roleGuard = (role, requiredPermissions) => {
    const permissions = RolePermissions[role];

    const hasPermission = requiredPermissions.every((permission) =>
        permissions.includes(permission)
    );

    if (!hasPermission) {
        throw  UnauthorizedException(
            "You do not have the necessary permissions to perform this action"
        );
    }
};

module.exports = { roleGuard };