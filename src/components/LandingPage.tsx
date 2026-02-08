import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Services from './Services';
import Contact from './Contact';
import Footer from './Footer';
import FloatingChatbot from './FloatingChatbot';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Services />
      <Contact />
      <Footer />
      <FloatingChatbot />
    </div>
  );
};

export default LandingPage;