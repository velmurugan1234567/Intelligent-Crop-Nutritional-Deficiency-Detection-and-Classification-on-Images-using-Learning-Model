import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';

const HomePage = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize and animate the chart when component mounts
  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Sample data for the chart
      const data = {
        labels: ['Healthy Plants', 'Bacterial Leaf Blight', 'Brown Spot', 'Leaf Smut'],
        datasets: [
          {
            label: 'Crop Health Distribution (Sample)',
            data: [65, 12, 15, 8],
            backgroundColor: [
              'rgba(46, 204, 113, 0.7)',
              'rgba(231, 76, 60, 0.7)',
              'rgba(241, 196, 15, 0.7)',
              'rgba(155, 89, 182, 0.7)'
            ],
            borderColor: [
              'rgba(46, 204, 113, 1)',
              'rgba(231, 76, 60, 1)',
              'rgba(241, 196, 15, 1)',
              'rgba(155, 89, 182, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
      
      // Create the chart
      chartInstance.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Common Rice Plant Diseases',
              font: {
                size: 16
              }
            },
            animation: {
              animateScale: true,
              animateRotate: true
            }
          }
        }
      });
    }
    
    // Clean up chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">Intelligent Crop Nutritional Deficiency Detection and
             Classification on Images using Learning Model🌾</h1>
          <p className="hero-text">
           AI and deep learning to detect crop deficiencies with high accuracy.
           This helps farmers make informed decisions for healthier yields.
           </p>
          <Link to="/upload" className="analyze-btn">
          Analyze Your Crop Accurately <i className="fas fa-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          
          <div className="row">
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card feature-card h-100">
                <div className="card-body">
                  <i className="fas fa-camera feature-icon"></i>
                  <h5 className="card-title">Upload</h5>
                  <p className="card-text">Upload photos of your crop leaves for instant analysis.</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card feature-card h-100">
                <div className="card-body">
                  <i className="fas fa-microscope feature-icon"></i>
                  <h5 className="card-title">Analyze</h5>
                  <p className="card-text">Our AI analyzes images using advanced deep learning technology.</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card feature-card h-100">
                <div className="card-body">
                  <i className="fas fa-chart-pie feature-icon"></i>
                  <h5 className="card-title">Visualize</h5>
                  <p className="card-text">Understand the results through intuitive visualizations.</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card feature-card h-100">
                <div className="card-body">
                  <i className="fas fa-leaf feature-icon"></i>
                  <h5 className="card-title">Take Action</h5>
                  <p className="card-text">Get recommendations to improve crop health and yield.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Diseases Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Rice Plant Diseases We Detect</h2>
          
          <div className="row mb-4">
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-danger">Bacterial Leaf Blight</h5>
                  <p className="card-text">
                    A destructive bacterial disease of rice characterized by water-soaked lesions
                    that turn yellow and eventually white as they expand along the leaf veins.
                  </p>
                  <ul>
                    <li>Causes yield losses of 20-30%</li>
                    <li>Common in warm, humid environments</li>
                    <li>Appears as yellowish-white stripes along the leaf veins</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-warning">Brown Spot</h5>
                  <p className="card-text">
                    A fungal disease commonly associated with nutrient-deficient soils, particularly
                    lack of potassium. It causes small, circular brown lesions on leaves.
                  </p>
                  <ul>
                    <li>Linked to potassium deficiency</li>
                    <li>More severe in stressed plants</li>
                    <li>Appears as circular, brown spots with yellow halos</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">Leaf Smut</h5>
                  <p className="card-text">
                    A fungal disease that produces small, black, slightly raised spots on both
                    sides of the leaves. Generally less damaging than other rice diseases.
                  </p>
                  <ul>
                    <li>Appears as small, black, raised spots</li>
                    <li>Generally less severe than other diseases</li>
                    <li>More common in high-humidity conditions</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="section bg-primary text-white text-center">
  <div className="container">
    <h2 style={{ color: '#1a1a1a' }}>Ready to analyze your crops?</h2>
    <p className="lead mb-4" style={{ color: '#1a1a1a' }}>
      Start using our AI-powered tool today to identify nutritional deficiencies
      and diseases in your crops.
    </p>
    <Link to="/upload" className="btn btn-light btn-lg">
      Get Started Now
    </Link>
  </div>
</section>

    </>
  );
};

export default HomePage;
