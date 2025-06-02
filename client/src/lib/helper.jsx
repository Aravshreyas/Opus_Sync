export const transformOptions = (
    options,
    iconMap
  ) =>
    options.map((value) => ({
      label: value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: value,
      icon: iconMap ? iconMap[value] : undefined,
    }));
  
  export const transformStatusEnum = (status) => {
    return status.replace(/_/g, " ");
  };
  
  export const formatStatusToEnum = (status) => {
    return status.toUpperCase().replace(/\s+/g, "_");
  };
  
  export const getAvatarColor = (initials) => {
    const colors = [
      "bg-red-500 text-white",
      "bg-blue-500 text-white",
      "bg-green-500 text-white",
      "bg-yellow-500 text-black",
      "bg-purple-500 text-white",
      "bg-pink-500 text-white",
      "bg-teal-500 text-white",
      "bg-orange-500 text-black",
      "bg-gray-500 text-white",
    ];
  
    const hash = initials
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
    return colors[hash % colors.length];
  };
  
  export const getAvatarFallbackText = (name) => {
    if (!name) return "NA";
    const initials = name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
    return initials || "NA";
  };