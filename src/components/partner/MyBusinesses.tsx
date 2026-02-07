import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Store, Plus, MapPin, Eye } from 'lucide-react';
import BusinessServices from './BusinessServices';

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  description: string;
  is_active: boolean;
  image_url: string | null;
  images: string[] | null;
}

const MyBusinesses = () => {
  const { profile } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadPartnerData();
    }
  }, [profile]);

  const loadPartnerData = async () => {
    if (!profile?.id) return;

    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (partner) {
        setPartnerId(partner.id);
        loadPlaces(partner.id);
      } else {
        console.error('No partner found for user');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      setLoading(false);
    }
  };

  const loadPlaces = async (partnerIdToLoad: string) => {
    if (!partnerIdToLoad) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('partner_id', partnerIdToLoad)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlaces(data || []);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedPlace) {
    return (
      <BusinessServices
        place={selectedPlace}
        partnerId={partnerId!}
        onBack={() => setSelectedPlace(null)}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-12">Cargando negocios...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Negocios</h2>
          <p className="text-gray-600 mt-1">Gestiona tus negocios y sus servicios</p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Agregar Negocio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place) => (
          <div key={place.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {(place.image_url || (place.images && place.images.length > 0)) && (
              <img
                src={place.image_url || place.images![0]}
                alt={place.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg text-gray-800">{place.name}</h4>
                {place.is_active ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactivo</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2 capitalize">{place.category}</p>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{place.description}</p>
              {place.address && (
                <div className="flex items-start text-sm text-gray-500 mb-3">
                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{place.address}</span>
                </div>
              )}
              <button
                onClick={() => setSelectedPlace(place)}
                className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Servicios
              </button>
            </div>
          </div>
        ))}
      </div>

      {places.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes negocios registrados</h3>
          <p className="text-gray-500 mb-4">Comienza agregando tu primer negocio</p>
          <button className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Agregar Negocio
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBusinesses;
