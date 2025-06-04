import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Loader,
  CirclePlus,
  ChevronDown,
  ChevronsUpDown,
  Ellipsis,
  CircleCheckBig,
  View,
  Circle,
  CircleHelp,
  Timer,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  Check,
  User,
  Folder,
  Pencil,
  Trash,
  X,
  Eye,
} from "lucide-react";
import axios from "axios";
import useWorkspaceId from "../../../hooks/useWorkspaceId";
import CreateTaskDialog from "./CreateTaskDialog";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../../../components/common/UserAvatar";

const TaskTable = ({ workspaceId: propWorkspaceId, projectId: propProjectId, onTaskUpdated,isDialogOpen }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const workspaceIdFromHook = useWorkspaceId();
  const actualWorkspaceId = propWorkspaceId || workspaceIdFromHook;

  const [projectId, setProjectId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState(new Set());
  const [selectedAssignedTo, setSelectedAssignedTo] = useState(new Set());
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 20, 50];
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    project: true,
    assignedTo: true,
    dueDate: true,
    status: true,
    priority: true,
  });
  const [statusSearch, setStatusSearch] = useState("");
  const [prioritySearch, setPrioritySearch] = useState("");
  const [assignedToSearch, setAssignedToSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [activeTaskMenu, setActiveTaskMenu] = useState(null);
  const dropdownRefs = useRef({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setProjectId(propProjectId);
  }, [propProjectId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeTaskMenu && dropdownRefs.current[activeTaskMenu]) {
        if (!dropdownRefs.current[activeTaskMenu].contains(event.target)) {
          setActiveTaskMenu(null);
        }
      }
      if (
        activeDropdown &&
        !event.target.closest(".dropdown-container") &&
        !event.target.closest(".task-menu") &&
        !event.target.closest(".columns-dropdown-button") &&
        !event.target.closest(".rows-per-page-dropdown-button")
      ) {
        setActiveDropdown(null);
        if (["status", "priority", "assignedTo", "projects"].includes(activeDropdown)) {
          setStatusSearch("");
          setPrioritySearch("");
          setAssignedToSearch("");
          setProjectSearch("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTaskMenu, activeDropdown]);

  const fetchTasks = useCallback(async () => {
    if (!actualWorkspaceId) {
      setError("Workspace ID is not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${actualWorkspaceId}/all`;
      const response = await axios.get(endpoint, 
        // { withCredentials: true }
      );
      let fetchedTasks = response.data.tasks || [];

      if (propProjectId) {
        fetchedTasks = fetchedTasks.filter(
          (task) => task.project?._id === propProjectId || task.project === propProjectId
        );
      }
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [actualWorkspaceId, propProjectId,isDialogOpen]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const assignedToOptions = useMemo(
    () =>
      Array.from(
        new Set(tasks.map((task) => task.assignedTo?.name || task.assignedTo?._id || "Unassigned"))
      ).map((identifier) => {
        const taskWithUser = tasks.find((t) => (t.assignedTo?.name || t.assignedTo?._id) === identifier);
        const name = taskWithUser?.assignedTo?.name || (identifier === "Unassigned" ? "Unassigned" : "Unknown User");
        return { value: identifier, label: name, icon: User };
      }),
    [tasks]
  );

  const projectOptions = useMemo(
    () =>
      Array.from(
        new Set(tasks.map((task) => task.project?.name || task.project?._id || "No Project"))
      ).map((identifier) => {
        const taskWithProject = tasks.find((t) => (t.project?.name || t.project?._id) === identifier);
        const name = taskWithProject?.project?.name || (identifier === "No Project" ? "No Project" : "Unknown Project");
        return { value: identifier, label: name, icon: Folder };
      }),
    [tasks]
  );

  const statusOptions = [
    { value: "BACKLOG", label: "Backlog", icon: CircleHelp },
    { value: "TODO", label: "Todo", icon: Circle },
    { value: "IN_PROGRESS", label: "In Progress", icon: Timer },
    { value: "IN_REVIEW", label: "In Review", icon: View },
    { value: "DONE", label: "Done", icon: CircleCheckBig },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low", icon: ArrowDown },
    { value: "MEDIUM", label: "Medium", icon: ArrowRight },
    { value: "HIGH", label: "High", icon: ArrowUp },
  ];

  const applyFilters = useCallback(() => {
    let result = [...tasks];
    const globalSearchTerm = document.getElementById('task-search-input')?.value.toLowerCase();

    if (selectedStatuses.size > 0) {
      result = result.filter((task) => selectedStatuses.has(task.status?.toUpperCase().replace(" ", "_")));
    }

    if (selectedPriorities.size > 0) {
      result = result.filter((task) => selectedPriorities.has(task.priority?.toUpperCase()));
    }

    if (selectedAssignedTo.size > 0) {
      result = result.filter((task) =>
        selectedAssignedTo.has(task.assignedTo?.name || task.assignedTo?._id || "Unassigned")
      );
    }

    if (selectedProjects.size > 0) {
      result = result.filter((task) =>
        selectedProjects.has(task.project?.name || task.project?._id || "No Project")
      );
    }

    if (globalSearchTerm) {
      result = result.filter((task) =>
        task.title?.toLowerCase().includes(globalSearchTerm) ||
        task.taskCode?.toLowerCase().includes(globalSearchTerm)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "project") {
          aValue = a.project?.name || "No Project";
          bValue = b.project?.name || "No Project";
        } else if (sortConfig.key === "assignedTo") {
          aValue = a.assignedTo?.name || "Unassigned";
          bValue = b.assignedTo?.name || "Unassigned";
        } else if (sortConfig.key === "dueDate") {
          if (!aValue && !bValue) return 0;
          if (!aValue) return sortConfig.direction === "asc" ? 1 : -1;
          if (!bValue) return sortConfig.direction === "asc" ? -1 : 1;
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
        }

        return sortConfig.direction === "asc"
          ? String(aValue ?? "").localeCompare(String(bValue ?? ""))
          : String(bValue ?? "").localeCompare(String(aValue ?? ""));
      });
    }

    setFilteredTasks(result);
  }, [
    tasks,
    selectedStatuses,
    selectedPriorities,
    selectedAssignedTo,
    selectedProjects,
    sortConfig,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleGlobalSearchChange = (e) => {
    applyFilters();
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTasks.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTasks, currentPage, rowsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) {
      setActiveTaskMenu(null);
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/task/${taskId}/workspace/${actualWorkspaceId}/delete`,
        // { withCredentials: true }
      );
      fetchTasks();
      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      alert("Task deleted successfully");
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task: " + (err.response?.data?.message || err.message));
    } finally {
      setActiveTaskMenu(null);
    }
  };

  const handleEdit = (taskId) => {
    const taskToEdit = tasks.find((task) => task._id === taskId);
    if (!taskToEdit) return;

    setEditingTask(taskToEdit);
    setIsEditDialogOpen(true);
    setActiveTaskMenu(null);
  };

  const handleView = (taskId, taskProjectId) => {
    if (!taskProjectId) {
      console.error("Project ID is undefined for this task. Cannot navigate.");
      alert("Cannot view task: Project information is missing.");
      setActiveTaskMenu(null);
      return;
    }
    navigate(`/workspace/${actualWorkspaceId}/project/${taskProjectId}/tasks/${taskId}`);
    setActiveTaskMenu(null);
  };

  const handleTaskProcessed = () => {
    fetchTasks();
    setIsEditDialogOpen(false);
    setEditingTask(null);
    if (onTaskUpdated) {
      onTaskUpdated();
    }
  };

  const handleSelectRow = (taskId) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedTasks.length && paginatedTasks.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedTasks.map((task) => task._id)));
    }
  };

  const handleStatusSelect = (statusValue) => {
    setSelectedStatuses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(statusValue)) {
        newSet.delete(statusValue);
      } else {
        newSet.add(statusValue);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const handlePrioritySelect = (priorityValue) => {
    setSelectedPriorities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(priorityValue)) {
        newSet.delete(priorityValue);
      } else {
        newSet.add(priorityValue);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const handleAssignedToSelect = (assignedToValue) => {
    setSelectedAssignedTo((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignedToValue)) {
        newSet.delete(assignedToValue);
      } else {
        newSet.add(assignedToValue);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const handleProjectSelect = (projectValue) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectValue)) {
        newSet.delete(projectValue);
      } else {
        newSet.add(projectValue);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown((prev) => (prev === dropdownName ? null : dropdownName));
    if (dropdownName !== "status") setStatusSearch("");
    if (dropdownName !== "priority") setPrioritySearch("");
    if (dropdownName !== "assignedTo") setAssignedToSearch("");
    if (dropdownName !== "projects") setProjectSearch("");
    setActiveTaskMenu(null);
  };

  const toggleTaskMenu = (taskId) => {
    setActiveTaskMenu((prev) => (prev === taskId ? null : taskId));
    setActiveDropdown(null);
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const filteredStatusOptions = statusOptions.filter((option) =>
    option.label.toLowerCase().includes(statusSearch.toLowerCase())
  );

  const filteredPriorityOptions = priorityOptions.filter((option) =>
    option.label.toLowerCase().includes(prioritySearch.toLowerCase())
  );

  const filteredAssignedToOptions = assignedToOptions.filter((option) =>
    option.label.toLowerCase().includes(assignedToSearch.toLowerCase())
  );

  const filteredProjectOptions = projectOptions.filter((option) =>
    option.label.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const getStatusStyles = (status) => {
    switch (status?.toUpperCase().replace(" ", "_")) {
      case "DONE": return "bg-green-100 text-green-700";
      case "IN_REVIEW": return "bg-purple-100 text-purple-700";
      case "TODO": return "bg-blue-100 text-blue-700";
      case "BACKLOG": return "bg-gray-100 text-gray-700";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    const IconComponent = statusOptions.find(opt => opt.value === status?.toUpperCase().replace(" ", "_"))?.icon || Circle;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPriorityStyles = (priority) => {
    switch (priority?.toUpperCase()) {
      case "LOW": return "text-gray-600";
      case "HIGH": return "text-red-600";
      case "MEDIUM": return "text-yellow-600";
      default: return "text-gray-500";
    }
  };

  const getPriorityIcon = (priority) => {
    const IconComponent = priorityOptions.find(opt => opt.value === priority?.toUpperCase())?.icon || ArrowDown;
    return <IconComponent className="h-4 w-4" />;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="w-full space-y-4 p-2 md:p-4 bg-white text-gray-900 rounded-lg shadow">
      {isEditDialogOpen && (
        <CreateTaskDialog
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingTask(null);
          }}
          workspaceId={actualWorkspaceId}
          task={editingTask}
          onTaskProcessed={handleTaskProcessed}
          projectIdFromPath={propProjectId || editingTask?.project?._id || editingTask?.project}
        />
      )}

      <div className="w-full lg:flex lg:items-center lg:justify-between gap-2">
        <div className="flex-1 mb-2 lg:mb-0">
          <div className="flex flex-col sm:flex-row w-full items-start gap-2 dropdown-container">
            <input
              id="task-search-input"
              className="flex rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9 w-full sm:w-[200px] lg:w-[250px]"
              placeholder="Search title or code..."
              onChange={handleGlobalSearchChange}
            />
            <div className="relative">
              <button
                onClick={() => toggleDropdown("status")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 rounded-md px-3 text-xs h-9 w-full sm:w-auto"
              >
                <CirclePlus className="h-4 w-4" />
                Status
                {selectedStatuses.size > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">{selectedStatuses.size}</span>}
              </button>
              {activeDropdown === "status" && (
                <div className="absolute z-20 mt-1 flex flex-col w-full min-w-[220px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
                  <div className="flex items-center border-b border-gray-200 px-3 py-2">
                    <Search className="mr-2 h-4 w-4 text-gray-500" />
                    <input
                      className="flex w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Filter Status"
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[250px] overflow-y-auto p-1">
                    {filteredStatusOptions.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No statuses found</div>
                    ) : (
                      filteredStatusOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => handleStatusSelect(option.value)}
                          className={`relative flex gap-2 items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${selectedStatuses.has(option.value) ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                        >
                          <div
                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selectedStatuses.has(option.value) ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}
                          >
                            {selectedStatuses.has(option.value) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <option.icon className="mr-1 h-4 w-4 text-gray-500" />
                          <span>{option.label}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => toggleDropdown("priority")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 rounded-md px-3 text-xs h-9 w-full sm:w-auto"
              >
                <CirclePlus className="h-4 w-4" />
                Priority
                {selectedPriorities.size > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">{selectedPriorities.size}</span>}
              </button>
              {activeDropdown === "priority" && (
                <div className="absolute z-20 mt-1 flex flex-col w-full min-w-[220px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
                  <div className="flex items-center border-b border-gray-200 px-3 py-2">
                    <Search className="mr-2 h-4 w-4 text-gray-500" />
                    <input
                      className="flex w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-400"
                      placeholder="Filter Priority"
                      value={prioritySearch}
                      onChange={(e) => setPrioritySearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[250px] overflow-y-auto p-1">
                    {filteredPriorityOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handlePrioritySelect(option.value)}
                        className={`relative flex gap-2 items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${selectedPriorities.has(option.value) ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                      >
                        <div
                          className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selectedPriorities.has(option.value) ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}
                        >
                          {selectedPriorities.has(option.value) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <option.icon className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("assignedTo")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 rounded-md px-3 text-xs h-9 w-full sm:w-auto"
                >
                  <CirclePlus className="h-4 w-4" />
                  Assigned To
                  {selectedAssignedTo.size > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">{selectedAssignedTo.size}</span>}
                </button>
                {activeDropdown === "assignedTo" && (
                  <div className="absolute z-20 mt-1 flex flex-col w-full min-w-[220px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
                    <div className="flex items-center border-b border-gray-200 px-3 py-2">
                      <Search className="mr-2 h-4 w-4 text-gray-500" />
                      <input
                        className="flex w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-400"
                        placeholder="Filter Assignee"
                        value={assignedToSearch}
                        onChange={(e) => setAssignedToSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                      {filteredAssignedToOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => handleAssignedToSelect(option.value)}
                          className={`relative flex gap-2 items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${selectedAssignedTo.has(option.value) ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                        >
                          <div
                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selectedAssignedTo.has(option.value) ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}
                          >
                            {selectedAssignedTo.has(option.value) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <option.icon className="mr-1 h-4 w-4 text-gray-500" />
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            
           
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("projects")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 rounded-md px-3 text-xs h-9 w-full sm:w-auto"
                >
                  <CirclePlus className="h-4 w-4" />
                  Projects
                  {selectedProjects.size > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500 text-white">{selectedProjects.size}</span>}
                </button>
                {activeDropdown === "projects" && (
                  <div className="absolute z-20 mt-1 flex flex-col w-full min-w-[220px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
                    <div className="flex items-center border-b border-gray-200 px-3 py-2">
                      <Search className="mr-2 h-4 w-4 text-gray-500" />
                      <input
                        className="flex w-full rounded-md bg-transparent text-sm outline-none placeholder:text-gray-400"
                        placeholder="Filter Project"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                      {filteredProjectOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => handleProjectSelect(option.value)}
                          className={`relative flex gap-2 items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${selectedProjects.has(option.value) ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                        >
                          <div
                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selectedProjects.has(option.value) ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}
                          >
                            {selectedProjects.has(option.value) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <option.icon className="mr-1 h-4 w-4 text-gray-500" />
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            
          </div>
        </div>
        <div className="relative columns-dropdown-button">
          <button
            onClick={() => toggleDropdown("columns")}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 px-4 py-2 w-full sm:w-auto"
          >
            Columns
            <ChevronDown className="h-4 w-4" />
          </button>
          {activeDropdown === "columns" && (
            <div className="absolute z-20 right-0 mt-1 flex flex-col w-full min-w-[180px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
              <div className="p-1">
                {Object.keys(visibleColumns).map((column) => (
                  <div
                    key={column}
                    onClick={() => toggleColumnVisibility(column)}
                    className={`relative flex gap-2 items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${visibleColumns[column] ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                  >
                    <div
                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${visibleColumns[column] ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}
                    >
                      {visibleColumns[column] && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span>{column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-gray-200">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-200 transition-colors">
                <th className="h-10 px-2 text-left align-middle font-medium text-gray-500 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 shadow focus:ring-blue-500 translate-y-[2px]"
                    checked={selectedRows.size === paginatedTasks.length && paginatedTasks.length > 0}
                    onChange={handleSelectAll}
                    disabled={paginatedTasks.length === 0}
                  />
                </th>
                {visibleColumns.title && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("title")} className="inline-flex items-center gap-1 group">
                      <span>Title</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'title' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                {visibleColumns.project && !propProjectId && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("project")} className="inline-flex items-center gap-1 group">
                      <span>Project</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'project' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                {visibleColumns.assignedTo && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("assignedTo")} className="inline-flex items-center gap-1 group">
                      <span>Assigned To</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'assignedTo' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                {visibleColumns.dueDate && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("dueDate")} className="inline-flex items-center gap-1 group">
                      <span>Due Date</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'dueDate' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("status")} className="inline-flex items-center gap-1 group">
                      <span>Status</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'status' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                {visibleColumns.priority && (
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">
                    <button onClick={() => handleSort("priority")} className="inline-flex items-center gap-1 group">
                      <span>Priority</span>
                      <ChevronsUpDown className={`h-4 w-4 opacity-50 group-hover:opacity-100 ${sortConfig.key === 'priority' ? 'opacity-100' : ''}`} />
                    </button>
                  </th>
                )}
                <th className="h-10 px-2 text-left align-middle font-medium text-gray-500 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={Object.values(visibleColumns).filter(Boolean).length + 2 - (propProjectId && visibleColumns.project ? 1 : 0)}
                    className="p-4 text-center text-gray-500"
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => (
                  <tr key={task._id} className="transition-colors hover:bg-gray-50">
                    <td className="p-2 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 shadow focus:ring-blue-500 translate-y-[2px]"
                        checked={selectedRows.has(task._id)}
                        onChange={() => handleSelectRow(task._id)}
                      />
                    </td>
                    {visibleColumns.title && (
                      <td className="p-2 align-middle font-medium text-gray-800 max-w-xs truncate" title={task.title}>
                        <button
                          onClick={() => handleView(task._id, task.project?._id || task.project)}
                          className="text-blue-600 hover:underline text-left"
                        >
                          {task.title || "Untitled"}
                        </button>
                        <div className="text-xs text-gray-500">{task.taskCode}</div>
                      </td>
                    )}
                    {visibleColumns.project && !propProjectId && (
                      <td className="p-2 align-middle text-gray-600 max-w-[150px] truncate" title={task.project?.name || task.project || "No Project"}>
                        <div className="flex items-center gap-1.5">
                          <Folder className="h-4 w-4 shrink-0 opacity-70" />
                          {task.project?.name || task.project || "No Project"}
                        </div>
                      </td>
                    )}
                    {visibleColumns.assignedTo && (
                      <td className="p-2 align-middle text-gray-600 max-w-[150px] truncate" title={task.assignedTo?.name || "Unassigned"}>
                        <div className="flex items-center gap-2">
                          {task.assignedTo ? (
                            <UserAvatar user={task.assignedTo} size={6} />
                          ) : (
                            <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6">
                              <span className="aspect-square h-full w-full bg-teal-500 flex items-center justify-center text-white font-medium text-xs">
                                U
                              </span>
                            </span>
                          )}
                          <span>{task.assignedTo?.name || "Unassigned"}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.dueDate && (
                      <td className="p-2 align-middle text-gray-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No Due Date"}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="p-2 align-middle">
                        <div className={`inline-flex items-center rounded-full text-xs font-semibold p-1 px-2.5 gap-1.5 ${getStatusStyles(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span>{task.status?.replace("_", " ") || "Unknown"}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td className="p-2 align-middle">
                        <div className={`inline-flex items-center rounded-full text-xs font-semibold p-1 px-2.5 gap-1.5 ${getPriorityStyles(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                          <span>{task.priority || "Unknown"}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-2 align-middle text-right">
                      <div className="relative">
                        <button
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 h-8 w-8 p-0"
                          onClick={() => toggleTaskMenu(task._id)}
                        >
                          <Ellipsis className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </button>
                        {activeTaskMenu === task._id && (
                          <div
                            ref={(el) => (dropdownRefs.current[task._id] = el)}
                            className="task-menu z-30 min-w-[8rem] w-[160px] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute right-0 mt-1"
                          >
                            <div
                              role="menuitem"
                              className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                              onClick={() => handleView(task._id, task.project?._id || task.project)}
                            >
                              <Eye className="h-4 w-4 shrink-0" /> View Task
                            </div>
                            <div
                              role="menuitem"
                              className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                              onClick={() => handleEdit(task._id)}
                            >
                              <Pencil className="h-4 w-4 shrink-0" /> Edit Task
                            </div>
                            <div role="separator" className="-mx-1 my-1 h-px bg-gray-200" />
                            <div
                              role="menuitem"
                              className="relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                              onClick={() => handleDelete(task._id)}
                            >
                              <Trash className="h-4 w-4 shrink-0" /> Delete Task
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 py-3 border-t border-gray-200">
        <div className="flex-1 text-sm text-gray-500">
          {selectedRows.size > 0
            ? `${selectedRows.size} of ${filteredTasks.length} row(s) selected.`
            : `Showing ${Math.min((currentPage - 1) * rowsPerPage + 1, filteredTasks.length)}-${Math.min(currentPage * rowsPerPage, filteredTasks.length)} of ${filteredTasks.length}`}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <div className="relative rows-per-page-dropdown-button">
              <button
                onClick={() => toggleDropdown("rowsPerPage")}
                className="flex items-center justify-between whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-9 w-[70px]"
              >
                <span>{rowsPerPage}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              {activeDropdown === "rowsPerPage" && (
                <div className="absolute z-20 bottom-full mb-1 right-0 sm:bottom-auto sm:top-full sm:mt-1 flex flex-col w-full min-w-[70px] rounded-md bg-white text-gray-900 shadow-lg border border-gray-200">
                  <div className="p-1">
                    {rowsPerPageOptions.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          handleRowsPerPageChange(option);
                          toggleDropdown("rowsPerPage");
                        }}
                        className={`relative flex justify-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none ${rowsPerPage === option ? "bg-blue-50 font-semibold" : "hover:bg-gray-100"}`}
                      >
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-start">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 w-9 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-1 sm:mr-0" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  className={`flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 h-9 w-9 p-0 ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 ml-1 sm:ml-0" />
              </button>
              <button
                className="flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 w-9 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(totalPages)}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTable;