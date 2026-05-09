import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface Conversation {
  peer: { id: number; name: string };
  last_message: { id: number; content: string; created_at: string; sender_id: number };
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
}

export const messagesApi = {
  conversations: () => api.get<ApiResponse<Conversation[]>>('/messages').then(unwrapData),
  messages: (peerId: number) =>
    api.get<ApiResponse<ChatMessage[]>>('/messages', { params: { peer_id: peerId } }).then(unwrapData),
  send: (receiver_id: number, content: string) =>
    api.post<ApiResponse<ChatMessage>>('/messages', { receiver_id, content }).then(unwrapData),
  markRead: (messageId: number) =>
    api.post<ApiResponse<unknown>>(`/messages/${messageId}/read`).then(unwrapData),
};
