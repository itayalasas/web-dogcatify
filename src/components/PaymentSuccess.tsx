import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Calendar } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const externalRef = searchParams.get('external_reference');
    const paymentId = searchParams.get('payment_id');

    if (externalRef) {
      setOrderNumber(externalRef);
    }

    if (paymentId) {
      console.log('Payment confirmed:', paymentId);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-teal-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-teal-100 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-teal-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Pago Confirmado
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Tu pago ha sido procesado exitosamente
        </p>

        {orderNumber && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
            <p className="text-xl font-bold text-teal-700">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-left">
            <Calendar className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Reserva confirmada
              </p>
              <p className="text-xs text-gray-600">
                Recibirás un email con los detalles de tu cita
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </button>

          <p className="text-xs text-gray-500">
            Si tienes alguna consulta, contáctanos a soporte@dogcatify.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
