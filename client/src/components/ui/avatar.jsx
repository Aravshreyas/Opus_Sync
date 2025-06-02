import React from "react";

const Avatar = ({ className = "", children, ...props }) => (
  <div
    className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
    {...props}
  >
    {children}
  </div>
);

const AvatarImage = ({ src, alt, className = "", ...props }) => (
  <img
    src={src}
    alt={alt}
    className={`aspect-square h-full w-full ${className}`}
    {...props}
  />
);

const AvatarFallback = ({ className = "", children, ...props }) => (
  <div
    className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}
    {...props}
  >
    {children}
  </div>
);

export { Avatar, AvatarImage, AvatarFallback };