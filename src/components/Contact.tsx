import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock, Heart } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contacto" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nuestro equipo está disponible para resolver todas tus dudas sobre 
            DogCatify y ayudarte a brindar el mejor cuidado a tus mascotas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Información de Contacto
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-teal-100 rounded-lg p-3">
                    <Mail className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">info@dogcatify.com</p>
                    <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-teal-100 rounded-lg p-3">
                    <Phone className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Teléfono</h4>
                    <p className="text-gray-600">*598 92519111</p>
                    <p className="text-sm text-gray-500">Lunes a Viernes 9:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-teal-100 rounded-lg p-3">
                    <MessageCircle className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Soporte en la App</h4>
                    <p className="text-gray-600">Chat en vivo disponible</p>
                    <p className="text-sm text-gray-500">Soporte 24/7 para emergencias</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-teal-100 rounded-lg p-3">
                    <Clock className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Horarios de Atención</h4>
                    <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
                    <p className="text-gray-600">Sábados: 9:00 - 14:00</p>
                    <p className="text-sm text-gray-500">Emergencias veterinarias 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="bg-teal-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h4>
              <div className="space-y-3">
                <a href="#" className="block text-teal-600 hover:text-teal-700 transition-colors">
                  ¿Cómo registro a mi mascota?
                </a>
                <a href="#" className="block text-teal-600 hover:text-teal-700 transition-colors">
                  ¿Los veterinarios están certificados?
                </a>
                <a href="#" className="block text-teal-600 hover:text-teal-700 transition-colors">
                  ¿Cómo funciona la tienda online?
                </a>
                <a href="#" className="block text-teal-600 hover:text-teal-700 transition-colors">
                  ¿Hay costo por usar la app?
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Envíanos un mensaje
            </h3>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option>Consulta general</option>
                  <option>Soporte técnico</option>
                  <option>Servicios veterinarios</option>
                  <option>Alianzas comerciales</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white">
            <Heart className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para cuidar mejor a tu mascota?
            </h3>
            <p className="text-xl mb-6 text-teal-100">
              Descarga DogCatify y comienza a brindar el mejor cuidado hoy mismo
            </p>
            <button className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
              Descargar Gratis
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;