import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      
      // Join user room if user is logged in
      if (user?.id) {
        newSocket.emit('joinRoom', user.id);
        console.log('Joined user room:', user.id);
      }
      
      // Join admin room if user is admin
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        newSocket.emit('joinAdminRoom');
        console.log('Joined admin room');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Re-join rooms when user changes
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('joinRoom', user.id);
      
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        socket.emit('joinAdminRoom');
      }
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 