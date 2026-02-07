import React, { useState, useEffect } from 'react';
import { Shield, Activity, Key, Clock, AlertTriangle, CheckCircle, XCircle, Search, Bell, RefreshCw, Eye, X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { auditService, AuditLog } from '../../services/audit.service';
import { alertsService, AlertConfig, AlertThreshold } from '../../services/alerts.service';
import { supabase } from '../../lib/supabase';

interface SecuritySettings {
  mfa_enabled: boolean;
  detailed_logging: boolean;
  security_notifications: boolean;
  session_timeout: number;
}

const SecurityManager = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'settings' | 'alerts'>('logs');
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [testingAlert, setTestingAlert] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;
  const [settings, setSettings] = useState<SecuritySettings>({
    mfa_enabled: false,
    detailed_logging: true,
    security_notifications: true,
    session_timeout: 60
  });
  const { showNotification, NotificationContainer } = useNotification();

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.email, 'Error:', error);

      if (activeTab === 'logs') {
        await loadActivityLogs();
      } else if (activeTab === 'settings') {
        await loadSettings();
      } else if (activeTab === 'alerts') {
        await loadAlertConfig();
      }
    };

    checkSessionAndLoad();
  }, [activeTab]);

  const loadActivityLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * logsPerPage;

      console.log('Loading audit logs, page:', page, 'offset:', offset);

      const { data: logs, error, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + logsPerPage - 1);

      console.log('Audit logs response:', { logs: logs?.length, error, count });

      if (error) {
        console.error('RLS or query error:', error);
        throw error;
      }

      setActivityLogs(logs || []);
      setTotalLogs(count || 0);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error loading activity logs:', error);
      showNotification('error', `Error al cargar logs: ${error.message || 'Error desconocido'}`);
      setActivityLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['mfa_enabled', 'detailed_logging', 'security_notifications', 'session_timeout']);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj: any = { ...settings };
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      showNotification('success', 'Configuración guardada correctamente');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Error al guardar la configuración');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadActivityLogs(1);
      return;
    }

    try {
      setLoading(true);
      const logs = await auditService.searchLogs(searchTerm, 50);
      setActivityLogs(logs);
      setTotalLogs(logs.length);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching logs:', error);
      showNotification('error', 'Error al buscar logs');
    } finally {
      setLoading(false);
    }
  };

  const loadAlertConfig = async () => {
    try {
      setLoading(true);
      const config = await alertsService.getAlertConfig();
      setAlertConfig(config);
    } catch (error) {
      console.error('Error loading alert config:', error);
      showNotification('error', 'Error al cargar configuración de alertas');
    } finally {
      setLoading(false);
    }
  };

  const saveAlertConfig = async () => {
    if (!alertConfig) return;

    try {
      await alertsService.saveAlertConfig(alertConfig);
      showNotification('success', 'Configuración de alertas guardada correctamente');
    } catch (error: any) {
      console.error('Error saving alert config:', error);
      showNotification('error', 'Error al guardar la configuración de alertas');
    }
  };

  const updateAlertThreshold = (alertType: string, updates: Partial<AlertThreshold>) => {
    if (!alertConfig) return;

    setAlertConfig({
      ...alertConfig,
      [alertType]: {
        ...alertConfig[alertType as keyof AlertConfig],
        ...updates
      }
    });
  };

  const testAlert = async (alertType: string) => {
    setTestingAlert(alertType);
    try {
      const result = await alertsService.manualCheck(alertType);
      console.log('Test Alert Result:', result);

      if (result.triggered) {
        showNotification('success', result.message);
        if (result.details) {
          console.log('Detalles de la alerta:', result.details);
        }
      } else {
        showNotification('warning', result.message);
        if (result.details) {
          console.log('Detalles:', result.details);
        }
      }
    } catch (error: any) {
      console.error('Error testing alert:', error);
      showNotification('error', 'Error al probar la alerta: ' + error.message);
    } finally {
      setTestingAlert(null);
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
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="h-5 w-5" />
              Alertas
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
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por email, acción o recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Buscar
              </button>
              <button
                onClick={loadActivityLogs}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refrescar
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo/ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-gray-900">{new Date(log.created_at).toLocaleDateString('es-UY')}</div>
                              <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString('es-UY')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900">{log.user_email || 'Sistema'}</div>
                          {log.user_id && (
                            <div className="text-xs text-gray-500 font-mono">ID: {log.user_id.slice(0, 8)}...</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          </div>
                          {log.error_message && (
                            <div className="text-xs text-red-600 mt-1 truncate max-w-xs">{log.error_message}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900">{log.resource_type || 'N/A'}</div>
                          {log.resource_id && (
                            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">{log.resource_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {log.success ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-xs text-green-700 font-medium">Éxito</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span className="text-xs text-red-700 font-medium">Error</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {activityLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? (
                  'No se encontraron registros que coincidan con tu búsqueda'
                ) : loading ? (
                  'Cargando registros de auditoría...'
                ) : (
                  <div>
                    <p className="mb-2">No hay registros de auditoría disponibles</p>
                    <p className="text-sm text-gray-400">
                      Los registros se mostrarán aquí cuando se realicen acciones en el sistema
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Si crees que esto es un error, verifica la consola del navegador
                    </p>
                  </div>
                )}
              </div>
            )}

            {activityLogs.length > 0 && totalLogs > logsPerPage && !searchTerm && (
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * logsPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * logsPerPage, totalLogs)}</span> de{' '}
                    <span className="font-medium">{totalLogs}</span> registros
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadActivityLogs(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(totalLogs / logsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          if (Math.ceil(totalLogs / logsPerPage) <= 7) return true;
                          if (page === 1 || page === Math.ceil(totalLogs / logsPerPage)) return true;
                          if (Math.abs(page - currentPage) <= 2) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <React.Fragment key={`gap-${page}`}>
                                <span className="px-2 text-gray-500">...</span>
                                <button
                                  onClick={() => loadActivityLogs(page)}
                                  disabled={loading}
                                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                    currentPage === page
                                      ? 'bg-teal-600 text-white border-teal-600'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => loadActivityLogs(page)}
                              disabled={loading}
                              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                currentPage === page
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => loadActivityLogs(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalLogs / logsPerPage) || loading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Detalles del Log</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID del Log</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedLog.success ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Éxito</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Error</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha/Hora</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedLog.created_at).toLocaleString('es-UY', {
                        dateStyle: 'full',
                        timeStyle: 'medium'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Acción</label>
                    <p className="text-sm text-gray-900 font-semibold">{selectedLog.action}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuario Email</label>
                    <p className="text-sm text-gray-900">{selectedLog.user_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedLog.user_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Recurso</label>
                    <p className="text-sm text-gray-900">{selectedLog.resource_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID de Recurso</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedLog.resource_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección IP</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Agent</label>
                    <p className="text-sm text-gray-900 truncate" title={selectedLog.user_agent || 'N/A'}>
                      {selectedLog.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Mensaje de Error</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                    </div>
                  </div>
                )}

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detalles Adicionales</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && alertConfig && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Configuración de Alertas Automáticas</h3>
              <p className="text-sm text-gray-600 mb-4">
                Define umbrales para detectar anomalías y recibir notificaciones por email cuando se superen.
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(alertConfig).map(([key, threshold]) => (
                <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{threshold.alert_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          threshold.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          threshold.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          threshold.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {threshold.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {threshold.error_pattern ? `Patrón: ${threshold.error_pattern}` : 'Alerta general de actividad'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={threshold.enabled}
                        onChange={(e) => updateAlertThreshold(key, { enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Umbral de errores
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={threshold.threshold_count}
                        onChange={(e) => updateAlertThreshold(key, { threshold_count: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Número de errores para disparar la alerta</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ventana de tiempo (minutos)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={threshold.time_window_minutes}
                        onChange={(e) => updateAlertThreshold(key, { time_window_minutes: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tiempo en el que se cuentan los errores</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cooldown (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={threshold.cooldown_minutes}
                        onChange={(e) => updateAlertThreshold(key, { cooldown_minutes: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tiempo mínimo entre alertas del mismo tipo</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de notificación
                      </label>
                      <input
                        type="email"
                        value={threshold.notify_email}
                        onChange={(e) => updateAlertThreshold(key, { notify_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Destinatario de las alertas</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Alerta si hay <strong>{threshold.threshold_count}+ errores</strong> en <strong>{threshold.time_window_minutes} min</strong>
                    </div>
                    <button
                      onClick={() => testAlert(key)}
                      disabled={testingAlert === key || !threshold.enabled}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingAlert === key ? 'Probando...' : 'Probar Alerta'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <button
                onClick={saveAlertConfig}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Guardar Configuración de Alertas
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de Seguridad</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    Autenticación de dos factores
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Próximamente</span>
                  </h4>
                  <p className="text-sm text-gray-500">Requiere verificación adicional al iniciar sesión (no implementado aún)</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.mfa_enabled}
                    disabled
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Registro de actividad detallado</h4>
                  <p className="text-sm text-gray-500">Registra todas las acciones de los usuarios en la tabla audit_logs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.detailed_logging}
                    onChange={(e) => setSettings({ ...settings, detailed_logging: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-800">Notificaciones de seguridad</h4>
                  <p className="text-sm text-gray-500">Alertas por email ante actividad sospechosa</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.security_notifications}
                    onChange={(e) => setSettings({ ...settings, security_notifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h4 className="font-medium text-gray-800">Tiempo de sesión</h4>
                  <p className="text-sm text-gray-500">Duración máxima de la sesión de usuario (minutos)</p>
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                >
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="240">4 horas</option>
                  <option value="480">8 horas</option>
                  <option value="1440">24 horas</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
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
