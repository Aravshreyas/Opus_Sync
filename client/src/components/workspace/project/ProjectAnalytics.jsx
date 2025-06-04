import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, AlertTriangle } from "lucide-react";

const ProjectAnalytics = ({ refreshKey }) => {
  const { workspaceId, projectId } = useParams();

  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async () => {
    if (!workspaceId || !projectId) {
      setError("Workspace or Project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${workspaceId}/all`,
        // { withCredentials: true }
      );
      const tasks = response.data.tasks ;

      // Filter tasks by projectId
      const projectTasks = tasks.filter(
        (task) => task.project?._id === projectId || task.project === projectId
      );

      // Calculate analytics
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status?.toUpperCase() === "DONE"
      ).length;

      
      const currentDate = new Date(); 
      const overdueTasks = projectTasks.filter((task) => {
        if (task.status?.toUpperCase() === "DONE") return false;
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < currentDate;
      }).length;

      setAnalytics({
        totalTasks,
        overdueTasks,
        completedTasks,
      });
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(`Failed to load analytics: ${err.response?.data?.message || err.message}.`);
      setAnalytics({
        totalTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [workspaceId, projectId, refreshKey]);

  const AnalyticsCard = ({ title, value }) => (
    <div className="p-4 border border-gray-300 rounded-md">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <AnalyticsCard title="Total Tasks" value={analytics.totalTasks} />
      <AnalyticsCard title="Overdue Tasks" value={analytics.overdueTasks} />
      <AnalyticsCard title="Completed Tasks" value={analytics.completedTasks} />
    </div>
  );
};

export default ProjectAnalytics;