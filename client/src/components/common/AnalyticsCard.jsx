import React from "react";
import { Activity, ArrowBigUp, ArrowBigDown, Loader } from "lucide-react";

const AnalyticsCard = ({ title, value, isLoading }) => {
  const getArrowIcon = () => {
    if (title === "Overdue Task") {
      return value > 0 ? (
        <ArrowBigDown strokeWidth={2.5} className="h-4 w-4 text-red-500" />
      ) : (
        <ArrowBigUp strokeWidth={2.5} className="h-4 w-4 text-green-500" />
      );
    }
    if (title === "Completed Task" || title === "Total Task") {
      return value > 0 ? (
        <ArrowBigUp strokeWidth={2.5} className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowBigDown strokeWidth={2.5} className="h-4 w-4 text-red-500" />
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{title}</span>
          {getArrowIcon()}
        </div>
        <Activity strokeWidth={2.5} className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold mt-2">
        {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : value}
      </div>
    </div>
  );
};

export default AnalyticsCard;