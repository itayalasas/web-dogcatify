import React, { useState, useEffect } from 'react';
import { bookingsService, Booking } from '../../services/admin.service';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, Edit, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { supabase } from '../../lib/supabase';

const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { showNotification, NotificationContainer } = useNotification();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsService.getAll();
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(term) ||
        booking.customer_phone?.toLowerCase().includes(term) ||
        booking.customer_email?.toLowerCase().includes(term) ||
        booking.pet_name?.toLowerCase().includes(term) ||
        booking.service_name?.toLowerCase().includes(term) ||
        booking.partner_name?.toLowerCase().includes(term) ||
        booking.order_number?.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
      time: booking.time || '',
      status: booking.status || 'pending',
      notes: booking.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          date: formData.date,
          time: formData.time,
          status: formData.status,
          notes: formData.notes
        })
        .eq('id', editingBooking.id);

      if (error) throw error;

      setShowModal(false);
      await loadBookings();
      showNotification('success', 'Cita actualizada correctamente');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      showNotification('error', 'No se pudo actualizar la cita. Por favor, intente nuevamente.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await bookingsService.updateStatus(id, status);
      await loadBookings();
      showNotification('success', 'Estado de la cita actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      const errorMessage = error?.message || 'No se pudo actualizar el estado de la cita. Por favor, intente nuevamente.';
      showNotification('error', errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadBookings();
      showNotification('success', 'Cita eliminada correctamente');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      showNotification('error', 'No se pudo eliminar la cita. Por favor, intente nuevamente.');
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

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  return (
    <>
      <NotificationContainer />
      <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por cliente, mascota, servicio, partner, pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mascota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-gray-900">{booking.order_number || 'N/A'}</div>
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
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.partner_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${booking.total_amount?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(booking)}
                        className="p-1 bg-teal-50 text-teal-600 rounded hover:bg-teal-100 transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || statusFilter !== 'all' ? 'No se encontraron citas con ese criterio' : 'No hay citas registradas'}
        </div>
      )}

      {filteredBookings.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredBookings.length)} de {filteredBookings.length} citas
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Cita</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
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

export default BookingsManager;
