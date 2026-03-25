import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_ENDPOINT || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Listen for notifications
    socket.on('notification', (data) => {
      toast.success(data.title, {
        description: data.message,
      });
    });

    // Listen for payment verification
    socket.on('payment_verified', (data) => {
      toast.success(`Order #${data.orderNumber} payment verified!`);
    });

    // Listen for payment rejection
    socket.on('payment_rejected', (data) => {
      toast.error(`Order #${data.orderNumber} payment rejected`);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isAuthenticated]);

  const joinRoom = useCallback((room) => {
    socketRef.current?.emit('join_room', room);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketRef.current?.emit('leave_room', room);
  }, []);

  const onEvent = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  const emitEvent = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    onEvent,
    emitEvent,
    isConnected: socketRef.current?.connected || false,
  };
};

export default useSocket;
