import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
    </main>
  );
}

export default Home;
