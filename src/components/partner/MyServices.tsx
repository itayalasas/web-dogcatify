import React, { useState, useEffect } from 'react';
import { partnerServicesService } from '../../services/partner.service';
import { PartnerService } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { Package, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';

const MyServices = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadServices();
    }
  }, [profile]);

  const loadServices = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await partnerServicesService.getMyServices(profile.id);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await partnerServicesService.toggleActive(id, !isActive);
      loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('Error al cambiar el estado del servicio');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando servicios...</div>;
  }

  return (
    <div>
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
              <p className="text-gray-600 text-sm mb-3">{service.description}</p>
              <div className="flex items-center justify-between mb-3">
                {service.price !== null && (
                  <div className="flex items-center text-teal-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {service.price}
                  </div>
                )}
                {service.duration && (
                  <span className="text-xs text-gray-500">{service.duration} min</span>
                )}
              </div>
              <button
                onClick={() => handleToggleActive(service.id, service.is_active || false)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
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
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tienes servicios registrados
        </div>
      )}
    </div>
  );
};

export default MyServices;
