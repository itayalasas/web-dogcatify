import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Store, Plus, MapPin, Eye } from 'lucide-react';
import BusinessServices from './BusinessServices';
import PlaceForm from './PlaceForm';

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
  const [showPlaceForm, setShowPlaceForm] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadPartnerData();
    }
  }, [profile]);

  const loadPartnerData = async () => {
    if (!profile?.id) return;

    try {
      console.log('Loading partner data for user:', profile.id);

      const { data: partner, error } = await supabase
        .from('partners')
        .select('id, business_name, business_type')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) {
        console.error('Error querying partners:', error);
        throw error;
      }

      console.log('Partner data:', partner);

      if (partner) {
        setPartnerId(partner.id);
        await loadPlaces(partner.id);
      } else {
        console.error('No partner found for user:', profile.id);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      setLoading(false);
    }
  };

  const loadPlaces = async (partnerIdToLoad: string) => {
    if (!partnerIdToLoad) {
      console.log('No partner ID provided');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading places for partner:', partnerIdToLoad);

      const { data, error, count } = await supabase
        .from('places')
        .select('*', { count: 'exact' })
        .eq('partner_id', partnerIdToLoad)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error querying places:', error);
        throw error;
      }

      console.log('Places found:', data?.length || 0, 'Total count:', count);
      console.log('Places data:', data);

      if (!data || data.length === 0) {
        await checkAndMigrateServices(partnerIdToLoad);
        return;
      }

      setPlaces(data || []);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndMigrateServices = async (partnerIdToLoad: string) => {
    try {
      console.log('Checking for services without place...');

      const { data: services, error: servicesError } = await supabase
        .from('partner_services')
        .select('id')
        .eq('partner_id', partnerIdToLoad)
        .is('place_id', null);

      if (servicesError) throw servicesError;

      if (services && services.length > 0) {
        console.log(`Found ${services.length} services without place. Creating default place...`);
        await createDefaultPlace(partnerIdToLoad);
      } else {
        console.log('No services without place found');
        setPlaces([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking services:', error);
      setPlaces([]);
      setLoading(false);
    }
  };

  const createDefaultPlace = async (partnerIdToLoad: string) => {
    try {
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('business_name, business_type, address, phone, description')
        .eq('id', partnerIdToLoad)
        .maybeSingle();

      if (partnerError) throw partnerError;
      if (!partner) {
        console.error('Partner not found');
        setLoading(false);
        return;
      }

      const categoryMap: Record<string, string> = {
        'walking': 'paseador',
        'veterinary': 'veterinaria',
        'grooming': 'peluqueria',
        'daycare': 'guarderia',
        'hotel': 'hotel',
        'store': 'tienda',
        'training': 'adiestramiento'
      };

      const category = categoryMap[partner.business_type] || 'paseador';

      const { data: newPlace, error: placeError } = await supabase
        .from('places')
        .insert([{
          partner_id: partnerIdToLoad,
          name: partner.business_name,
          category: category,
          address: partner.address || 'Dirección no especificada',
          phone: partner.phone,
          description: partner.description || '',
          is_active: true,
          rating: 5
        }])
        .select()
        .single();

      if (placeError) throw placeError;

      console.log('Default place created:', newPlace);

      const { error: updateError } = await supabase
        .from('partner_services')
        .update({ place_id: newPlace.id })
        .eq('partner_id', partnerIdToLoad)
        .is('place_id', null);

      if (updateError) throw updateError;

      console.log('Services migrated to new place');

      await loadPlaces(partnerIdToLoad);
    } catch (error) {
      console.error('Error creating default place:', error);
      setPlaces([]);
      setLoading(false);
    }
  };

  const handlePlaceFormClose = () => {
    setShowPlaceForm(false);
    if (partnerId) {
      loadPlaces(partnerId);
    }
  };

  if (showPlaceForm && partnerId) {
    return (
      <PlaceForm
        partnerId={partnerId}
        onClose={handlePlaceFormClose}
      />
    );
  }

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

  if (!partnerId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">No se encontró información de partner para este usuario</p>
        <p className="text-gray-500">Por favor contacta al administrador</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Negocios</h2>
          <p className="text-gray-600 mt-1">Gestiona tus negocios y sus servicios</p>
        </div>
        <button
          onClick={() => setShowPlaceForm(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
        >
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
          <button
            onClick={() => setShowPlaceForm(true)}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Negocio
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBusinesses;
