import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface Payment {
  id: string;
  order_id?: string;
  booking_id?: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  partner_name: string | null;
  customer_name: string | null;
  created_at: string;
  commission_amount: number | null;
  partner_amount: number | null;
}

const PaymentsManager = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalAmount: 0,
    commissionAmount: 0
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const [ordersResult, bookingsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, payment_status, payment_method, payment_id, partner_name, customer_name, created_at, commission_amount, partner_amount')
          .not('payment_status', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('bookings')
          .select('id, total_amount, payment_status, payment_method, payment_id, partner_name, customer_name, created_at, commission_amount, partner_amount')
          .not('payment_status', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const allPayments: Payment[] = [
        ...(ordersResult.data || []).map(p => ({ ...p, order_id: p.id, amount: p.total_amount })),
        ...(bookingsResult.data || []).map(p => ({ ...p, booking_id: p.id, amount: p.total_amount }))
      ];

      allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPayments(allPayments);

      const approved = allPayments.filter(p => p.payment_status === 'approved').length;
      const pending = allPayments.filter(p => p.payment_status === 'pending').length;
      const totalAmount = allPayments
        .filter(p => p.payment_status === 'approved')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const commissionAmount = allPayments
        .filter(p => p.payment_status === 'approved')
        .reduce((sum, p) => sum + (p.commission_amount || 0), 0);

      setStats({
        total: allPayments.length,
        approved,
        pending,
        totalAmount,
        commissionAmount
      });
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { icon: any; class: string; label: string }> = {
      approved: { icon: CheckCircle, class: 'bg-green-100 text-green-800', label: 'Aprobado' },
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      rejected: { icon: XCircle, class: 'bg-red-100 text-red-800', label: 'Rechazado' }
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
    return <div className="text-center py-12">Cargando pagos...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Transacciones</p>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Monto Total</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Comisiones</p>
            <DollarSign className="h-5 w-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-600">${stats.commissionAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Aprobados / Pendientes</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.approved} / {stats.pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Transacción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs text-gray-900 font-mono">
                    {payment.payment_id || payment.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{payment.customer_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{payment.partner_name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${payment.amount?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-teal-600">${(payment.commission_amount || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {payment.payment_method || 'N/A'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(payment.payment_status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay transacciones registradas
        </div>
      )}
    </div>
  );
};

export default PaymentsManager;
