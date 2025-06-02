import React from "react";
import { TaskPriorityEnum, TaskStatusEnum } from "../../constant";

const Badge = ({ variant, className = "", children, ...props }) => {
  let baseClass = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold";
  let variantClass = "";

  // Simple variant styling
  if (variant === TaskStatusEnum.BACKLOG) {
    variantClass = "bg-gray-100 text-gray-600";
  } else if (variant === TaskStatusEnum.TODO) {
    variantClass = "bg-[#DEEBFF] text-[#0052CC]";
  } else if (variant === TaskStatusEnum.IN_PROGRESS) {
    variantClass = "bg-yellow-100 text-yellow-600";
  } else if (variant === TaskStatusEnum.IN_REVIEW) {
    variantClass = "bg-purple-100 text-purple-500";
  } else if (variant === TaskStatusEnum.DONE) {
    variantClass = "bg-green-100 text-green-600";
  } else if (variant === TaskPriorityEnum.HIGH) {
    variantClass = "bg-orange-100 text-orange-600";
  } else if (variant === TaskPriorityEnum.URGENT) {
    variantClass = "bg-red-100 text-red-600";
  } else if (variant === TaskPriorityEnum.MEDIUM) {
    variantClass = "bg-yellow-100 text-yellow-600";
  } else if (variant === TaskPriorityEnum.LOW) {
    variantClass = "bg-gray-100 text-gray-600";
  } else {
    variantClass = "bg-primary text-primary-foreground border-transparent";
  }

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Badge };