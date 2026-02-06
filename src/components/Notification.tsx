import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColor} border ${borderColor} rounded-lg shadow-lg p-4 min-w-80 max-w-md animate-slide-in`}>
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className={`${textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Notification;
