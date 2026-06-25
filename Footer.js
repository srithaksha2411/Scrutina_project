import React from 'react';
import { Zap, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <Zap size={32} strokeWidth={2.5} />
              <span>SCRUTINA</span>
            </div>
            <p className="footer-tagline">
              AI-powered business intelligence for smarter decisions
            </p>
            <div className="footer-social">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="mailto:contact@scrutina.ai" className="social-icon" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#careers">Careers</a>
            <a href="#blog">Blog</a>
          </div>

          <div className="footer-links">
            <h4>Resources</h4>
            <a href="#docs">Documentation</a>
            <a href="#help">Help Center</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#security">Security</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 SCRUTINA. All rights reserved.
          </p>
          <p className="footer-tagline-bottom">
            Built with precision for business intelligence
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
