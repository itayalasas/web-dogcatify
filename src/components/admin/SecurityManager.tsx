import React, { useState, useEffect } from 'react';
import { Shield, Activity, Key, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  timestamp: string;
  ip_address?: string;
  success: boolean;
}

const SecurityManager = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'settings'>('logs');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification, NotificationContainer } = useNotification();

  useEffect(() => {
    if (activeTab === 'logs') {
      loadActivityLogs();
    }
  }, [activeTab]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      setActivityLogs([
        {
          id: '1',
          user_email: 'admin@dogcatify.com',
          action: 'LOGIN',
          resource: 'Dashboard',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          success: true
        },
        {
          id: '2',
          user_email: 'partner@example.com',
          action: 'UPDATE',
          resource: 'Booking #ORD-001',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '192.168.1.2',
          success: true
        },
        {
          id: '3',
          user_email: 'user@example.com',
          action: 'DELETE',
          resource: 'Product',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          ip_address: '192.168.1.3',
          success: false
        }
      ]);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <Key className="h-4 w-4 text-blue-600" />;
      case 'UPDATE':
        return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'DELETE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <>
      <NotificationContainer />
      <div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="h-5 w-5" />
              Registro de Actividad
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="h-5 w-5" />
              Configuración
            </button>
          </div>
        </div>

        {activeTab === 'logs' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.user_email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm text-gray-900">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.resource}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.ip_address || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {log.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {activityLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay registros de actividad
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Seguridad</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Autenticación de dos factores</h4>
                  <p className="text-sm text-gray-500">Requiere verificación adicional al iniciar sesión</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Registro de actividad detallado</h4>
                  <p className="text-sm text-gray-500">Registra todas las acciones de los usuarios</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Notificaciones de seguridad</h4>
                  <p className="text-sm text-gray-500">Alertas por email ante actividad sospechosa</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h4 className="font-medium text-gray-800">Tiempo de sesión</h4>
                  <p className="text-sm text-gray-500">Duración máxima de la sesión de usuario</p>
                </div>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="240">4 horas</option>
                  <option value="480">8 horas</option>
                  <option value="1440">24 horas</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SecurityManager;
