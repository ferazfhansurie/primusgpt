import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import Markets from './components/Markets';
import HowItWorks from './components/HowItWorks';
import ImageCarousel from './components/ImageCarousel';
import BotDetails from './components/BotDetails';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import CTA from './components/CTA';
import LoadingScreen from './components/LoadingScreen';
import Register from './components/Register';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent scrolling during loading
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Home page component
  const HomePage = () => (
    <Layout>
      <Hero />
      <ImageCarousel />
      <Testimonials />
      <Stats />
      <Features />
      <Markets />
      <HowItWorks />
      <BotDetails />
      <Pricing />
      <CTA />
    </Layout>
  );

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
      </Routes>
    </>
  );
}

export default App;
