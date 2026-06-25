import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, AlertTriangle, Users, TrendingUp, BarChart3 } from 'lucide-react';
import '../styles/Features.css';

function Features() {
  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Trust Score',
      description: 'AI analyzes company information and generates trust ratings.'
    },
    {
      icon: Target,
      title: 'Automated SWOT Analysis',
      description: 'Artificial intelligence identifies strengths, weaknesses, opportunities, and threats automatically—no manual research required.'
    },
    {
      icon: AlertTriangle,
      title: 'Risk Detection Engine',
      description: 'AI identifies potential business risks and red flags.'
    },
    {
      icon: Users,
      title: 'Competitor Intelligence',
      description: 'Real-time competitive analysis powered by AI—track market positioning, strategies, and emerging threats automatically.'
    },
    {
      icon: TrendingUp,
      title: 'Growth Opportunity Analysis',
      description: 'Predictive AI models evaluate market expansion potential, growth trajectories, and strategic opportunities with precision.'
    },
    {
      icon: BarChart3,
      title: 'Market Research Insights',
      description: 'AI aggregates and analyzes industry trends, market data, and actionable intelligence from thousands of sources instantly.'
    }
  ];

  return (
    <section className="features" id="features">
      <div className="features-container">
        <motion.div 
          className="features-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="features-title">
            Why Choose <span className="gradient-text">SCRUTINA?</span>
          </h2>
          <p className="features-description">
            Powerful AI capabilities that transform business intelligence
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className="feature-icon">
                <feature.icon size={28} strokeWidth={2} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
