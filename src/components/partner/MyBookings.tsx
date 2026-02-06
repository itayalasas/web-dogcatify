import React, { useState, useEffect, useMemo } from 'react';
import { partnerBookingsService } from '../../services/partner.service';
import { Booking } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const MyBookings = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    orderNumber: '',
    date: '',
    customer: '',
    pet: '',
    service: '',
    amount: '',
    status: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesOrderNumber = !filters.orderNumber ||
        (booking as any).order_number?.toLowerCase().includes(filters.orderNumber.toLowerCase());

      const matchesDate = !filters.date ||
        new Date(booking.date).toLocaleDateString().includes(filters.date);

      const matchesCustomer = !filters.customer ||
        booking.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());

      const matchesPet = !filters.pet ||
        booking.pet_name?.toLowerCase().includes(filters.pet.toLowerCase());

      const matchesService = !filters.service ||
        booking.service_name?.toLowerCase().includes(filters.service.toLowerCase());

      const matchesAmount = !filters.amount ||
        booking.total_amount?.toString().includes(filters.amount);

      const matchesStatus = !filters.status ||
        booking.status === filters.status;

      return matchesOrderNumber && matchesDate && matchesCustomer && matchesPet &&
             matchesService && matchesAmount && matchesStatus;
    });
  }, [bookings, filters]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      orderNumber: '',
      date: '',
      customer: '',
      pet: '',
      service: '',
      amount: '',
      status: ''
    });
    setCurrentPage(1);
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Número de Pedido
            </label>
            <input
              type="text"
              value={filters.orderNumber}
              onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
              placeholder="ORD-20260206-001"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="text"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              placeholder="dd/mm/aaaa"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mascota
            </label>
            <input
              type="text"
              value={filters.pet}
              onChange={(e) => handleFilterChange('pet', e.target.value)}
              placeholder="Nombre de mascota"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <input
              type="text"
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              placeholder="Nombre del servicio"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Monto
            </label>
            <input
              type="text"
              value={filters.amount}
              onChange={(e) => handleFilterChange('amount', e.target.value)}
              placeholder="350"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Mostrando {paginatedBookings.length} de {filteredBookings.length} resultados
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Pedido</th>
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
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-gray-900">
                      {(booking as any).order_number || 'Pendiente'}
                    </div>
                  </td>
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

        {paginatedBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filteredBookings.length === 0 && bookings.length > 0
              ? 'No se encontraron resultados con los filtros aplicados'
              : 'No tienes citas registradas'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
