import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  subscribeToChatMessages,
  unsubscribeFromChatMessages,
  sendTypingIndicator,
  subscribeToTypingIndicators,
} from '@/lib/socket';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'support' | 'admin' | 'user';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
}

interface ChatStore {
  rooms: ChatRoom[];
  currentRoom: string | null;
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, string[]>;
  isConnected: boolean;

  // Actions
  initializeChat: (userId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
  markMessagesAsRead: (roomId: string) => void;
  loadChatHistory: (roomId: string) => Promise<void>;
  createSupportChat: () => Promise<string>;
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    rooms: [],
    currentRoom: null,
    messages: {},
    typingUsers: {},
    isConnected: false,

    initializeChat: (userId) => {
      set({ isConnected: true });
    },

    joinRoom: (roomId) => {
      joinChatRoom(roomId);
      set({ currentRoom: roomId });

      // Subscribe to messages
      subscribeToChatMessages(roomId, (message: ChatMessage) => {
        set((state) => {
          if (!state.messages[roomId]) {
            state.messages[roomId] = [];
          }
          state.messages[roomId].push(message);

          // Update room's last message and unread count
          const room = state.rooms.find((r) => r.id === roomId);
          if (room) {
            room.lastMessage = message;
            if (state.currentRoom !== roomId) {
              room.unreadCount++;
            }
          }
        });
      });

      // Subscribe to typing indicators
      subscribeToTypingIndicators(roomId, ({ userId, isTyping }) => {
        set((state) => {
          if (!state.typingUsers[roomId]) {
            state.typingUsers[roomId] = [];
          }

          if (isTyping) {
            if (!state.typingUsers[roomId].includes(userId)) {
              state.typingUsers[roomId].push(userId);
            }
          } else {
            state.typingUsers[roomId] = state.typingUsers[roomId].filter(
              (id) => id !== userId
            );
          }
        });
      });
    },

    leaveRoom: (roomId) => {
      leaveChatRoom(roomId);
      unsubscribeFromChatMessages(roomId);
      
      set((state) => {
        if (state.currentRoom === roomId) {
          state.currentRoom = null;
        }
      });
    },

    sendMessage: (roomId, message) => {
      sendChatMessage(roomId, message);

      // Optimistically add message
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        roomId,
        senderId: 'current-user', // Replace with actual user ID
        senderName: 'You',
        message,
        timestamp: new Date(),
        read: false,
      };

      set((state) => {
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        state.messages[roomId].push(newMessage);
      });
    },

    setTyping: (roomId, isTyping) => {
      sendTypingIndicator(roomId, isTyping);
    },

    markMessagesAsRead: (roomId) => {
      set((state) => {
        if (state.messages[roomId]) {
          state.messages[roomId].forEach((msg) => {
            msg.read = true;
          });
        }

        const room = state.rooms.find((r) => r.id === roomId);
        if (room) {
          room.unreadCount = 0;
        }
      });
    },

    loadChatHistory: async (roomId) => {
      try {
        const response = await fetch(`/api/chat/${roomId}/history`);
        const messages = await response.json();

        set((state) => {
          state.messages[roomId] = messages;
        });
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    },

    createSupportChat: async () => {
      try {
        const response = await fetch('/api/chat/support', {
          method: 'POST',
        });
        const data = await response.json();
        const roomId = data.roomId;

        const newRoom: ChatRoom = {
          id: roomId,
          name: 'Customer Support',
          type: 'support',
          participants: [],
          unreadCount: 0,
          isActive: true,
        };

        set((state) => {
          state.rooms.push(newRoom);
        });

        return roomId;
      } catch (error) {
        console.error('Error creating support chat:', error);
        throw error;
      }
    },
  }))
);

// Helper to get unread count across all rooms
export const getTotalUnreadCount = (): number => {
  const state = useChatStore.getState();
  return state.rooms.reduce((total, room) => total + room.unreadCount, 0);
};
