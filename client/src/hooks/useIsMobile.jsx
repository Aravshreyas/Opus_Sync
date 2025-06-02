const MOBILE_BREAKPOINT = 768;

function isMobile() {
  // Initial check based on current window width
  let mobileState = window.innerWidth < MOBILE_BREAKPOINT;

  // Function to update mobile state
  function updateMobileState() {
    mobileState = window.innerWidth < MOBILE_BREAKPOINT;
  }

  // Add event listener for window resize
  function setupListener(callback) {
    const handleResize = () => {
      updateMobileState();
      if (callback) callback(mobileState);
    };
    window.addEventListener("resize", handleResize);
    // Initial call to set the state
    handleResize();
    // Return cleanup function
    return () => window.removeEventListener("resize", handleResize);
  }

  // Return the current state and setup function
  return {
    isMobile: mobileState,
    setupListener, // Call this with a callback to update state dynamically
  };
}

export  default isMobile ;