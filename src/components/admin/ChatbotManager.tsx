import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Clock, CheckCircle, X, User } from 'lucide-react';
import { chatbotService, ChatbotConversation, ChatbotMessage } from '../../services/chatbot.service';
import { useAuth } from '../../contexts/AuthContext';

const ChatbotManager = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const unsubscribe = chatbotService.subscribeToConversations((conversation) => {
      if (conversation.status === 'waiting_agent' || conversation.status === 'with_agent') {
        setConversations(prev => {
          const existing = prev.find(c => c.id === conversation.id);
          if (existing) {
            return prev.map(c => c.id === conversation.id ? conversation : c);
          }
          return [conversation, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const unsubscribe = chatbotService.subscribeToMessages(selectedConversation.id, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    const data = await chatbotService.getActiveConversations();
    setConversations(data);
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const data = await chatbotService.getMessages(conversationId);
    setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTakeConversation = async (conversation: ChatbotConversation) => {
    if (!user) return;

    await chatbotService.assignAgent(conversation.id, user.id);
    setSelectedConversation({ ...conversation, status: 'with_agent', assigned_agent_id: user.id });
    await loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || !user) return;

    const message = inputValue;
    setInputValue('');

    await chatbotService.sendMessage(selectedConversation.id, message, 'agent', user.id);
  };

  const handleResolveConversation = async () => {
    if (!selectedConversation) return;

    await chatbotService.resolveConversation(selectedConversation.id);
    setSelectedConversation(null);
    setMessages([]);
    loadConversations();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_agent':
        return <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">Esperando</span>;
      case 'with_agent':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">En curso</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Resuelto</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Bot</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4">
      <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Conversaciones del Chat
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay conversaciones activas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    if (conversation.status === 'waiting_agent') {
                      handleTakeConversation(conversation);
                    } else {
                      setSelectedConversation(conversation);
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {conversation.visitor_name || 'Visitante'}
                        </p>
                        {conversation.visitor_email && (
                          <p className="text-xs text-gray-500">{conversation.visitor_email}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(conversation.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(conversation.last_message_at).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">
                  {selectedConversation.visitor_name || 'Visitante'}
                </h3>
                <p className="text-teal-100 text-sm">
                  {selectedConversation.visitor_email || 'Sin email'}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedConversation.status === 'with_agent' && (
                  <button
                    onClick={handleResolveConversation}
                    className="bg-white text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolver
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                  className="text-white hover:bg-teal-700 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_type === 'visitor' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender_type === 'visitor'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : message.sender_type === 'agent'
                        ? 'bg-blue-600 text-white rounded-bl-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                    }`}
                  >
                    <p className="text-xs mb-1 font-semibold opacity-75">
                      {message.sender_type === 'visitor' ? 'Visitante' :
                       message.sender_type === 'agent' ? 'Agente' : 'Bot'}
                    </p>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(message.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedConversation.status === 'with_agent' && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Selecciona una conversación para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotManager;
