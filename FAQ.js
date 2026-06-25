import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import '../styles/FAQ.css';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does SCRUTINA use AI to analyze businesses?',
      answer: 'SCRUTINA uses advanced machine learning algorithms and natural language processing to aggregate data from thousands of sources, identify patterns, assess credibility, and generate comprehensive business intelligence reports automatically.'
    },
    {
      question: 'What makes the trust score accurate and reliable?',
      answer: 'Our trust scoring system analyzes 50+ data points including financial stability, customer reviews, regulatory compliance, market reputation, and historical performance. The AI model is trained on millions of verified business records.'
    },
    {
      question: 'How fast is the analysis compared to manual research?',
      answer: 'SCRUTINA completes comprehensive business analysis in under 2 minutes—a process that typically takes researchers 3-5 days manually. The AI processes data 10x faster while maintaining 95% accuracy.'
    },
    {
      question: 'What types of businesses can SCRUTINA analyze?',
      answer: 'SCRUTINA can analyze any registered business entity—from startups to Fortune 500 companies—across all industries. The AI adapts its analysis framework based on company size, industry, and available data.'
    },
    {
      question: 'How does the risk detection system work?',
      answer: 'Our AI continuously monitors financial indicators, regulatory filings, news sentiment, market trends, and operational data to identify potential risks. The system flags anomalies and provides early warnings before issues escalate.'
    },
    {
      question: 'Can SCRUTINA integrate with existing business tools?',
      answer: 'Yes, SCRUTINA provides API access and integrations with popular CRM, analytics, and business intelligence platforms. Our system is designed to fit seamlessly into existing workflows.'
    }
  ];

  return (
    <section className="faq" id="faq">
      <div className="faq-container">
        <motion.div 
          className="faq-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="faq-title">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="faq-description">
            Learn more about SCRUTINA's AI capabilities
          </p>
        </motion.div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                {openIndex === index ? <Minus size={24} /> : <Plus size={24} />}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
