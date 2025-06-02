import React from "react";
function Button({ variant, className, children, ...props }) {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  let variantClasses = variant === "outline" 
    ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" 
    : "bg-primary text-primary-foreground shadow hover:bg-primary/90";
  const finalClasses = `${baseClasses} ${variantClasses} ${className || ""}`;
  return <button className={finalClasses} {...props}>{children}</button>;
}
export default Button;