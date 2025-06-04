import { useState, useEffect } from "react";
import useWorkspaceId from "../../hooks/useWorkspaceId";
import AnalyticsCard from "../../components/common/AnalyticsCard";
import axios from "axios";

const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();
  const [analytics, setAnalytics] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) {
      setError("Workspace ID is not available");
      return;
    }

    const fetchAnalytics = async () => {
      setIsPending(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/analytics/${workspaceId}`,
          // { withCredentials: true } // Ensure authentication via cookies
        );
        console.log("Fetched workspace analytics:", response.data.analytics);
        setAnalytics(response.data.analytics || {}); // Fallback to empty object if null
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch analytics");
        console.log("Full error response:", err.response);
      } finally {
        setIsPending(false);
      }
    };

    fetchAnalytics();
  }, [workspaceId]);

  // Debug analytics structure
  useEffect(() => {
    if (analytics) {
      console.log("Analytics structure:", analytics);
    }
  }, [analytics]);

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {error && <p className="text-red-500">{error}</p>}
      <AnalyticsCard
        isLoading={isPending}
        title="Total Tasks"
        value={analytics?.totalTasks || 0}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Overdue Tasks"
        value={analytics?.overdueTasks || 0}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Completed Tasks"
        value={analytics?.completedTasks || 0}
      />
    </div>
  );
};

export default WorkspaceAnalytics;