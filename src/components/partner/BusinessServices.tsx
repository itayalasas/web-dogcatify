import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, DollarSign, Clock, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import ServiceForm from './ServiceForm';

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration: number | null;
  is_active: boolean;
  images: string[] | null;
  has_cost: boolean;
  cancellation_hours: number;
  iva_rate: number | null;
}

interface BusinessServicesProps {
  place: Place;
  partnerId: string;
  onBack: () => void;
}

const BusinessServices = ({ place, partnerId, onBack }: BusinessServicesProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, [place.id]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_services')
        .select('*')
        .eq('place_id', place.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_services')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('Error al cambiar el estado del servicio');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  };

  if (showForm) {
    return (
      <ServiceForm
        place={place}
        partnerId={partnerId}
        service={editingService}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a negocios
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{place.name}</h2>
            <p className="text-gray-600 mt-1">{place.description}</p>
            <p className="text-sm text-gray-500 mt-1">{place.address}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Servicio
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando servicios...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {service.images && service.images.length > 0 && (
                  <img src={service.images[0]} alt={service.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg text-gray-800">{service.name}</h4>
                    {service.is_active ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactivo</span>
                    )}
                  </div>
                  {service.category && (
                    <p className="text-xs text-gray-500 mb-2 capitalize">{service.category}</p>
                  )}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    {service.has_cost && service.price !== null && (
                      <div className="flex items-center text-teal-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {service.price}
                      </div>
                    )}
                    {!service.has_cost && (
                      <span className="text-green-600 text-sm font-medium">Gratuito</span>
                    )}
                    {service.duration && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration} min
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Cancelación: {service.cancellation_hours}h antes
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(service.id, service.is_active)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {service.is_active ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-2" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          Activar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No hay servicios registrados para este negocio</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Primer Servicio
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessServices;
