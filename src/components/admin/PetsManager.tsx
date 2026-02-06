import React, { useState, useEffect } from 'react';
import { petsService, Pet } from '../../services/admin.service';
import { PawPrint, Dog, Cat, Activity, Trash2, Edit, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';

const PetsManager = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, dogs: 0, cats: 0, others: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const { showNotification, NotificationContainer } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: '',
    weight: '',
    gender: 'male',
    is_neutered: false,
    has_chip: false,
    chip_number: ''
  });

  useEffect(() => {
    loadPets();
    loadStats();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsService.getAll();
      setPets(data);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await petsService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species || 'dog',
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      weight: pet.weight?.toString() || '',
      gender: pet.gender || 'male',
      is_neutered: pet.is_neutered || false,
      has_chip: pet.has_chip || false,
      chip_number: pet.chip_number || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPet) return;

    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          gender: formData.gender,
          is_neutered: formData.is_neutered,
          has_chip: formData.has_chip,
          chip_number: formData.has_chip ? formData.chip_number : null
        })
        .eq('id', editingPet.id);

      if (error) throw error;

      setShowModal(false);
      await loadPets();
      await loadStats();
      showNotification('success', 'Mascota actualizada correctamente');
    } catch (error: any) {
      console.error('Error updating pet:', error);
      showNotification('error', 'No se pudo actualizar la mascota. Por favor, intente nuevamente.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPets();
      await loadStats();
      showNotification('success', 'Mascota eliminada correctamente');
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      showNotification('error', 'No se pudo eliminar la mascota. Por favor, intente nuevamente.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando mascotas...</div>;
  }

  return (
    <>
      <NotificationContainer />
      <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Mascotas</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-600">Perros</p>
            <Dog className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.dogs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-600">Gatos</p>
            <Cat className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.cats}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Otros</p>
          <p className="text-2xl font-bold text-blue-600">{stats.others}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <PawPrint className="h-8 w-8 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{pet.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{pet.breed || 'Mestizo'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                    {pet.species === 'dog' ? '🐕 Perro' : pet.species === 'cat' ? '🐈 Gato' : pet.species}
                  </span>
                  {pet.gender && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {pet.gender === 'male' ? '♂' : '♀'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
              {pet.age !== null && (
                <div>Edad: {pet.age} {pet.age === 1 ? 'año' : 'años'}</div>
              )}
              {pet.weight !== null && (
                <div>Peso: {pet.weight} kg</div>
              )}
              {pet.is_neutered && (
                <div className="text-teal-600">✓ Esterilizado</div>
              )}
              {pet.has_chip && (
                <div className="text-blue-600">✓ Con microchip{pet.chip_number && `: ${pet.chip_number}`}</div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleEdit(pet)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-50 text-teal-600 rounded hover:bg-teal-100 transition-colors text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(pet.id, pet.name)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Mascota</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especie *</label>
                    <select
                      value={formData.species}
                      onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="dog">Perro</option>
                      <option value="cat">Gato</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="male">Macho</option>
                      <option value="female">Hembra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edad (años)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_neutered}
                      onChange={(e) => setFormData({ ...formData, is_neutered: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Esterilizado</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.has_chip}
                      onChange={(e) => setFormData({ ...formData, has_chip: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Tiene microchip</span>
                  </label>

                  {formData.has_chip && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Chip</label>
                      <input
                        type="text"
                        value={formData.chip_number}
                        onChange={(e) => setFormData({ ...formData, chip_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PetsManager;
