import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Send, Trash2, Users, Store } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

const NotificationsManager = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta notificación?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error al eliminar la notificación');
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'partners':
        return <Store className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando notificaciones...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Sistema de Notificaciones</h3>
          <p className="text-xs text-blue-700">
            Las notificaciones programadas se envían automáticamente a través del sistema de push notifications de la app móvil.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{notification.title}</h3>
                  {notification.is_sent ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      <Send className="h-3 w-3 mr-1" />
                      Enviada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Programada
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-3">{notification.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {getAudienceIcon(notification.target_audience)}
                    <span className="capitalize">{notification.target_audience || 'Todos'}</span>
                  </div>
                  <div className="text-xs">
                    {notification.sent_at
                      ? `Enviada: ${new Date(notification.sent_at).toLocaleString()}`
                      : `Creada: ${new Date(notification.created_at).toLocaleString()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(notification.id)}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                title="Eliminar notificación"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay notificaciones programadas
        </div>
      )}
    </div>
  );
};

export default NotificationsManager;
