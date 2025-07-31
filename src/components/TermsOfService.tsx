import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Heart, Mail, Phone, Home, ArrowLeft, Shield, Users, Gavel } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-teal-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al inicio
            </Link>
            <div className="flex items-center space-x-3">
              <img src="/logo-dogcatify.jpg" alt="DogCatify" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-teal-800">DogCatify</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold text-teal-800 mb-4">Términos de Servicio</h1>
          <p className="text-xl text-teal-600 max-w-2xl mx-auto">
            Conoce los términos y condiciones que rigen el uso de DogCatify y 
            nuestros servicios para el cuidado integral de mascotas.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
                <Gavel className="h-6 w-6 mr-3 text-teal-500" />
                Aceptación de los Términos
              </h2>
              <div className="prose prose-teal max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Al descargar, instalar o utilizar la aplicación DogCatify, aceptas estar sujeto a estos 
                  Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, no debes 
                  utilizar nuestra aplicación o servicios.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Estos términos constituyen un acuerdo legal vinculante entre tú (el "Usuario") y 
                  DogCatify (la "Empresa") con respecto al uso de nuestra plataforma de gestión integral 
                  de mascotas.
                </p>
              </div>
            </section>

            {/* Services Description */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Descripción de los Servicios</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-teal-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Servicios Principales</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Gestión de perfiles de mascotas</li>
                    <li>• Historial médico y de salud</li>
                    <li>• Agenda de citas veterinarias</li>
                    <li>• Servicios de peluquería y baño</li>
                    <li>• Tienda online especializada</li>
                    <li>• Red de lugares pet-friendly</li>
                  </ul>
                </div>
                
                <div className="bg-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Servicios Adicionales</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Consultas veterinarias virtuales</li>
                    <li>• Recordatorios de medicamentos</li>
                    <li>• Galería de fotos de mascotas</li>
                    <li>• Red de profesionales aliados</li>
                    <li>• Soporte técnico especializado</li>
                    <li>• Actualizaciones de la aplicación</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* User Responsibilities */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Responsabilidades del Usuario</h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Uso Apropiado</h3>
                  <p className="text-gray-700">
                    Te comprometes a utilizar DogCatify únicamente para fines legítimos relacionados con 
                    el cuidado de mascotas. No debes usar la aplicación para actividades ilegales, 
                    fraudulentas o que puedan dañar a otros usuarios o mascotas.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Información Veraz</h3>
                  <p className="text-gray-700">
                    Debes proporcionar información precisa y actualizada sobre ti y tus mascotas. 
                    La información médica incorrecta puede afectar la calidad de los servicios 
                    veterinarios y el bienestar de tu mascota.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Seguridad de la Cuenta</h3>
                  <p className="text-gray-700">
                    Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. 
                    Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.
                  </p>
                </div>
              </div>
            </section>

            {/* Professional Services */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Servicios Profesionales</h2>
              
              <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800 mb-3">Servicios Veterinarios</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Los veterinarios son profesionales independientes</li>
                      <li>• DogCatify facilita la conexión, no presta servicios médicos</li>
                      <li>• Las decisiones médicas son responsabilidad del veterinario</li>
                      <li>• En emergencias, contacta servicios de urgencia locales</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800 mb-3">Otros Servicios</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Peluquerías y servicios de estética</li>
                      <li>• Servicios de cuidado y paseo</li>
                      <li>• Productos de la tienda online</li>
                      <li>• Lugares y establecimientos pet-friendly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Payments and Refunds */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Pagos y Reembolsos</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Pagos Seguros</h3>
                  <p className="text-sm text-gray-600">Procesamos pagos a través de plataformas seguras y certificadas</p>
                </div>
                
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Política de Reembolso</h3>
                  <p className="text-sm text-gray-600">Reembolsos según políticas específicas de cada servicio</p>
                </div>
                
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-teal-800 mb-2">Disputas</h3>
                  <p className="text-sm text-gray-600">Mediamos en disputas entre usuarios y proveedores de servicios</p>
                </div>
              </div>
            </section>

            {/* Limitations */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Limitaciones de Responsabilidad</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Importante</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• DogCatify no es responsable por servicios prestados por terceros</li>
                  <li>• No garantizamos la disponibilidad continua de la aplicación</li>
                  <li>• Los usuarios asumen riesgos al utilizar servicios de terceros</li>
                  <li>• En caso de emergencias médicas, contacta servicios de urgencia directamente</li>
                  <li>• La información en la app no reemplaza el consejo veterinario profesional</li>
                </ul>
              </div>
            </section>

            {/* Modifications */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Modificaciones de los Términos</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los cambios significativos serán notificados a través de:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Notificaciones dentro de la aplicación</li>
                  <li>• Correo electrónico a usuarios registrados</li>
                  <li>• Actualización de la fecha en esta página</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  El uso continuado de la aplicación después de las modificaciones constituye 
                  la aceptación de los nuevos términos.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-3 text-teal-500" />
                Contacto Legal
              </h2>
              
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg p-6 text-white">
                <p className="text-lg mb-6">
                  Para consultas legales, disputas o preguntas sobre estos términos de servicio:
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Email Legal</div>
                      <div className="text-teal-100">legal@dogcatify.com</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <div className="text-teal-100">*598 92519111</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Home className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Soporte</div>
                      <div className="text-teal-100">Soporte en la app</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Ley Aplicable</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">
                  Estos términos se rigen por las leyes de Uruguay. Cualquier disputa relacionada 
                  con estos términos será resuelta en los tribunales competentes de Uruguay. 
                  Si alguna disposición de estos términos es considerada inválida, las disposiciones 
                  restantes permanecerán en pleno vigor y efecto.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-teal-100 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <img src="/logo-dogcatify.jpg" alt="DogCatify" className="h-8 w-8 mr-3" />
            <span className="text-teal-800 font-semibold">DogCatify</span>
            <span className="text-gray-500 ml-2">- Términos de Servicio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;