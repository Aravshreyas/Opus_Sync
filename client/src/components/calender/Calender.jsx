import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={"p-3 " + className}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded-md",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-200 [&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md" +
              (props.mode === "range"
                ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                : "[&:has([aria-selected])]:rounded-md"),
        day: "h-8 w-8 p-0 font-normal border border-transparent hover:bg-gray-100 rounded-md aria-selected:opacity-100",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: "bg-blue-500 text-white hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white",
        day_today: "bg-gray-100 text-gray-900",
        day_outside: "text-gray-500 aria-selected:bg-gray-100/50 aria-selected:text-gray-500",
        day_disabled: "text-gray-500 opacity-50",
        day_range_middle: "aria-selected:bg-gray-200 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={"h-4 w-4 " + className} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={"h-4 w-4 " + className} {...props} />
        ),
      }}
      {...props}
    />
  );
};

Calendar.displayName = "Calendar";

export { Calendar };