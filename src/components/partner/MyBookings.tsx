import React, { useState, useEffect } from 'react';
import { partnerBookingsService } from '../../services/partner.service';
import { Booking } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const MyBookings = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);

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
        loadBookings(partner.id);
      } else {
        console.error('No partner found for user');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      setLoading(false);
    }
  };

  const loadBookings = async (partnerIdToLoad?: string) => {
    const idToUse = partnerIdToLoad || partnerId;
    if (!idToUse) return;

    try {
      setLoading(true);
      const data = await partnerBookingsService.getMyBookings(idToUse);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await partnerBookingsService.updateStatus(id, status);
      loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error al actualizar la cita');
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { icon: any; class: string; label: string }> = {
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      confirmed: { icon: CheckCircle, class: 'bg-blue-100 text-blue-800', label: 'Confirmado' },
      in_progress: { icon: AlertCircle, class: 'bg-purple-100 text-purple-800', label: 'En Progreso' },
      completed: { icon: CheckCircle, class: 'bg-green-100 text-green-800', label: 'Completado' },
      cancelled: { icon: XCircle, class: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };

    const statusInfo = statuses[status] || statuses.pending;
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusInfo.class}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Cargando citas...</div>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mascota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-gray-900">{new Date(booking.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{booking.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.customer_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{booking.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.pet_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.service_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${booking.total_amount?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={booking.status}
                      onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tienes citas registradas
        </div>
      )}
    </div>
  );
};

export default MyBookings;
