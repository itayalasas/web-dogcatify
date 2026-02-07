import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface PlaceFormProps {
  partnerId: string;
  onClose: () => void;
}

const PlaceForm = ({ partnerId, onClose }: PlaceFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'veterinaria',
    address: '',
    phone: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('places')
        .insert([{
          partner_id: partnerId,
          name: formData.name,
          category: formData.category,
          address: formData.address,
          phone: formData.phone || null,
          description: formData.description,
          is_active: true,
          rating: 5
        }]);

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Error al guardar el negocio');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'veterinaria', label: 'Veterinaria' },
    { value: 'peluqueria', label: 'Peluquería' },
    { value: 'paseador', label: 'Paseador' },
    { value: 'guarderia', label: 'Guardería' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'tienda', label: 'Tienda' },
    { value: 'adiestramiento', label: 'Adiestramiento' }
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
            Agregar Nuevo Negocio
          </h2>
          <p className="text-gray-600 mt-1">
            Completa la información de tu negocio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del negocio *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Veterinaria San Martín, Peluquería Canina..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Av. 18 de Julio 1234, Montevideo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: +598 99 123 456"
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
              placeholder="Describe tu negocio y los servicios que ofreces..."
              rows={4}
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
              {loading ? 'Guardando...' : 'Guardar Negocio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceForm;
