import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, UserPlus } from 'lucide-react';
import { chatbotService, ChatbotMessage } from '../services/chatbot.service';

interface Message {
  id: string;
  text: string;
  sender: 'visitor' | 'bot' | 'agent';
  timestamp: Date;
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<'bot' | 'waiting_agent' | 'with_agent'>('bot');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = chatbotService.subscribeToMessages(conversationId, (newMessage) => {
        if (newMessage.sender_type === 'agent') {
          setMessages(prev => [...prev, {
            id: newMessage.id,
            text: newMessage.message,
            sender: 'agent',
            timestamp: new Date(newMessage.created_at),
          }]);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [conversationId]);

  const initializeConversation = async () => {
    const conversation = await chatbotService.createConversation();
    if (conversation) {
      setConversationId(conversation.id);
      setIsInitialized(true);

      const welcomeMessage: Message = {
        id: '1',
        text: '¡Hola! Soy Dotty, tu asistente virtual de DogCatify. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      await chatbotService.sendMessage(conversation.id, welcomeMessage.text, 'bot');
    }
  };

  const quickReplies = [
    '¿Qué servicios ofrecen?',
    '¿Cómo reservar?',
    'Horarios de atención',
    'Contacto',
  ];

  const getBotResponse = (userMessage: string): { text: string; needsAgent: boolean } => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('servicio') || lowerMessage.includes('que hacen')) {
      return {
        text: 'Ofrecemos servicios de veterinaria, peluquería, hotel y guardería para tus mascotas. ¿Te gustaría conocer más detalles sobre algún servicio específico?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('reservar') || lowerMessage.includes('cita') || lowerMessage.includes('turno')) {
      return {
        text: 'Para reservar un servicio, puedes descargar nuestra app móvil o contactarnos directamente. ¿Prefieres que te ayude con el proceso?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('horario') || lowerMessage.includes('hora')) {
      return {
        text: 'Nuestro horario de atención es de Lunes a Viernes de 9:00 a 18:00 y Sábados de 9:00 a 13:00. ¿Necesitas agendar en algún horario específico?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuanto')) {
      return {
        text: 'Los precios varían según el servicio y el tamaño de tu mascota. Para un presupuesto personalizado, ¿te gustaría hablar con uno de nuestros agentes?',
        needsAgent: true,
      };
    }
    if (lowerMessage.includes('contacto') || lowerMessage.includes('telefono') || lowerMessage.includes('email')) {
      return {
        text: 'Puedes contactarnos por email o revisar la sección de contacto en nuestra web. ¿Te gustaría que te redirija allí?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('app') || lowerMessage.includes('aplicacion') || lowerMessage.includes('descargar')) {
      return {
        text: '¡Nuestra app está disponible para iOS y Android! Desde allí puedes reservar servicios, ver el historial de tu mascota y mucho más. ¿Te ayudo con la descarga?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return {
        text: '¡Hola! Es un placer ayudarte. ¿En qué servicio estás interesado?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('gracias')) {
      return {
        text: '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?',
        needsAgent: false,
      };
    }
    if (lowerMessage.includes('agente') || lowerMessage.includes('persona') || lowerMessage.includes('humano') || lowerMessage.includes('operador')) {
      return {
        text: 'Entiendo que prefieres hablar con una persona. Voy a conectarte con uno de nuestros agentes. Por favor, espera un momento.',
        needsAgent: true,
      };
    }

    return {
      text: 'No estoy seguro de cómo ayudarte con eso. ¿Te gustaría hablar con uno de nuestros agentes para una atención más personalizada?',
      needsAgent: true,
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const messageText = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'visitor',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    await chatbotService.sendMessage(conversationId, messageText, 'visitor');

    if (conversationStatus === 'with_agent') {
      return;
    }

    setIsTyping(true);

    setTimeout(async () => {
      const response = getBotResponse(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      await chatbotService.sendMessage(conversationId, response.text, 'bot');

      if (response.needsAgent && conversationStatus === 'bot') {
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 2).toString(),
            text: '¿Te gustaría que conecte esta conversación con un agente de soporte?',
            sender: 'bot',
            timestamp: new Date(),
          }]);
        }, 500);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleRequestAgent = async () => {
    if (!conversationId) return;

    setConversationStatus('waiting_agent');
    await chatbotService.requestAgent(conversationId);

    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      text: 'He solicitado un agente para ti. Un miembro de nuestro equipo te atenderá en breve. Por favor, mantente en línea.',
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const handleQuickReply = (reply: string) => {
    setInputValue(reply);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src="/logo-dogcatify.jpg" alt="Dotty" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Dotty</h3>
                <p className="text-teal-100 text-xs">
                  {conversationStatus === 'bot' && 'En línea'}
                  {conversationStatus === 'waiting_agent' && 'Esperando agente...'}
                  {conversationStatus === 'with_agent' && 'Con agente'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-teal-700 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'visitor' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender === 'visitor'
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : message.sender === 'agent'
                      ? 'bg-blue-600 text-white rounded-bl-sm shadow-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  {message.sender === 'agent' && (
                    <p className="text-xs text-blue-100 mb-1 font-semibold">Agente</p>
                  )}
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'visitor' ? 'text-teal-100' :
                      message.sender === 'agent' ? 'text-blue-100' :
                      'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && conversationStatus === 'bot' && (
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Respuestas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors border border-teal-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationStatus === 'waiting_agent' && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
              <p className="text-xs text-amber-800 text-center">
                Un agente se conectará contigo pronto. Gracias por tu paciencia.
              </p>
            </div>
          )}

          {conversationStatus === 'with_agent' && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
              <p className="text-xs text-blue-800 text-center">
                Estás chateando con un agente de soporte
              </p>
            </div>
          )}

          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              {conversationStatus === 'bot' && (
                <button
                  onClick={handleRequestAgent}
                  className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  title="Hablar con un agente"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={conversationStatus === 'waiting_agent' ? 'Esperando agente...' : 'Escribe tu mensaje...'}
                disabled={conversationStatus === 'waiting_agent'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center group"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>
    </>
  );
};

export default FloatingChatbot;
