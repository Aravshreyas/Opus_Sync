import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Added to get URL params
import axios from 'axios'; // Added for API requests
import {
  X, Edit3, CalendarDays, UserCircle, AlertTriangle, Tag, Type, CheckSquare, Clock, Hash, Info, UserCheck, MessageSquare, Paperclip, Trash2, Users, Briefcase
} from 'lucide-react';

// Helper to format dates
const formatDate = (dateString, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString('en-US', options);
};

// Helper for styled pills (status, priority)
const InfoPill = ({ text, colorClasses, icon: IconComponent }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${colorClasses}`}>
    {IconComponent && <IconComponent size={14} />}
    {text || "N/A"}
  </span>
);

// Helper for Detail Items
const DetailItem = ({ label, value, icon: IconComponent, children, className = "" }) => (
  <div className={`py-3 ${className}`}>
    <dt className="text-xs font-medium text-gray-500 flex items-center mb-1">
      {IconComponent && <IconComponent size={15} className="mr-2 text-gray-400" />}
      {label}
    </dt>
    <dd className="text-sm text-gray-800 leading-relaxed">
      {children || value || <span className="italic text-gray-400">Not set</span>}
    </dd>
  </div>
);

const TaskDetailDisplay = ({ onClose, onEdit, onDelete }) => {
  const { taskId, projectId, workspaceId } = useParams(); 
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project,setProject] = useState(null)

  // Fetch task data when the component mounts
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !projectId || !workspaceId) {
        setError("Missing required parameters in URL");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/task/${taskId}/project/${projectId}/workspace/${workspaceId}`,
          // { withCredentials: true }
        );
        setTask(response.data.task || null);
        const projectResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/project/${projectId}/workspace/${workspaceId}`,
          // { withCredentials: true }
        );
        console.log(projectResponse.data)
        setProject(projectResponse.data.project)
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch task");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId, projectId, workspaceId]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-10 text-gray-500 bg-white rounded-xl">
        Loading task data...
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-10 text-red-500 bg-white rounded-xl">
        {error}
      </div>
    );
  }

  // Handle no task data
  if (!task) {
    return (
      <div className="flex items-center justify-center h-full p-10 text-gray-500 bg-white rounded-xl">
        No task data available to display.
      </div>
    );
  }

  const getStatusPillDetails = (statusStr) => {
    const status = statusStr?.toUpperCase();
    switch (status) {
      case "DONE": return { text: "Done", color: "bg-green-50 text-green-700 border-green-300", icon: CheckSquare };
      case "IN_PROGRESS": return { text: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-300", icon: Clock };
      case "IN_REVIEW": return { text: "In Review", color: "bg-purple-50 text-purple-700 border-purple-300", icon: UserCheck };
      case "TODO": return { text: "To Do", color: "bg-yellow-50 text-yellow-700 border-yellow-300", icon: Type };
      case "BACKLOG": return { text: "Backlog", color: "bg-gray-100 text-gray-600 border-gray-300", icon: Info };
      default: return { text: statusStr || "Unknown", color: "bg-gray-100 text-gray-600 border-gray-300", icon: Info };
    }
  };

  const getPriorityPillDetails = (priorityStr) => {
    const priority = priorityStr?.toUpperCase();
    switch (priority) {
      case "CRITICAL": return { text: "Critical", color: "bg-red-100 text-red-800 border-red-400 font-bold", icon: AlertTriangle };
      case "HIGH": return { text: "High", color: "bg-red-50 text-red-700 border-red-300", icon: AlertTriangle };
      case "MEDIUM": return { text: "Medium", color: "bg-orange-50 text-orange-600 border-orange-300", icon: AlertTriangle };
      case "LOW": return { text: "Low", color: "bg-sky-50 text-sky-600 border-sky-300", icon: AlertTriangle };
      default: return { text: priorityStr || "None", color: "bg-gray-100 text-gray-600 border-gray-300", icon: Info };
    }
  };

  const statusDetails = getStatusPillDetails(task.status);
  const priorityDetails = getPriorityPillDetails(task.priority);

  // Gracefully handle createdBy if it's a string ID or an object
  const createdByName = typeof task.createdBy === 'object' && task.createdBy !== null 
                        ? task.createdBy.name 
                        : (typeof task.createdBy === 'string' ? `User ID: ${task.createdBy.slice(-6)}...` : "Unknown");
  const createdByAvatar = typeof task.createdBy === 'object' && task.createdBy !== null 
                        ? task.createdBy.profilePicture 
                        : null;

  // Gracefully handle assignedTo if it's null, a string ID, or an object
  let assignedToName = "Unassigned";
  let assignedToAvatar = null;
  if (task.assignedTo) {
    if (typeof task.assignedTo === 'object') {
      assignedToName = task.assignedTo.name;
      assignedToAvatar = task.assignedTo.profilePicture;
    } else if (typeof task.assignedTo === 'string') {
      assignedToName = `User ID: ${task.assignedTo.slice(-6)}...`;
    }
  }

  return (
    <div className=" p-6 sm:p-8  w-full max-w-3xl mx-auto flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 mb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight" title={task.title}>
              {task.title}
            </h1>
          </div>
          {task.taskCode && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block shadow-sm">
              ID: {task.taskCode}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Edit Task"
            >
              <Edit3 size={18} />
            </button>
          )}
          {onDelete && (
             <button
              onClick={() => onDelete(task)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Delete Task"
            >
              <Trash2 size={18} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Close View"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar-slim">
        {/* Key Attributes Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
          <DetailItem label="Status" icon={Tag}>
            <InfoPill text={statusDetails.text} colorClasses={statusDetails.color} icon={statusDetails.icon} />
          </DetailItem>
          <DetailItem label="Priority" icon={AlertTriangle}>
            <InfoPill text={priorityDetails.text} colorClasses={priorityDetails.color} icon={priorityDetails.icon} />
          </DetailItem>
          <DetailItem label="Due Date" icon={CalendarDays} value={formatDate(task.dueDate)} />
          
          <DetailItem label="Project" icon={Briefcase} className="sm:col-span-1">
            <span className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md text-sm">
              {task.project?.emoji && <span className="text-base">{project.emoji}</span>}
              <span className="font-medium text-slate-700">{project?.name || "N/A"}</span>
            </span>
          </DetailItem>

          <DetailItem label="Assigned To" icon={UserCheck}>
            <div className="flex items-center gap-2">
                {assignedToAvatar ? 
                    <img src={assignedToAvatar} alt={assignedToName} className="w-6 h-6 rounded-full"/> 
                    : (task.assignedTo ? <UserCircle size={20} className="text-gray-400"/> : null)
                }
                <span>{assignedToName}</span>
            </div>
          </DetailItem>
          
          <DetailItem label="Task Code (alt)" icon={Hash} value={task.taskCode} className="md:col-span-1" />
        </section>

        {/* Description Section */}
        <section className="pt-5 border-t border-gray-100">
          <DetailItem label="Description" icon={MessageSquare}>
            {task.description ? (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                {task.description}
              </div>
            ) : (
              <p className="italic text-gray-400 p-3 bg-slate-50 rounded-md border border-slate-200">No description provided for this task.</p>
            )}
          </DetailItem>
        </section>

        {/* Metadata Section */}
        <section className="pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Info size={16} className="text-gray-400"/> Additional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
                <DetailItem label="Created By" icon={UserCircle} className="py-2">
                     <div className="flex items-center gap-2">
                        {createdByAvatar ? 
                            <img src={createdByAvatar} alt={createdByName} className="w-5 h-5 rounded-full"/> 
                            : <UserCircle size={18} className="text-gray-400"/>
                        }
                        <span>{createdByName}</span>
                    </div>
                </DetailItem>
                <DetailItem label="Created At" icon={Clock} value={formatDate(task.createdAt, {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})} className="py-2"/>
                <DetailItem label="Last Updated" icon={Clock} value={formatDate(task.updatedAt, {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})} className="py-2"/>
                <DetailItem label="Internal Task ID" icon={Hash} value={task._id} className="py-2"/>
            </div>
        </section>

        {/* Placeholder Sections for future expansion */}
        {['Subtasks', 'Attachments', 'Comments & Activity'].map(sectionTitle => (
            <section key={sectionTitle} className="pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    {sectionTitle === 'Subtasks' && <CheckSquare size={16} className="text-gray-400"/>}
                    {sectionTitle === 'Attachments' && <Paperclip size={16} className="text-gray-400"/>}
                    {sectionTitle === 'Comments & Activity' && <MessageSquare size={16} className="text-gray-400"/>}
                    {sectionTitle}
                </h3>
                <div className="text-sm text-gray-400 italic p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">This section is coming soon!</div>
            </section>
        ))}
      </div>
 
    </div>
  );
};

export default TaskDetailDisplay;