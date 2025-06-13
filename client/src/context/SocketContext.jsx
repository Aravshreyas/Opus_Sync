import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './auth-context';

const SocketContext = createContext({ socket: null, onlineUsers: [] });
export const useSocket = () => useContext(SocketContext);

const isAppleDevice = () => /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useAuth();
    
    useEffect(() => {
        if (user?._id) {
            const token = sessionStorage.getItem("accessToken");
            const connectionOptions = isAppleDevice() && token ? { auth: { token } } : { withCredentials: true };
            const newSocket = io(import.meta.env.VITE_BACKEND_URL_BASE || "http://localhost:8000", connectionOptions);
            
            newSocket.on('getOnlineUsers', (users) => setOnlineUsers(users || []));
            setSocket(newSocket);
            return () => newSocket.disconnect();
        } else {
            if (socket) { socket.disconnect(); setSocket(null); }
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};