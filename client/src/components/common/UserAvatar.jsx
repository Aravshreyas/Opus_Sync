import React, { useState, useMemo, useCallback } from "react";


const DEFAULT_COLOR_PALETTE = [
  { background: "bg-red-500", text: "text-white" },
  { background: "bg-blue-500", text: "text-white" },
  { background: "bg-green-500", text: "text-white" },
  { background: "bg-yellow-400", text: "text-black" },
  { background: "bg-purple-500", text: "text-white" },
  { background: "bg-pink-500", text: "text-white" },
  { background: "bg-teal-500", text: "text-white" },
  { background: "bg-orange-400", text: "text-black" },
  { background: "bg-indigo-500", text: "text-white" },
  { background: "bg-gray-500", text: "text-white" },
  { background: "bg-cyan-500", text: "text-white" },
  { background: "bg-emerald-500", text: "text-white" },
];

const generateInitials = (name = "") => {
  if (!name || typeof name !== 'string' || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean); 

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDynamicStyles = (identifier, name, palette) => {
  const initials = generateInitials(name);
  const hashSource = String(identifier || name || "defaultUser"); 
  
  const sum = Array.from(hashSource).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  const colorPair = palette[sum % palette.length];
  
  return {
    initials,
    bgColorClass: colorPair.background,
    textColorClass: colorPair.text,
  };
};

// --- UserAvatar Component ---

const UserAvatar = React.memo(({
  user = {}, 
  size = 8, 
  fontSizeClass = "text-sm", 
  colorPalette = DEFAULT_COLOR_PALETTE,
  className = "", 
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Relevant destructuring
  const {
    _id,
    name,
    profilePicture // This will be null if user.profilePicture is null
  } = user;

  const avatarStyles = useMemo(() => {
    return getDynamicStyles(_id, name, colorPalette);
  }, [_id, name, colorPalette]);

  const handleImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  // Core logic: if profilePicture is null (or empty string), showImage will be false
  const showImage = profilePicture && !imageFailed; 
  
  const dimensionClasses = `h-${size} w-${size}`;
  // Fallback colors are applied when showImage is false
  const fallbackBgColor = showImage ? "bg-transparent" : avatarStyles.bgColorClass;
  const fallbackTextColor = showImage ? "" : avatarStyles.textColorClass;

  return (
    <div
      className={`flex ${dimensionClasses} rounded-full items-center justify-center font-medium shrink-0 overflow-hidden ${fallbackBgColor} ${fallbackTextColor} ${className}`}
      aria-label={name ? `Avatar for ${name}` : "User avatar"}
    >
      {showImage ? (
        // This block is skipped if profilePicture is null
        <img
          src={profilePicture}
          alt={`Avatar of ${name || 'user'}`}
          className="h-full w-full rounded-full object-cover"
          onError={handleImageError}
          loading="lazy" 
        />
      ) : (
        // This block is rendered if profilePicture is null
        <span aria-hidden="true" className={fontSizeClass /* Apply font size to initials */}> 
          {avatarStyles.initials}
        </span>
      )}
    </div>
  );
});

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;