import React, { useState, useEffect } from 'react';
import { partnersService, Partner } from '../../services/admin.service';
import { Store, Mail, Phone, MapPin, Star, CheckCircle, XCircle, ToggleLeft, ToggleRight, Edit2, DollarSign } from 'lucide-react';

const PartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnersService.getAll();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await partnersService.toggleActive(id, !currentStatus);
      loadPartners();
    } catch (error) {
      console.error('Error toggling partner:', error);
      alert('Error al cambiar el estado del partner');
    }
  };

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      await partnersService.toggleVerified(id, !currentStatus);
      loadPartners();
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Error al cambiar la verificación del partner');
    }
  };

  const startEditingCommission = (partner: Partner) => {
    setEditingCommission(partner.id);
    setCommissionValue((partner.commission_percentage || 0).toString());
  };

  const handleSaveCommission = async (id: string) => {
    try {
      const newCommission = parseFloat(commissionValue);
      if (isNaN(newCommission) || newCommission < 0 || newCommission > 100) {
        alert('La comisión debe ser un número entre 0 y 100');
        return;
      }
      await partnersService.updateCommission(id, newCommission);
      setEditingCommission(null);
      loadPartners();
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Error al actualizar la comisión');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando aliados...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Gestión de Aliados</h3>
        <p className="text-gray-600">
          Administra los partners, sus comisiones y estados de verificación
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negocio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {partner.logo ? (
                        <img src={partner.logo} alt={partner.business_name} className="h-10 w-10 rounded-full mr-3" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                          <Store className="h-5 w-5 text-teal-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{partner.business_name}</div>
                        <div className="text-xs text-gray-500">{partner.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                      {partner.business_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      {partner.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {partner.phone}
                        </div>
                      )}
                      {partner.address && (
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{partner.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm text-gray-900">{partner.rating?.toFixed(1) || 'N/A'}</span>
                      <span className="text-xs text-gray-500 ml-1">({partner.reviews_count || 0})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingCommission === partner.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600">%</span>
                        <button
                          onClick={() => handleSaveCommission(partner.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingCommission(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {partner.commission_percentage || 0}%
                        </span>
                        <button
                          onClick={() => startEditingCommission(partner)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {partner.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {partner.is_verified ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Sin verificar
                          </span>
                        )}
                      </div>
                      {partner.mercadopago_connected && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          <DollarSign className="h-3 w-3 mr-1" />
                          MP Conectado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(partner.id, partner.is_active || false)}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {partner.is_active ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                        {partner.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleToggleVerified(partner.id, partner.is_verified || false)}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        {partner.is_verified ? 'Quitar Verif.' : 'Verificar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {partners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay aliados registrados
        </div>
      )}
    </div>
  );
};

export default PartnersManager;
