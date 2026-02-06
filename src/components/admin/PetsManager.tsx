import React, { useState, useEffect } from 'react';
import { petsService, Pet } from '../../services/admin.service';
import { PawPrint, Dog, Cat, Activity } from 'lucide-react';

const PetsManager = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, dogs: 0, cats: 0, others: 0 });

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

  if (loading) {
    return <div className="text-center py-12">Cargando mascotas...</div>;
  }

  return (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetsManager;
