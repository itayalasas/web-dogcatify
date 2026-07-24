import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './subscription-return.css';

export default function SubscriptionReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = String(
    params.get('subscription_status') || params.get('status') || 'pending',
  ).toLowerCase();
  const message = params.get('subscription_message') || params.get('message');
  const success = status === 'active' || status === 'trialing' || status === 'approved';
  const failed = ['cancelled', 'expired', 'rejected', 'failure', 'failed'].includes(status);

  const Icon = success ? CheckCircle : failed ? XCircle : Clock;
  const title = success
    ? 'Suscripción actualizada'
    : failed
      ? 'No se completó la suscripción'
      : 'Estamos verificando tu suscripción';
  const copy =
    message ||
    (success
      ? 'Tu plan quedó disponible para todos los negocios verificados de la cuenta.'
      : failed
        ? 'Puedes volver al portal para revisar el plan o intentar nuevamente.'
        : 'Mercado Pago todavía está procesando la operación. El estado se actualizará automáticamente.');

  return (
    <main className="subscription-return-page">
      <section className={success ? 'success' : failed ? 'failed' : 'pending'}>
        <Icon />
        <p>DogCatiFy para aliados</p>
        <h1>{title}</h1>
        <span>{copy}</span>
        <button onClick={() => navigate('/dashboard?section=subscription')}>
          Volver a mi suscripción
        </button>
      </section>
    </main>
  );
}
