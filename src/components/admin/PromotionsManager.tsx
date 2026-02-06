import React, { useState, useEffect } from 'react';
import { promotionsService, Promotion } from '../../services/admin.service';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Eye, MousePointerClick, X, Save } from 'lucide-react';

const PromotionsManager = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    discount_percentage: '',
    cta_text: '',
    is_active: true
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionsService.getAll();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromotion) {
        await promotionsService.update(editingPromotion.id, {
          ...formData,
          discount_percentage: formData.discount_percentage ? Number(formData.discount_percentage) : null
        });
      } else {
        await promotionsService.create({
          ...formData,
          discount_percentage: formData.discount_percentage ? Number(formData.discount_percentage) : null
        });
      }
      setShowModal(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Error al guardar la promoción');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    try {
      await promotionsService.delete(id);
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Error al eliminar la promoción');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await promotionsService.toggleActive(id, !currentStatus);
      loadPromotions();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      alert('Error al cambiar el estado de la promoción');
    }
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      image_url: promotion.image_url || '',
      start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : '',
      end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : '',
      discount_percentage: promotion.discount_percentage?.toString() || '',
      cta_text: promotion.cta_text || '',
      is_active: promotion.is_active || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      start_date: '',
      end_date: '',
      discount_percentage: '',
      cta_text: '',
      is_active: true
    });
  };

  if (loading) {
    return <div className="text-center py-12">Cargando promociones...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Promociones Activas</h3>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Promoción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {promo.image_url && (
              <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg text-gray-800">{promo.title}</h4>
                {promo.is_active ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activa</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactiva</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-3">{promo.description}</p>
              {promo.discount_percentage && (
                <p className="text-teal-600 font-semibold mb-3">{promo.discount_percentage}% de descuento</p>
              )}
              <div className="text-xs text-gray-500 mb-3">
                <p>Desde: {new Date(promo.start_date).toLocaleDateString()}</p>
                <p>Hasta: {new Date(promo.end_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {promo.views || 0}
                </div>
                <div className="flex items-center">
                  <MousePointerClick className="h-4 w-4 mr-1" />
                  {promo.clicks || 0}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(promo)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleToggleActive(promo.id, promo.is_active || false)}
                  className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  {promo.is_active ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                  {promo.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: 50% de descuento en consultas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe la promoción..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Descuento
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: 20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del Botón (CTA)
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: Más información"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la Imagen
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Promoción activa
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManager;
