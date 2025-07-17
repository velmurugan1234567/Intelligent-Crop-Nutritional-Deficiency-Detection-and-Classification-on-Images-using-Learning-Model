import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer modern-footer fade-in">
  <div className="container">
    <div className="footer-top row">
      <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
        <h5 className="footer-brand">🌾 CropHealth AI</h5>
        <p className="footer-description">
          Deep learning-based tool for detecting nutritional deficiencies in rice crops.
        </p>
      </div>

      <div className="col-md-6 text-center text-md-end">
        <h5 className="footer-title">Quick Links</h5>
        <ul className="footer-links list-unstyled">
          <li><Link to="/" className="footer-link">Home</Link></li>
          <li><Link to="/upload" className="footer-link">Upload</Link></li>
          <li><Link to="/history" className="footer-link">History</Link></li>
        </ul>
      </div>
    </div>

    <hr className="footer-divider" />

    <div className="footer-bottom text-center text-muted">
      <small>&copy; {new Date().getFullYear()} Velmurugan V. All rights reserved.</small>
      <br />
      <small>🚀 Powered by ResNet & Machine Learning</small>
    </div>
  </div>
</footer>

   
  );
};
export default Footer;
