import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import '../styles/CTA.css';

function CTA() {
  const navigate = useNavigate();

  const handleStartAnalyzing = () => {
    navigate('/register');
  };

  return (
    <section className="cta">
      <div className="cta-container">
        <motion.div 
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cta-badge">
            <Sparkles size={20} />
            AI-Powered Intelligence
          </div>
          <h2 className="cta-title">
            Transform Business Intelligence with AI
          </h2>
          <p className="cta-description">
            Join the future of business analysis. Get comprehensive insights, trust scores, 
            and risk assessments powered by artificial intelligence.
          </p>
          <motion.button 
            className="cta-button"
            onClick={handleStartAnalyzing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Analyzing Companies
            <ArrowRight size={20} />
          </motion.button>
          <p className="cta-note">
            Free demo available • No credit card required • Instant access
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;