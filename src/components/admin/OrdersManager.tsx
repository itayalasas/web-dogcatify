import React, { useState, useEffect } from 'react';
import { ordersService, Order } from '../../services/admin.service';
import { ShoppingCart, DollarSign, CheckCircle, Clock, XCircle, AlertCircle, Search, ChevronLeft, ChevronRight, MoreVertical, RefreshCw } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { supabase } from '../../lib/supabase';

const ITEMS_PER_PAGE = 20;

const OrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const { showNotification, NotificationContainer } = useNotification();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = (order.order_number || order.id.slice(0, 8)).toLowerCase();
        const customerName = order.customer_name?.toLowerCase() || '';
        const customerEmail = order.customer_email?.toLowerCase() || '';
        const partnerName = order.partner_name?.toLowerCase() || '';
        const amount = order.total_amount?.toString() || '';
        const date = order.created_at ? new Date(order.created_at).toLocaleDateString('es-ES') : '';

        return orderNumber.includes(searchLower) ||
               customerName.includes(searchLower) ||
               customerEmail.includes(searchLower) ||
               partnerName.includes(searchLower) ||
               amount.includes(searchLower) ||
               date.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await ordersService.updateStatus(id, status);
      await loadOrders();
      showNotification('success', 'Estado del pedido actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating order:', error);
      const errorMessage = error?.message || 'No se pudo actualizar el estado del pedido. Por favor, verifique sus permisos e intente nuevamente.';
      showNotification('error', errorMessage);
    }
  };

  const handleResendToAccounting = async (orderId: string) => {
    setProcessingOrders(prev => new Set(prev).add(orderId));
    setOpenMenuId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-to-accounting`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al reenviar al sistema contable');
      }

      const result = await response.json();
      showNotification('success', 'Pedido reenviado al sistema contable correctamente');
      await loadOrders();
    } catch (error: any) {
      console.error('Error resending to accounting:', error);
      showNotification('error', error.message || 'Error al reenviar al sistema contable');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { icon: any; class: string; label: string }> = {
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      confirmed: { icon: CheckCircle, class: 'bg-blue-100 text-blue-800', label: 'Confirmado' },
      preparing: { icon: AlertCircle, class: 'bg-purple-100 text-purple-800', label: 'Preparando' },
      shipped: { icon: DollarSign, class: 'bg-indigo-100 text-indigo-800', label: 'Enviado' },
      delivered: { icon: CheckCircle, class: 'bg-green-100 text-green-800', label: 'Entregado' },
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

  const getPaymentBadge = (status: string | null) => {
    if (!status) return null;

    const paymentStatuses: Record<string, { class: string; label: string }> = {
      pending: { class: 'bg-yellow-100 text-yellow-800', label: 'Pago Pendiente' },
      approved: { class: 'bg-green-100 text-green-800', label: 'Pagado' },
      rejected: { class: 'bg-red-100 text-red-800', label: 'Rechazado' }
    };

    const statusInfo = paymentStatuses[status] || { class: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return <div className="text-center py-12">Cargando pedidos...</div>;
  }

  return (
    <>
      <NotificationContainer />
      <div>
      <div className="mb-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente, partner, monto o fecha..."
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
          <option value="preparing">Preparando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">#{order.order_number || order.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.customer_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.partner_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${order.total_amount?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">{getPaymentBadge(order.payment_status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>

                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Más opciones"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>

                        {openMenuId === order.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              <button
                                onClick={() => handleResendToAccounting(order.id)}
                                disabled={processingOrders.has(order.id)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <RefreshCw className={`h-4 w-4 ${processingOrders.has(order.id) ? 'animate-spin' : ''}`} />
                                {processingOrders.has(order.id) ? 'Reenviando...' : 'Reenviar a Sistema Contable'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron pedidos
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} pedidos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-1 bg-gray-100 rounded-lg">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default OrdersManager;
