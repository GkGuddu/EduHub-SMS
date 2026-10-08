import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  unreadCount: number;
  decrementUnread: () => void;
  resetUnread: () => void;
  latestNoticeAlert: string | null;
  clearNoticeAlert: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, updateUserPermissions } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestNoticeAlert, setLatestNoticeAlert] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_rooms', {
        schoolId: user.schoolId,
        userId: user._id,
        role: user.role,
      });
    });

    newSocket.on('new_notification', (data: any) => {
      setUnreadCount((prev) => prev + 1);
      if (data?.title) {
      }
    });

    newSocket.on('new_notice', (notice: any) => {
      setLatestNoticeAlert(notice.title || 'New announcement published');
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on('permissions_updated', (data: any) => {
      if (data.permissions) {
        updateUserPermissions(data.permissions);
        alert(data.message || 'Your system permissions have been updated.');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, user?.schoolId, user?.role]);

  const decrementUnread = () => setUnreadCount((prev) => Math.max(0, prev - 1));
  const resetUnread = () => setUnreadCount(0);
  const clearNoticeAlert = () => setLatestNoticeAlert(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        decrementUnread,
        resetUnread,
        latestNoticeAlert,
        clearNoticeAlert,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
