import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Home, Mail } from 'lucide-react';

const PaymentPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const externalRef = searchParams.get('external_reference');
    if (externalRef) {
      setOrderNumber(externalRef);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-amber-100 rounded-full p-4">
            <Clock className="h-16 w-16 text-amber-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Pago Pendiente
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Tu pago está siendo procesado
        </p>

        {orderNumber && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
            <p className="text-xl font-bold text-amber-700">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-3 mb-6 text-left">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Qué significa esto:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Tu pago está siendo verificado</li>
              <li>Puede tomar unos minutos u horas</li>
              <li>Te enviaremos un email cuando se confirme</li>
              <li>No es necesario volver a pagar</li>
            </ul>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Te mantendremos informado
              </p>
              <p className="text-xs text-gray-600">
                Recibirás un email cuando tu pago sea confirmado
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </button>

          <p className="text-xs text-gray-500">
            Si tienes dudas, contáctanos a soporte@dogcatify.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;
