import React, { useState, useEffect } from 'react';
import { placesService, Place } from '../../services/admin.service';
import { Plus, Edit, Trash2, MapPin, Phone, Star, X, Save } from 'lucide-react';

const CATEGORIES = [
  { value: 'park', label: 'Parque', icon: '🌳' },
  { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'store', label: 'Tienda', icon: '🏪' },
  { value: 'veterinary', label: 'Veterinaria', icon: '🏥' },
  { value: 'grooming', label: 'Peluquería', icon: '✂️' }
];

const PlacesManager = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'park',
    address: '',
    phone: '',
    rating: '5',
    description: '',
    pet_amenities: [] as string[],
    image_url: '',
    coordinates: { latitude: 0, longitude: 0 },
    is_active: true
  });

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const data = await placesService.getAll();
      setPlaces(data);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const placeData = {
        ...formData,
        rating: Number(formData.rating),
        coordinates: formData.coordinates.latitude && formData.coordinates.longitude ? formData.coordinates : null
      };

      if (editingPlace) {
        await placesService.update(editingPlace.id, placeData);
      } else {
        await placesService.create(placeData);
      }
      setShowModal(false);
      resetForm();
      loadPlaces();
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Error al guardar el lugar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lugar?')) return;
    try {
      await placesService.delete(id);
      loadPlaces();
    } catch (error) {
      console.error('Error deleting place:', error);
      alert('Error al eliminar el lugar');
    }
  };

  const openEditModal = (place: Place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      category: place.category,
      address: place.address,
      phone: place.phone || '',
      rating: place.rating?.toString() || '5',
      description: place.description,
      pet_amenities: place.pet_amenities || [],
      image_url: place.image_url || '',
      coordinates: place.coordinates || { latitude: 0, longitude: 0 },
      is_active: place.is_active || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPlace(null);
    setFormData({
      name: '',
      category: 'park',
      address: '',
      phone: '',
      rating: '5',
      description: '',
      pet_amenities: [],
      image_url: '',
      coordinates: { latitude: 0, longitude: 0 },
      is_active: true
    });
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || '📍';
  };

  if (loading) {
    return <div className="text-center py-12">Cargando lugares...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Lugares Pet-Friendly</h3>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Lugar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place) => (
          <div key={place.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {place.image_url && (
              <img src={place.image_url} alt={place.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(place.category)}</span>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800">{place.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{place.category}</p>
                  </div>
                </div>
                {place.is_active ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactivo</span>
                )}
              </div>

              <div className="flex items-center text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < (place.rating || 0) ? 'fill-current' : ''}`}
                  />
                ))}
                <span className="ml-1 text-sm text-gray-600">({place.rating || 0})</span>
              </div>

              <p className="text-gray-600 text-sm mb-3">{place.description}</p>

              <div className="space-y-2 mb-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{place.address}</span>
                </div>
                {place.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-xs">{place.phone}</span>
                  </div>
                )}
              </div>

              {place.pet_amenities && place.pet_amenities.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Servicios:</p>
                  <div className="flex flex-wrap gap-1">
                    {place.pet_amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {place.pet_amenities.length > 3 && (
                      <span className="text-xs text-gray-500">+{place.pet_amenities.length - 3} más</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(place)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(place.id)}
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
                  {editingPlace ? 'Editar Lugar' : 'Nuevo Lugar Pet-Friendly'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Lugar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: Parque Central Pet-Friendly"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`px-4 py-3 border rounded-lg text-sm transition-colors ${
                          formData.category === cat.value
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: Av. Principal 123, Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {[5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>{num} {'★'.repeat(num)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe por qué este lugar es pet-friendly..."
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
                      Latitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.coordinates.latitude || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates, latitude: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="-34.6037"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.coordinates.longitude || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates, longitude: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="-58.3816"
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
                    Lugar activo
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

export default PlacesManager;
