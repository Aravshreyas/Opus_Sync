import { useState, useEffect } from "react";
import RecentProjects from "../../components/workspace/project/RecentProjects";
import RecentTasks from "../../components/workspace/task/RecentTasks";
import RecentMembers from "../../components/workspace/member/RecentMembers";
import useCreateProjectDialog from "../../hooks/useCreateProjectDialog";
import axios from "axios";
import { useAuth } from "../../context/auth-context";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { Permissions } from "../../constant";
// Added Zap and ListChecks for MyFocus, Clock for time display
import { X, Plus, CheckCircle, Calendar, Users, Zap, ListChecks, Clock } from "lucide-react";
import Button from "../../components/ui/Button";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { format, isAfter, isBefore, addDays } from 'date-fns'; 

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const MyTaskCard = ({ task }) => (
    // Simple card for My Focus task
    <a href={`/workspace/${task.workspace}/project/${task.project._id}/tasks/${task.id}`} className="block bg-sky-50 border border-sky-200 p-3 rounded-lg shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 ease-in-out">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-sm text-sky-700">{task.title}</h4>
        <ListChecks className="w-5 h-5 text-sky-500 flex-shrink-0" />
      </div>
      {task.dueDate && (
        <p className="text-xs text-gray-500 mt-1">
          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
        </p>
      )}
    </a>
);

const WorkspaceDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const { open, onOpen, onClose } = useCreateProjectDialog();
  const [activeTab, setActiveTab] = useState("projects");
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingData, setLoadingData] = useState(true); // For preloads and tasks
  const [taskCompletion, setTaskCompletion] = useState({ completed: 0, total: 0, percentage: 0 });
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [myTasks, setMyTasks] = useState([]); // User's pending tasks for "My Focus"
  const [upcomingDeadlines, setUpcomingDeadlines] = useState(0); // Count of tasks due within 7 days
  const [teamMembersCount, setTeamMembersCount] = useState(0); // Count of team members
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true); // Loading state for team members

  // State for current time display
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentWorkspaceId = user?.currentWorkspace?._id || workspaceId;

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!currentWorkspaceId || !user) {
        setLoadingPermissions(false);
        return;
      }
      setLoadingPermissions(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/permissions`,
          {
            withCredentials: true,
            params: { workspaceId: currentWorkspaceId },
          }
        );
        const perms = response.data.permissions || [];
        setPermissions(perms.map((p) => p.permission || p));
      } catch (err) {
        console.error("Error fetching permissions:", err);
        setPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };
    fetchPermissions();
  }, [currentWorkspaceId, user]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentWorkspaceId) {
        setLoadingTeamMembers(false);
        return;
      }
      setLoadingTeamMembers(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/members/${currentWorkspaceId}`,
          // { withCredentials: true }
        );
       
        const members = response.data.members || [];
        setTeamMembersCount(members.length);
      } catch (err) {
        console.error("Error fetching team members:", err);
        setTeamMembersCount(0);
      } finally {
        setLoadingTeamMembers(false);
      }
    };
    fetchTeamMembers();
  }, [currentWorkspaceId]);

  // Fetch tasks, filter for the current user, calculate completion percentage, and upcoming deadlines
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentWorkspaceId || !user) {
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${currentWorkspaceId}/all`,
          // { withCredentials: true }
        );
        
        console.log(response.data)
        const allTasks = response.data.tasks || [];
        
        const userTasks = allTasks.filter(
          (task) => (task.assignedTo?._id === user._id) || (task.assignedTo === null && task.createdBy === user._id)
        );
        const total = userTasks.length;
        const completed = userTasks.filter((task) => task.status?.toUpperCase() === "DONE").length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        setTaskCompletion({ completed, total, percentage });

        // Calculate upcoming deadlines (within 7 days, not completed)
        const today = new Date("2025-06-01T14:12:00+05:30"); // Current date: June 01, 2025, 02:12 PM IST
        const sevenDaysFromNow = addDays(today, 7); // June 08, 2025
        const upcoming = userTasks.filter((task) => {
          if (task.status?.toUpperCase() === "DONE") return false; // Exclude completed tasks
          if (!task.dueDate) return false; // Exclude tasks with no due date
          const dueDate = new Date(task.dueDate);
          return isAfter(dueDate, today) && isBefore(dueDate, sevenDaysFromNow);
        }).length;
        setUpcomingDeadlines(upcoming);

        // Set motivational message based on percentage
        if (percentage === 100) {
          setMotivationalMessage("🎉 Amazing job! You've completed all your tasks!");
        } else if (percentage >= 75) {
          setMotivationalMessage("You're killing it! Almost there—keep pushing! 🚀");
        } else if (percentage >= 50) {
          setMotivationalMessage("Great progress! You're halfway there—keep it up! 💪");
        } else if (percentage > 0) {
          setMotivationalMessage("Nice start! Let's get more tasks done today! 🌟");
        } else {
          setMotivationalMessage("Let's get started! Tackle your first task today! 📝");
        }

        // Filter pending tasks for "My Focus" (limit to 3)
        const pendingTasks = userTasks
          .filter((task) => task.status?.toUpperCase() !== "DONE")
          .slice(0, 3)
          .map((task) => ({
            id: task._id,
            title: task.title,
            dueDate: task.dueDate,
            ...task
          }));
        setMyTasks(pendingTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setTaskCompletion({ completed: 0, total: 0, percentage: 0 });
        setMotivationalMessage("Let's get started! Tackle your first task today! 📝");
        setMyTasks([]);
        setUpcomingDeadlines(0);
      } finally {
        setLoadingData(false);
      }
    };
    fetchTasks();
  }, [currentWorkspaceId, user, projectCreated]); // Re-fetch on project creation or user change

  // Simulate initial data loading for child components
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentWorkspaceId) {
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      await Promise.all([
        RecentProjects.preload?.(currentWorkspaceId),
        RecentTasks.preload?.(currentWorkspaceId),
        RecentMembers.preload?.(currentWorkspaceId),
      ]);
      setLoadingData(false);
    };
    loadInitialData();
  }, [currentWorkspaceId]);

  // Update current time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId); // Cleanup interval
  }, []);

  const canCreateProject = permissions.includes(Permissions.CREATE_PROJECT);
  const isLoading = authLoading || loadingPermissions || loadingData || loadingTeamMembers;

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (isSubmitting || !projectName || !canCreateProject) return;

    setIsSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/${currentWorkspaceId}/projects`,
        { name: projectName },
        // { withCredentials: true }
      );
      setProjectName("");
      setProjectCreated((prev) => !prev);
      onClose();
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const chartData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [taskCompletion.percentage, 100 - taskCompletion.percentage],
        backgroundColor: ["#4CAF50", "#E0E0E0"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  if (!user || !currentWorkspaceId) {
    console.log("WorkspaceDashboard: No user or currentWorkspace", user, currentWorkspaceId);
    return <div className="flex justify-center items-center min-h-screen">No workspace data available. Please select a workspace or log in.</div>;
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      {/* Personalized Greeting & Time Display */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {getGreeting()}, {user.name || "User"}! 👋
          </h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Welcome back—let's make today productive!
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm">
            <Clock size={16} className="mr-2 text-indigo-500"/>
            {format(currentTime, "eeee, MMM dd, yyyy - hh:mm:ss a")}
        </div>
        {canCreateProject && (
          <Button
            onClick={onOpen}
            className="mt-4 sm:mt-0 sm:ml-4 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md flex items-center shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" /> New Project
          </Button>
        )}
      </div>

      {/* Task Completion Donut Chart and Motivational Message */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Task Progress</h3>
        <div className="relative w-44 h-44 sm:w-48 sm:h-48">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-bold text-gray-800">
              {taskCompletion.percentage}%
            </span>
          </div>
        </div>
        <p className="text-gray-600 mt-4">
          You've completed {taskCompletion.completed} out of {taskCompletion.total} tasks.
        </p>
        <p className="text-indigo-600 font-medium mt-2">
          {motivationalMessage}
        </p>
      </div>

      {/* My Focus Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                <Zap className="w-6 h-6 text-yellow-500 mr-2" /> My Focus
            </h3>
        </div>
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-3 rounded-lg shadow-sm animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : myTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {myTasks.map((task) => (              
              <MyTaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No priority tasks for you at the moment.</p>
            <p className="text-sm text-gray-400">Enjoy the calm or find a new challenge!</p>
          </div>
        )}
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-7 w-7 text-green-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Tasks</p>
            <p className="text-xl font-semibold text-gray-800">{taskCompletion.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-blue-100 rounded-full">
            <Calendar className="h-7 w-7 text-blue-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
            <p className="text-xl font-semibold text-gray-800">{upcomingDeadlines}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-purple-100 rounded-full">
            <Users className="h-7 w-7 text-purple-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Team Members</p>
            <p className="text-xl font-semibold text-gray-800">{teamMembersCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => navigate(`/workspace/${currentWorkspaceId}/tasks`)} 
        >
          <CheckCircle className="mr-2 h-5 w-5" /> View All Tasks
        </Button>
      </div>

      {/* Recent Items Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Recently Updated</h3>
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
              activeTab === "projects"
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => setActiveTab("projects")}
          >
            Recent Projects
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
              activeTab === "tasks"
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => setActiveTab("tasks")}
          >
            Recent Tasks
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
              activeTab === "members"
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => setActiveTab("members")}
          >
            Recent Members
          </button>
        </div>
        <div className="mt-4">
          {activeTab === "projects" && (
            <RecentProjects
              workspaceId={currentWorkspaceId}
              onProjectCreated={projectCreated}
            />
          )}
          {activeTab === "tasks" && <RecentTasks workspaceId={currentWorkspaceId} />}
          {activeTab === "members" && <RecentMembers workspaceId={currentWorkspaceId} />}
        </div>
      </div>

      {/* Create Project Modal */}
      {open && canCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Project</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Marketing Campaign Q4"
                    className="w-full border border-gray-300 rounded-md p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !projectName}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDashboard;