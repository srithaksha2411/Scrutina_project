import React from 'react';
import { motion } from 'framer-motion';
import { Search, Database, Brain, BarChart3, FileCheck } from 'lucide-react';
import '../styles/HowItWorks.css';

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      number: '01',
      title: 'Search a Business',
      description: 'Enter any company name or identifier to begin comprehensive AI analysis'
    },
    {
      icon: Database,
      number: '02',
      title: 'Collect Business Data',
      description: 'Collect business information from multiple trusted sources.'
    },
    {
      icon: Brain,
      number: '03',
      title: 'AI Analysis Engine',
      description: 'AI analyzes business information and generates insights.'
    },
    {
      icon: BarChart3,
      number: '04',
      title: 'Generate Trust & Risk Scores',
      description: 'Generate trust scores, risk assessments, and growth insights.'
    },
    {
      icon: FileCheck,
      number: '05',
      title: 'Deliver Actionable Insights',
      description: 'Receive comprehensive reports with strategic recommendations and next steps'
    }
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="hiw-container">
        <motion.div 
          className="hiw-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="hiw-title">
            How <span className="gradient-text">SCRUTINA</span> Works
          </h2>
          <p className="hiw-description">
            AI-powered intelligence in five simple steps
          </p>
        </motion.div>

        <div className="timeline">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="timeline-item"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="timeline-icon">
                <step.icon size={28} strokeWidth={2} />
              </div>
              <div className="timeline-content">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="timeline-line"></div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
