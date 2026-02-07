import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration: number | null;
  has_cost: boolean;
  cancellation_hours: number;
  iva_rate: number | null;
}

interface ServiceFormProps {
  placeId: string;
  partnerId: string;
  service: Service | null;
  onClose: () => void;
}

const ServiceForm = ({ placeId, partnerId, service, onClose }: ServiceFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'paseo_corto',
    has_cost: true,
    price: '',
    cancellation_hours: '24',
    iva_rate: '',
    duration: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || 'paseo_corto',
        has_cost: service.has_cost,
        price: service.price?.toString() || '',
        cancellation_hours: service.cancellation_hours?.toString() || '24',
        iva_rate: service.iva_rate?.toString() || '',
        duration: service.duration?.toString() || ''
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serviceData = {
        partner_id: partnerId,
        place_id: placeId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        has_cost: formData.has_cost,
        price: formData.has_cost ? parseFloat(formData.price) : 0,
        cancellation_hours: parseInt(formData.cancellation_hours),
        iva_rate: formData.iva_rate ? parseFloat(formData.iva_rate) : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        is_active: true,
        currency: 'UYU',
        currency_code_dgi: '858'
      };

      let error;

      if (service) {
        const { error: updateError } = await supabase
          .from('partner_services')
          .update(serviceData)
          .eq('id', service.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('partner_services')
          .insert([serviceData]);
        error = insertError;
      }

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'paseo_corto', label: 'Paseo corto' },
    { value: 'paseo_largo', label: 'Paseo largo' },
    { value: 'ejercicio', label: 'Ejercicio' },
    { value: 'cuidado', label: 'Cuidado' }
  ];

  return (
    <div>
      <button
        onClick={onClose}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Volver
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {service ? 'Editar Servicio' : 'Agregar Servicio de Paseo'}
          </h2>
          <p className="text-gray-600 mt-1">
            Completa la información del servicio que ofreces a tus clientes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del servicio *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Consulta general, Baño completo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe detalladamente el servicio..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-4 py-2 rounded-full border ${
                    formData.category === cat.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal-600'
                  } transition-colors`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">¿El servicio tiene costo?</div>
                <div className="text-sm text-gray-600">Desactiva esta opción si el servicio es gratuito</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_cost: !formData.has_cost })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  formData.has_cost ? 'bg-teal-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    formData.has_cost ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horas para cancelar cita *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                value={formData.cancellation_hours}
                onChange={(e) => setFormData({ ...formData, cancellation_hours: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <span className="mr-1">⏰</span>
              Tiempo mínimo (en horas) para que el cliente pueda cancelar la cita
            </p>
          </div>

          {formData.has_cost && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por hora *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    required={formData.has_cost}
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IVA % (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.iva_rate}
                    onChange={(e) => setFormData({ ...formData, iva_rate: e.target.value })}
                    placeholder="22"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="60"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Guardando...' : service ? 'Actualizar Servicio' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
