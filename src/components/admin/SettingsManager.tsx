import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/admin.service';
import { Save, DollarSign, Percent, CreditCard } from 'lucide-react';

interface SettingsState {
  default_commission: string;
  mercadopago_public_key: string;
  mercadopago_access_token: string;
  min_order_amount: string;
  shipping_base_cost: string;
  tax_rate: string;
}

const SettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    default_commission: '15',
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    min_order_amount: '0',
    shipping_base_cost: '0',
    tax_rate: '22'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsService.getAll();

      const newSettings: SettingsState = {
        default_commission: '15',
        mercadopago_public_key: '',
        mercadopago_access_token: '',
        min_order_amount: '0',
        shipping_base_cost: '0',
        tax_rate: '22'
      };

      allSettings.forEach((setting) => {
        if (setting.key in newSettings) {
          newSettings[setting.key as keyof SettingsState] = setting.value?.toString() || '';
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await Promise.all([
        settingsService.set('default_commission', parseFloat(settings.default_commission) || 15),
        settingsService.set('mercadopago_public_key', settings.mercadopago_public_key),
        settingsService.set('mercadopago_access_token', settings.mercadopago_access_token),
        settingsService.set('min_order_amount', parseFloat(settings.min_order_amount) || 0),
        settingsService.set('shipping_base_cost', parseFloat(settings.shipping_base_cost) || 0),
        settingsService.set('tax_rate', parseFloat(settings.tax_rate) || 0)
      ]);

      alert('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar las configuraciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando configuraciones...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Configuraciones del Sistema</h3>
        <p className="text-gray-600">
          Gestiona las configuraciones globales de la plataforma
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Percent className="h-6 w-6 text-teal-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">Comisiones y Pagos</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión por Defecto (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.default_commission}
                onChange={(e) => setSettings({ ...settings, default_commission: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="15"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comisión aplicada por defecto a nuevos partners
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IVA / Impuesto (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.tax_rate}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="22"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tasa de impuesto aplicada a las transacciones
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mínimo de Pedido ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.min_order_amount}
                onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Monto mínimo requerido para realizar un pedido
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Base de Envío ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.shipping_base_cost}
                onChange={(e) => setSettings({ ...settings, shipping_base_cost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Costo base de envío para pedidos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-teal-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">Integración MercadoPago</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key
              </label>
              <input
                type="text"
                value={settings.mercadopago_public_key}
                onChange={(e) => setSettings({ ...settings, mercadopago_public_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="mt-1 text-xs text-gray-500">
                Clave pública de MercadoPago para procesar pagos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={settings.mercadopago_access_token}
                onChange={(e) => setSettings({ ...settings, mercadopago_access_token: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="mt-1 text-xs text-gray-500">
                Token de acceso de MercadoPago para operaciones del servidor
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">Información Importante</h5>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Las credenciales de MercadoPago son sensibles y se almacenan de forma segura</li>
                <li>Usa las credenciales de producción para pagos reales</li>
                <li>Las credenciales de prueba solo funcionan en modo sandbox</li>
                <li>Puedes obtener tus credenciales en el panel de desarrolladores de MercadoPago</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-teal-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">Resumen de Configuración</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Comisión Default</p>
              <p className="text-2xl font-bold text-gray-800">{settings.default_commission}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">IVA / Impuesto</p>
              <p className="text-2xl font-bold text-gray-800">{settings.tax_rate}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Pedido Mínimo</p>
              <p className="text-2xl font-bold text-gray-800">${settings.min_order_amount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Envío Base</p>
              <p className="text-2xl font-bold text-gray-800">${settings.shipping_base_cost}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuraciones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
