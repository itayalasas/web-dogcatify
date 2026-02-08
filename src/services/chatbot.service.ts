import { supabase } from '../lib/supabase';

export interface ChatbotConversation {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  status: 'bot' | 'waiting_agent' | 'with_agent' | 'resolved' | 'abandoned';
  assigned_agent_id?: string;
  started_at: string;
  ended_at?: string;
  last_message_at: string;
  rating?: number;
  metadata?: any;
}

export interface ChatbotMessage {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'bot' | 'agent';
  sender_id?: string;
  message: string;
  created_at: string;
  read_at?: string;
  metadata?: any;
}

export const chatbotService = {
  async createConversation(data?: { visitor_name?: string; visitor_email?: string }): Promise<ChatbotConversation | null> {
    const { data: conversation, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        visitor_name: data?.visitor_name,
        visitor_email: data?.visitor_email,
        status: 'bot',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return conversation;
  },

  async sendMessage(conversationId: string, message: string, senderType: 'visitor' | 'bot' | 'agent', senderId?: string): Promise<ChatbotMessage | null> {
    const { data: newMessage, error } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return newMessage;
  },

  async getMessages(conversationId: string): Promise<ChatbotMessage[]> {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  async requestAgent(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chatbot_conversations')
      .update({ status: 'waiting_agent' })
      .eq('id', conversationId);

    if (error) {
      console.error('Error requesting agent:', error);
      return false;
    }

    return true;
  },

  async assignAgent(conversationId: string, agentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chatbot_conversations')
      .update({
        status: 'with_agent',
        assigned_agent_id: agentId,
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error assigning agent:', error);
      return false;
    }

    return true;
  },

  async resolveConversation(conversationId: string, rating?: number): Promise<boolean> {
    const { error } = await supabase
      .from('chatbot_conversations')
      .update({
        status: 'resolved',
        ended_at: new Date().toISOString(),
        rating,
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error resolving conversation:', error);
      return false;
    }

    return true;
  },

  async getActiveConversations(status?: string): Promise<ChatbotConversation[]> {
    let query = supabase
      .from('chatbot_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['waiting_agent', 'with_agent']);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  async getConversation(conversationId: string): Promise<ChatbotConversation | null> {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  },

  subscribeToMessages(conversationId: string, callback: (message: ChatbotMessage) => void) {
    const channel = supabase
      .channel(`chatbot_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatbotMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToConversations(callback: (conversation: ChatbotConversation) => void) {
    const channel = supabase
      .channel('chatbot_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_conversations',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as ChatbotConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async markMessagesAsRead(conversationId: string, beforeTimestamp: string): Promise<boolean> {
    const { error } = await supabase
      .from('chatbot_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .lte('created_at', beforeTimestamp);

    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }

    return true;
  },
};
