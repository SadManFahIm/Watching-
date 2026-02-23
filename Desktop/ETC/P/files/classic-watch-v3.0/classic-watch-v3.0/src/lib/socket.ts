import { io, Socket } from 'socket.io-client';
import config from '@/config';

let socket: Socket | null = null;

export const initializeSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(config.apiBaseUrl, {
      auth: {
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

// Notification events
export const subscribeToNotifications = (
  callback: (notification: any) => void
): void => {
  socket?.on('notification', callback);
};

export const unsubscribeFromNotifications = (): void => {
  socket?.off('notification');
};

// Order tracking events
export const subscribeToOrderUpdates = (
  orderId: string,
  callback: (update: any) => void
): void => {
  socket?.emit('subscribe:order', orderId);
  socket?.on(`order:${orderId}`, callback);
};

export const unsubscribeFromOrderUpdates = (orderId: string): void => {
  socket?.emit('unsubscribe:order', orderId);
  socket?.off(`order:${orderId}`);
};

// Live chat events
export const joinChatRoom = (roomId: string): void => {
  socket?.emit('join:chat', roomId);
};

export const leaveChatRoom = (roomId: string): void => {
  socket?.emit('leave:chat', roomId);
};

export const sendChatMessage = (roomId: string, message: string): void => {
  socket?.emit('chat:message', { roomId, message });
};

export const subscribeToChatMessages = (
  roomId: string,
  callback: (message: any) => void
): void => {
  socket?.on(`chat:${roomId}`, callback);
};

export const unsubscribeFromChatMessages = (roomId: string): void => {
  socket?.off(`chat:${roomId}`);
};

// Typing indicators
export const sendTypingIndicator = (roomId: string, isTyping: boolean): void => {
  socket?.emit('chat:typing', { roomId, isTyping });
};

export const subscribeToTypingIndicators = (
  roomId: string,
  callback: (data: any) => void
): void => {
  socket?.on(`chat:typing:${roomId}`, callback);
};

// Admin notifications
export const subscribeToAdminAlerts = (callback: (alert: any) => void): void => {
  socket?.on('admin:alert', callback);
};

// Stock updates
export const subscribeToStockUpdates = (
  productId: string,
  callback: (stock: number) => void
): void => {
  socket?.emit('subscribe:stock', productId);
  socket?.on(`stock:${productId}`, callback);
};

export const unsubscribeFromStockUpdates = (productId: string): void => {
  socket?.emit('unsubscribe:stock', productId);
  socket?.off(`stock:${productId}`);
};
