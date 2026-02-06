import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, PawPrint, DollarSign, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  owner_id: string;
}

const ManualBooking = () => {
  const { user } = useAuth();
  const { showNotification, NotificationContainer } = useNotification();
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_id: '',
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    pet_id: '',
    pet_name: '',
    date: '',
    time: '',
    notes: '',
    payment_method: 'cash'
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_services')
        .select('*')
        .eq('partner_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      showNotification('error', 'No se pudieron cargar los servicios');
    }
  };

  const searchCustomer = async () => {
    if (!formData.customer_email) {
      showNotification('warning', 'Ingrese un email para buscar');
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, phone, email')
        .eq('email', formData.customer_email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setFormData({
          ...formData,
          customer_name: profile.display_name || '',
          customer_phone: profile.phone || ''
        });

        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_id', profile.id);

        if (petsError) throw petsError;
        setPets(petsData || []);
        showNotification('success', 'Cliente encontrado');
      } else {
        showNotification('info', 'Cliente no encontrado. Complete los datos manualmente.');
        setPets([]);
      }
    } catch (error: any) {
      console.error('Error searching customer:', error);
      showNotification('error', 'Error al buscar cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.service_id || !formData.date || !formData.time) {
        showNotification('error', 'Complete todos los campos obligatorios');
        return;
      }

      const selectedService = services.find(s => s.id === formData.service_id);
      if (!selectedService) {
        showNotification('error', 'Servicio no encontrado');
        return;
      }

      let customerId = null;
      let petId = null;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.customer_email)
        .maybeSingle();

      if (existingProfile) {
        customerId = existingProfile.id;

        if (formData.pet_id) {
          petId = formData.pet_id;
        } else if (formData.pet_name) {
          const { data: newPet, error: petError } = await supabase
            .from('pets')
            .insert({
              owner_id: customerId,
              name: formData.pet_name,
              species: 'dog'
            })
            .select()
            .single();

          if (petError) throw petError;
          petId = newPet.id;
        }
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: formData.customer_email,
          password: Math.random().toString(36).slice(-8),
          email_confirm: true
        });

        if (authError) throw authError;
        customerId = authUser.user.id;

        await supabase
          .from('profiles')
          .insert({
            id: customerId,
            email: formData.customer_email,
            display_name: formData.customer_name,
            phone: formData.customer_phone,
            is_owner: true
          });

        if (formData.pet_name) {
          const { data: newPet, error: petError } = await supabase
            .from('pets')
            .insert({
              owner_id: customerId,
              name: formData.pet_name,
              species: 'dog'
            })
            .select()
            .single();

          if (petError) throw petError;
          petId = newPet.id;
        }
      }

      if (!petId) {
        showNotification('error', 'Debe especificar una mascota');
        return;
      }

      const startTime = formData.time;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + (selectedService.duration || 60);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          partner_id: user?.id,
          service_id: formData.service_id,
          service_name: selectedService.name,
          service_duration: selectedService.duration,
          customer_id: customerId,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          pet_id: petId,
          pet_name: formData.pet_name || pets.find(p => p.id === formData.pet_id)?.name,
          date: formData.date,
          time: startTime,
          end_time: endTime,
          status: 'confirmed',
          total_amount: selectedService.price,
          payment_status: 'approved',
          payment_method: formData.payment_method,
          payment_confirmed_at: new Date().toISOString(),
          notes: formData.notes
        });

      if (bookingError) throw bookingError;

      showNotification('success', 'Cita agendada correctamente');

      setFormData({
        service_id: '',
        customer_email: '',
        customer_name: '',
        customer_phone: '',
        pet_id: '',
        pet_name: '',
        date: '',
        time: '',
        notes: '',
        payment_method: 'cash'
      });
      setPets([]);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      showNotification('error', error.message || 'Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NotificationContainer />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-800">Agendar Cita Manual</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="font-semibold text-teal-900 mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email del Cliente *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="cliente@ejemplo.com"
                    />
                    <button
                      type="button"
                      onClick={searchCustomer}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Información de la Mascota</h3>
              {pets.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Mascota *
                  </label>
                  <select
                    value={formData.pet_id}
                    onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Seleccione una mascota</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} - {pet.species} {pet.breed && `(${pet.breed})`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Mascota *
                  </label>
                  <input
                    type="text"
                    value={formData.pet_name}
                    onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Nombre de la mascota"
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Cita</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ${service.price} ({service.duration}min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Notas adicionales sobre la cita..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              {loading ? 'Agendando...' : 'Agendar Cita'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ManualBooking;
