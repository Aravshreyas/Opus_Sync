import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSocket } from './SocketContext'; // We'll use the socket from our existing context

const OnlineUsersContext = createContext();

export const useOnlineUsers = () => {
    return useContext(OnlineUsersContext);
};

export const OnlineUsersProvider = ({ children }) => {
    const { socket } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!socket) return;

        // Listen for the updated list of online users from the server
        socket.on('getOnlineUsers', (users) => {
            setOnlineUsers(users);
        });

        // Cleanup the listener when the component unmounts or socket changes
        return () => {
            socket.off('getOnlineUsers');
        };
    }, [socket]);

    return (
        <OnlineUsersContext.Provider value={{ onlineUsers }}>
            {children}
        </OnlineUsersContext.Provider>
    );
};