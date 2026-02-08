import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy el asistente virtual de DogCatify. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickReplies = [
    '¿Qué servicios ofrecen?',
    '¿Cómo reservar?',
    'Horarios de atención',
    'Contacto',
  ];

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('servicio') || lowerMessage.includes('que hacen')) {
      return 'Ofrecemos servicios de veterinaria, peluquería, hotel y guardería para tus mascotas. ¿Te gustaría conocer más detalles sobre algún servicio específico?';
    }
    if (lowerMessage.includes('reservar') || lowerMessage.includes('cita') || lowerMessage.includes('turno')) {
      return 'Para reservar un servicio, puedes descargar nuestra app móvil o contactarnos directamente. ¿Prefieres que te ayude con el proceso?';
    }
    if (lowerMessage.includes('horario') || lowerMessage.includes('hora')) {
      return 'Nuestro horario de atención es de Lunes a Viernes de 9:00 a 18:00 y Sábados de 9:00 a 13:00. ¿Necesitas agendar en algún horario específico?';
    }
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuanto')) {
      return 'Los precios varían según el servicio y el tamaño de tu mascota. Te recomiendo contactar directamente con nosotros para un presupuesto personalizado.';
    }
    if (lowerMessage.includes('contacto') || lowerMessage.includes('telefono') || lowerMessage.includes('email')) {
      return 'Puedes contactarnos por email o revisar la sección de contacto en nuestra web. ¿Te gustaría que te redirija allí?';
    }
    if (lowerMessage.includes('app') || lowerMessage.includes('aplicacion') || lowerMessage.includes('descargar')) {
      return '¡Nuestra app está disponible para iOS y Android! Desde allí puedes reservar servicios, ver el historial de tu mascota y mucho más. ¿Te ayudo con la descarga?';
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return '¡Hola! Es un placer ayudarte. ¿En qué servicio estás interesado?';
    }
    if (lowerMessage.includes('gracias')) {
      return '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?';
    }

    return 'Gracias por tu mensaje. Para una atención más personalizada, te recomiendo contactar con nuestro equipo o descargar nuestra app móvil. ¿Puedo ayudarte con algo más?';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold">DogCatify Bot</h3>
                <p className="text-teal-100 text-xs">En línea</p>
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
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-teal-100' : 'text-gray-400'
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

          {messages.length <= 2 && (
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

          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
