import { useState, useCallback } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationState {
  id: number;
  type: NotificationType;
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const NotificationContainer = () => (
    <>
      {notifications.map((notif, index) => (
        <div key={notif.id} style={{ top: `${16 + index * 80}px` }} className="fixed right-4 z-50">
          <Notification
            type={notif.type}
            message={notif.message}
            onClose={() => removeNotification(notif.id)}
          />
        </div>
      ))}
    </>
  );

  return {
    showNotification,
    NotificationContainer
  };
};
