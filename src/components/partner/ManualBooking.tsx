import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Mail, PawPrint, DollarSign, Plus, Search, X } from 'lucide-react';
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

interface CustomerProfile {
  id: string;
  email: string;
  display_name: string;
  phone: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const ManualBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification, NotificationContainer } = useNotification();
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CustomerProfile[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'phone' | 'name'>('email');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [formData, setFormData] = useState({
    service_id: '',
    customer_id: '',
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
    if (user?.id) {
      loadPartnerData();
    }
  }, [user?.id]);

  const loadPartnerData = async () => {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (partner) {
        setPartnerId(partner.id);
        loadServices(partner.id);
      } else {
        showNotification('error', 'No se encontró información del partner');
      }
    } catch (error: any) {
      console.error('Error loading partner data:', error);
      showNotification('error', 'Error al cargar datos del partner');
    }
  };

  const loadServices = async (partnerIdToLoad: string) => {
    try {
      if (!partnerIdToLoad) {
        console.error('No partner ID available');
        return;
      }

      console.log('Loading services for partner:', partnerIdToLoad);

      const { data, error } = await supabase
        .from('partner_services')
        .select('id, name, price, duration, category, is_active')
        .eq('partner_id', partnerIdToLoad)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error loading services:', error);
        throw error;
      }

      console.log('Services loaded:', data);
      setServices(data || []);

      if (!data || data.length === 0) {
        showNotification('warning', 'No tienes servicios activos disponibles para agendar citas.');
      } else {
        console.log(`${data.length} servicios cargados correctamente`);
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
      showNotification('error', 'Error al cargar servicios: ' + (error.message || 'Error desconocido'));
    }
  };

  const loadAvailableTimeSlots = async (date: string, serviceId: string) => {
    if (!date || !serviceId || !partnerId) return;

    try {
      const selectedService = services.find(s => s.id === serviceId);
      if (!selectedService) return;

      const selectedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();

      const { data: schedule, error: scheduleError } = await supabase
        .from('business_schedule')
        .select('start_time, end_time')
        .eq('partner_id', partnerId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      if (!schedule) {
        showNotification('warning', 'No hay horario configurado para este día');
        setAvailableTimeSlots([]);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('appointment_time, service_id')
        .eq('partner_id', partnerId)
        .eq('appointment_date', date + 'T00:00:00+00:00')
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      const serviceIds = [...new Set(ordersData?.map(o => o.service_id).filter(Boolean))];
      let servicesMap = new Map();

      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('partner_services')
          .select('id, duration')
          .in('id', serviceIds);

        servicesData?.forEach(s => {
          servicesMap.set(s.id, s.duration || 60);
        });
      }

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('time, end_time, service_duration')
        .eq('partner_id', partnerId)
        .eq('date', date)
        .neq('status', 'cancelled');

      if (bookingsError) throw bookingsError;

      const existingBookings = [
        ...(ordersData?.map(order => {
          const duration = servicesMap.get(order.service_id) || 60;
          const [hours, minutes] = order.appointment_time.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + duration;

          return {
            startMinutes,
            endMinutes,
            time: order.appointment_time
          };
        }) || []),
        ...(bookingsData?.map(booking => {
          const [hours, minutes] = booking.time.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const [endHours, endMinutes] = booking.end_time.split(':').map(Number);
          const endMinutesTotal = endHours * 60 + endMinutes;

          return {
            startMinutes,
            endMinutes: endMinutesTotal,
            time: booking.time
          };
        }) || [])
      ];

      const slots: TimeSlot[] = [];
      const serviceDuration = selectedService.duration || 60;

      const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (let currentMinutes = startMinutes; currentMinutes + serviceDuration <= endMinutes; currentMinutes += serviceDuration) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        const slotEndMinutes = currentMinutes + serviceDuration;

        const isAvailable = !existingBookings.some(booking => {
          return (
            (currentMinutes >= booking.startMinutes && currentMinutes < booking.endMinutes) ||
            (slotEndMinutes > booking.startMinutes && slotEndMinutes <= booking.endMinutes) ||
            (currentMinutes <= booking.startMinutes && slotEndMinutes >= booking.endMinutes)
          );
        });

        slots.push({
          time: timeStr,
          available: isAvailable
        });
      }

      setAvailableTimeSlots(slots);
    } catch (error: any) {
      console.error('Error loading time slots:', error);
      showNotification('error', 'Error al cargar horarios disponibles');
    }
  };

  useEffect(() => {
    if (formData.date && formData.service_id) {
      loadAvailableTimeSlots(formData.date, formData.service_id);
    }
  }, [formData.date, formData.service_id]);

  const searchCustomer = async () => {
    if (!searchTerm.trim()) {
      showNotification('warning', 'Ingrese un término de búsqueda');
      return;
    }

    try {
      let query = supabase
        .from('profiles')
        .select('id, display_name, phone, email');

      if (searchType === 'email') {
        query = query.ilike('email', `%${searchTerm}%`);
      } else if (searchType === 'phone') {
        query = query.ilike('phone', `%${searchTerm}%`);
      } else if (searchType === 'name') {
        query = query.ilike('display_name', `%${searchTerm}%`);
      }

      const { data: profiles, error: profileError } = await query.limit(10);

      if (profileError) throw profileError;

      if (profiles && profiles.length > 0) {
        setSearchResults(profiles);
        setShowSearchResults(true);
        showNotification('success', `${profiles.length} cliente(s) encontrado(s)`);
      } else {
        showNotification('info', 'Cliente no encontrado. Complete los datos manualmente.');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error: any) {
      console.error('Error searching customer:', error);
      showNotification('error', 'Error al buscar cliente');
    }
  };

  const selectCustomer = async (customer: CustomerProfile) => {
    setFormData({
      ...formData,
      customer_id: customer.id,
      customer_email: customer.email,
      customer_name: customer.display_name || '',
      customer_phone: customer.phone || ''
    });

    setSearchTerm('');
    setShowSearchResults(false);

    try {
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', customer.id);

      if (petsError) throw petsError;
      setPets(petsData || []);
    } catch (error: any) {
      console.error('Error loading pets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.service_id || !formData.date || !formData.time) {
        showNotification('error', 'Complete todos los campos obligatorios');
        setLoading(false);
        return;
      }

      if (!formData.customer_id && !formData.customer_email) {
        showNotification('error', 'Debe buscar y seleccionar un cliente primero');
        setLoading(false);
        return;
      }

      const selectedService = services.find(s => s.id === formData.service_id);
      if (!selectedService) {
        showNotification('error', 'Servicio no encontrado');
        setLoading(false);
        return;
      }

      let customerId = formData.customer_id;
      let petId = null;

      if (!customerId) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.customer_email)
          .maybeSingle();

        if (existingProfile) {
          customerId = existingProfile.id;
        } else {
          showNotification('error', 'Cliente no encontrado. Por favor, búsquelo primero usando el botón de búsqueda.');
          setLoading(false);
          return;
        }
      }

      if (customerId && formData.customer_phone) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', customerId)
          .maybeSingle();

        if (!currentProfile?.phone || currentProfile.phone !== formData.customer_phone) {
          await supabase
            .from('profiles')
            .update({ phone: formData.customer_phone })
            .eq('id', customerId);
        }
      }

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

      if (!petId) {
        showNotification('error', 'Debe seleccionar o crear una mascota');
        setLoading(false);
        return;
      }

      const startTime = formData.time;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + (selectedService.duration || 60);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      if (!partnerId) {
        showNotification('error', 'No se pudo identificar el partner');
        setLoading(false);
        return;
      }

      const isPaymentLink = formData.payment_method === 'payment_link';

      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          partner_id: partnerId,
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
          status: isPaymentLink ? 'pending' : 'confirmed',
          total_amount: selectedService.price,
          payment_status: isPaymentLink ? 'pending' : 'approved',
          payment_method: formData.payment_method,
          payment_confirmed_at: isPaymentLink ? null : new Date().toISOString(),
          notes: formData.notes
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      if (isPaymentLink) {
        const { data: { session } } = await supabase.auth.getSession();
        let paymentUrl = '';

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-link`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingId: newBooking.id,
                amount: selectedService.price,
                description: `${selectedService.name} - ${formData.customer_name}`,
                customerEmail: formData.customer_email,
                customerName: formData.customer_name,
              }),
            }
          );

          if (response.ok) {
            const paymentData = await response.json();
            paymentUrl = paymentData.initPoint;

            await supabase
              .from('bookings')
              .update({
                payment_link: paymentData.initPoint,
                payment_preference_id: paymentData.preferenceId,
              })
              .eq('id', newBooking.id);
          } else {
            const errorData = await response.json();
            console.error('Error creating payment link:', errorData);
            showNotification('warning', 'No se pudo generar el link de pago automáticamente');
          }
        } catch (paymentError) {
          console.error('Error creating payment link:', paymentError);
          showNotification('warning', 'No se pudo generar el link de pago automáticamente');
        }

        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + 1);
        const expiresFormatted = expiresDate.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const amountFormatted = selectedService.price.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const orderNumber = `RES-${String(newBooking.id).padStart(9, '0')}`;

        const emailPayload = {
          template_name: 'payment_link',
          recipient_email: formData.customer_email,
          order_id: newBooking.id.toString(),
          wait_for_invoice: false,
          data: {
            client_name: formData.customer_name,
            order_number: orderNumber,
            service_name: selectedService.name,
            amount: amountFormatted,
            currency: 'UYU',
            payment_url: paymentUrl || 'Pendiente de generar',
            expires_at: expiresFormatted,
            appointment_time: formData.time,
            support_email: 'soporte@dogcatify.com',
            year: new Date().getFullYear().toString()
          }
        };

        try {
          const emailResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailPayload),
            }
          );

          if (emailResponse.ok) {
            showNotification('success', 'Cita creada y email enviado al cliente');
          } else {
            showNotification('success', 'Cita creada (error al enviar email)');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          showNotification('success', 'Cita creada (error al enviar email)');
        }

        if (paymentUrl) {
          window.open(paymentUrl, '_blank');
        }

        setTimeout(() => {
          navigate('/partner/bookings');
        }, 2000);
      } else {
        showNotification('success', 'Cita agendada correctamente');

        setTimeout(() => {
          navigate('/partner/bookings');
        }, 2000);
      }

      setFormData({
        service_id: '',
        customer_id: '',
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
      setSearchResults([]);
      setSearchTerm('');
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Cliente
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'email' | 'phone' | 'name')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Teléfono</option>
                    <option value="name">Nombre</option>
                  </select>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchCustomer();
                      }
                    }}
                    placeholder={
                      searchType === 'email' ? 'cliente@ejemplo.com' :
                      searchType === 'phone' ? '099123456' :
                      'Nombre del cliente'
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={searchCustomer}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Buscar
                  </button>
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="bg-white border border-teal-300 rounded-lg mt-2 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b">
                        <span className="text-sm font-medium text-gray-700">
                          {searchResults.length} resultado(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSearchResults(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full text-left p-3 hover:bg-teal-50 rounded transition-colors mb-1"
                        >
                          <div className="font-medium text-gray-800">{customer.display_name}</div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    required
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
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
                    placeholder={!formData.customer_phone ? "Ingrese el teléfono del cliente" : ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {!formData.customer_phone && formData.customer_id && (
                    <p className="text-xs text-amber-600 mt-1">Este cliente no tiene teléfono registrado. Por favor ingrese uno.</p>
                  )}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios Disponibles *
                  </label>
                  {formData.date && formData.service_id ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-white border border-gray-200 rounded-lg">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setFormData({ ...formData, time: slot.time })}
                          disabled={!slot.available}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            formData.time === slot.time
                              ? 'bg-teal-600 text-white'
                              : slot.available
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      Seleccione un servicio y fecha para ver horarios disponibles
                    </div>
                  )}
                  {formData.time && (
                    <div className="mt-2 text-sm text-teal-600 font-medium">
                      Hora seleccionada: {formData.time}
                    </div>
                  )}
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
                    <option value="payment_link">Link de Pago</option>
                  </select>
                  {formData.payment_method === 'payment_link' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Se generará un link de pago de Mercado Pago y se enviará al cliente por email
                    </p>
                  )}
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
