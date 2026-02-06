import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-teal-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/logo-dogcatify.jpg" alt="DogCatify" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-teal-800">DogCatify</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-gray-700 hover:text-teal-600 transition-colors">Inicio</a>
            <a href="#caracteristicas" className="text-gray-700 hover:text-teal-600 transition-colors">Características</a>
            <a href="#servicios" className="text-gray-700 hover:text-teal-600 transition-colors">Servicios</a>
            <a href="#contacto" className="text-gray-700 hover:text-teal-600 transition-colors">Contacto</a>
            <Link 
              to="/privacidad"
              className="text-gray-700 hover:text-teal-600 transition-colors"
            >
              Privacidad
            </Link>
            <Link 
              to="/terminos"
              className="text-gray-700 hover:text-teal-600 transition-colors"
            >
              Términos
            </Link>
            <Link
              to="/login"
              className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <a href="#inicio" className="text-gray-700 hover:text-teal-600 transition-colors">Inicio</a>
              <a href="#caracteristicas" className="text-gray-700 hover:text-teal-600 transition-colors">Características</a>
              <a href="#servicios" className="text-gray-700 hover:text-teal-600 transition-colors">Servicios</a>
              <a href="#contacto" className="text-gray-700 hover:text-teal-600 transition-colors">Contacto</a>
              <Link 
                to="/privacidad"
                className="text-left text-gray-700 hover:text-teal-600 transition-colors"
              >
                Privacidad
              </Link>
              <Link 
                to="/terminos"
                className="text-left text-gray-700 hover:text-teal-600 transition-colors"
              >
                Términos
              </Link>
              <Link
                to="/login"
                className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition-colors w-fit text-center"
              >
                Iniciar Sesión
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;