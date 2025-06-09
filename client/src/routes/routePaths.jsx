
import SignIn from "../page/auth/SignIn";
import SignUp from "../page/auth/SignUp";
import GoogleOAuthFailure from "../page/auth/GoogleOAuthFailure";
import GoogleOAuthSuccess from "../page/auth/GoogleOAuthSuccess";
import WorkspaceDashboard from "../page/workspace/WorkspaceDashboard";
import Task from "../page/workspace/Task";
import Members from "../page/workspace/Members";
import WorkspaceSettings from "../page/workspace/WorkspaceSettings";
import Projects from "../page/workspace/Projects";
import InviteJoinPage from "../page/workspace/InviteJoinPage";
import TaskDetailDisplay from "../components/workspace/task/TaskDetailDisplay";
import AccountSettings from "../page/workspace/UserProfileSettings";
import OTPVerificationPage from "../page/auth/OTPVerificationPage"; 
export const AUTH_ROUTES = {
  SIGN_IN: "/",
  SIGN_UP: "/signup", // This is the path we need to make public
  GOOGLE_OAUTH_FAILURE: "/google-oauth-failure",
  GOOGLE_OAUTH_SUCCESS: "/google-oauth-success",
  VERIFY_OTP: "/verify-otp",
};

export const PROTECTED_ROUTES = {
  WORKSPACE: "/workspace/:workspaceId",
  TASKS: "/workspace/:workspaceId/tasks", 
  MEMBERS: "/workspace/:workspaceId/members",
  SETTINGS: "/workspace/:workspaceId/settings",
  PROJECT_DETAILS: "/workspace/:workspaceId/project/:projectId",
  SINGLE_TASK: "/workspace/:workspaceId/project/:projectId/tasks/:taskId",
   ACCOUNT_SETTINGS: "/settings/account",
};

export const BASE_ROUTE = {
  INVITE_URL: "/invite/workspace/:inviteCode/join",
};

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: <SignIn /> },
  { path: AUTH_ROUTES.SIGN_UP, element: <SignUp /> },
  { path: AUTH_ROUTES.GOOGLE_OAUTH_FAILURE, element: <GoogleOAuthFailure /> },
  { path: AUTH_ROUTES.GOOGLE_OAUTH_SUCCESS, element: <GoogleOAuthSuccess /> },
  { path: AUTH_ROUTES.VERIFY_OTP, element: <OTPVerificationPage /> },
];

export const protectedRoutePaths = [
  { path: PROTECTED_ROUTES.WORKSPACE, element: <WorkspaceDashboard /> },
  { path: PROTECTED_ROUTES.TASKS, element: <Task /> },
  { path: PROTECTED_ROUTES.MEMBERS, element: <Members /> },
  { path: PROTECTED_ROUTES.SETTINGS, element: <WorkspaceSettings /> },
  { path: PROTECTED_ROUTES.PROJECT_DETAILS, element: <Projects /> },
  { path: PROTECTED_ROUTES.SINGLE_TASK, element: <TaskDetailDisplay /> },
  { path: PROTECTED_ROUTES.ACCOUNT_SETTINGS, element: <AccountSettings /> },
];

export const baseRoutePaths = [
  { path: BASE_ROUTE.INVITE_URL, element: <InviteJoinPage /> }, 
];

// --- MODIFICATION IS HERE ---
// Ensure PUBLIC_PATH_PATTERNS includes all routes that don't require prior authentication
export const PUBLIC_PATH_PATTERNS = [
  AUTH_ROUTES.SIGN_IN,
  AUTH_ROUTES.SIGN_UP, // Make sure this is included!
  AUTH_ROUTES.GOOGLE_OAUTH_FAILURE,
  AUTH_ROUTES.GOOGLE_OAUTH_SUCCESS,
  BASE_ROUTE.INVITE_URL,
  AUTH_ROUTES.VERIFY_OTP,
  // Add any other public paths like "/password-reset", "/request-password-reset", etc.
];

// Helper function to check if a path matches any of the public patterns
export const isPublicPath = (pathname) => {
  return PUBLIC_PATH_PATTERNS.some(pattern => {
    if (!pattern) return false; // Guard against undefined patterns
    // Exact match for non-parametric routes
    if (!pattern.includes(':')) {
      return pattern === pathname;
    }
  
    const regexPattern = "^" + pattern.replace(/:\w+/g, "([^/]+)") + "$";
    const regex = new RegExp(regexPattern);
    return regex.test(pathname);
  });
};


export const isAuthRoute = (pathname) => {
    if(!pathname) return false;
    return Object.values(AUTH_ROUTES).includes(pathname);
}