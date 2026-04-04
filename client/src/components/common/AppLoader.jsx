import React from 'react';

const AppLoader = ({ size = 'md', fullPage = false, label }) => {
    // Determine dimensions based on size prop
    const sizeConfig = {
        sm: { width: '20px', text: 'text-xs', labelClass: 'mt-1' },
        md: { width: '45px', text: 'text-sm', labelClass: 'mt-2' },
        lg: { width: '60px', text: 'text-base', labelClass: 'mt-3' }
    };

    const config = sizeConfig[size] || sizeConfig.md;

    const loaderContent = (
        <div className="flex flex-col items-center justify-center">
            <style>{`
                .loader-bars {
                  width: ${config.width};
                  aspect-ratio: 1;
                  --c: no-repeat linear-gradient(currentColor 0 0);
                  background: 
                    var(--c) 0%   50%,
                    var(--c) 50%  50%,
                    var(--c) 100% 50%;
                  background-size: 20% 100%;
                  animation: l1 1s infinite linear;
                }
                @keyframes l1 {
                  0%  {background-size: 20% 100%, 20% 100%, 20% 100%}
                  33% {background-size: 20% 10% , 20% 100%, 20% 100%}
                  50% {background-size: 20% 100%, 20% 10% , 20% 100%}
                  66% {background-size: 20% 100%, 20% 100%, 20% 10% }
                  100%{background-size: 20% 100%, 20% 100%, 20% 100%}
                }
            `}</style>

            <div className="loader-bars text-indigo-600"></div>

            {label && (
                <p className={`font-medium text-slate-500 animate-pulse ${config.text} ${config.labelClass}`}>
                    {label}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="w-full min-h-[50vh] flex items-center justify-center">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
};

export default AppLoader;
