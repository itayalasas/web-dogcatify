import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Key, Clock, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';

interface UserWithRole {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
}

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
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'settings'>('users');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification, NotificationContainer } = useNotification();

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'logs') {
      loadActivityLogs();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profilesData || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      showNotification('success', 'Rol actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating role:', error);
      showNotification('error', 'Error al actualizar el rol');
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { class: string; label: string }> = {
      admin: { class: 'bg-red-100 text-red-800', label: 'Administrador' },
      partner: { class: 'bg-blue-100 text-blue-800', label: 'Partner' },
      user: { class: 'bg-gray-100 text-gray-800', label: 'Usuario' }
    };

    const roleInfo = roles[role] || roles.user;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${roleInfo.class}`}>
        {roleInfo.label}
      </span>
    );
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(log =>
    log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-5 w-5" />
              Usuarios y Roles
            </button>
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

        {activeTab === 'users' && (
          <div>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar usuarios por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                              <Users className="h-4 w-4 text-teal-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Nunca'}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="user">Usuario</option>
                            <option value="partner">Partner</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar en logs de actividad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

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
                    {filteredLogs.map((log) => (
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

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No se encontraron registros' : 'No hay registros de actividad'}
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
