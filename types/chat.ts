export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources: string[] | null;
}

export interface Chat {
  chat_id: string;
  user_id: string;
  server_id: string;
  channel_id: string;
  thread_id: string;
  messages: ChatMessage[];
  is_resolved: boolean;
  resolution_time: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ChatResponse {
  data: {
    chats: Chat[];
    pagination: PaginationInfo;
  };
}
