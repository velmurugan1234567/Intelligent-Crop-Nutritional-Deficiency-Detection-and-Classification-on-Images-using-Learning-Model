import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnalysis, downloadAnalysis } from '../services/api';
import Chart from 'chart.js/auto';

const VisualizationPage = ({ analysis }) => {
  const [data, setData] = useState(analysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const confidenceChartRef = useRef(null);
  const confidenceChartInstance = useRef(null);
  
  // Fetch analysis by ID if not provided as prop
  useEffect(() => {
    if (!data && id) {
      setLoading(true);
      setError(null);
      
      getAnalysis(id)
        .then(response => {
          if (response.status === 'success') {
            setData(response.data);
          } else {
            setError(response.message || 'Failed to load analysis');
            console.error('API Error:', response);
          }
        })
        .catch(err => {
          setError('Failed to load analysis data');
          console.error('Fetch error:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [data, id]);
  
  // Create/update confidence chart
  useEffect(() => {
    if (data && confidenceChartRef.current) {
      // Destroy previous chart if it exists
      if (confidenceChartInstance.current) {
        confidenceChartInstance.current.destroy();
      }
      
      // Prepare data for chart
      const confidence = data.confidence;
      const chartData = {
        labels: ['Confidence'],
        datasets: [
          {
            label: data.disease_class,
            data: [confidence],
            backgroundColor: getConfidenceColor(confidence),
            barThickness: 40,
          }
        ]
      };
      
      // Create chart
      confidenceChartInstance.current = new Chart(confidenceChartRef.current, {
        type: 'bar',
        data: chartData,
        options: {
          indexAxis: 'y',
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Confidence: ${(context.raw * 100).toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 1,
              ticks: {
                callback: function(value) {
                  return `${(value * 100).toFixed(0)}%`;
                }
              }
            }
          }
        }
      });
    }
    
    // Clean up chart on unmount
    return () => {
      if (confidenceChartInstance.current) {
        confidenceChartInstance.current.destroy();
      }
    };
  }, [data]);
  
  // Get color based on confidence level
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'rgba(231, 76, 60, 0.7)'; // High confidence - red
    if (confidence >= 0.4) return 'rgba(243, 156, 18, 0.7)'; // Medium confidence - yellow
    return 'rgba(46, 204, 113, 0.7)'; // Low confidence - green
  };
  
  // Get severity class based on confidence
  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  };
  
  // Handle download button click
  const handleDownload = async () => {
    if (!data) return;
    
    try {
      await downloadAnalysis(data.id);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download analysis results');
    }
  };
  
  // Return to upload page
  const handleBackToUpload = () => {
    navigate('/upload');
  };
  
  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading analysis results...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={handleBackToUpload}
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h4 className="alert-heading">No Analysis Data</h4>
          <p>Please upload an image first to see analysis results.</p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={handleBackToUpload}
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">Analysis Results</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className={`disease-badge ${getConfidenceClass(data.confidence)}`}>
                  Detected: {data.disease_class}
                </div>
                <h4 className="mb-3">Analysis Summary</h4>
                <p>
                  Our model has detected signs of <strong>{data.disease_class}</strong> in your rice plant image 
                  with a confidence level of <strong>{(data.confidence * 100).toFixed(1)}%</strong>.
                </p>
              </div>
              
              <div className="image-comparison">
                <div className="image-container">
                  <div className="image-label">Original Image</div>
                  <img 
                    src={data.original_image} 
                    alt="Original crop" 
                    className="img-fluid" 
                  />
                </div>
                <div className="image-container">
                  <div className="image-label">Processed Image</div>
                  <img 
                    src={data.processed_image} 
                    alt="Processed crop" 
                    className="img-fluid" 
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <h5>Processing Steps:</h5>
                <ul className="list-group">
                  {data.processing_steps && Object.entries(data.processing_steps).map(([key, value]) => (
                    <li className="list-group-item" key={key}>
                      <strong>{key.replace(/_/g, ' ')}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 d-flex gap-2">
                <button 
                  className="btn btn-primary" 
                  onClick={handleDownload}
                >
                  <i className="fas fa-download me-2"></i>
                  Download Results
                </button>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={handleBackToUpload}
                >
                  Analyze Another Image
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Confidence Level</h4>
            </div>
            <div className="card-body">
              <canvas ref={confidenceChartRef}></canvas>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">About {data.disease_class}</h4>
            </div>
            <div className="card-body">
              {data.disease_class === 'Bacterial Leaf Blight' && (
                <>
                  <p>
                    <strong>Bacterial Leaf Blight</strong> is a destructive bacterial disease that 
                    affects rice crops worldwide, especially in irrigated and rainfed lowland areas.
                  </p>
                  <h5>Symptoms:</h5>
                  <ul>
                    <li>Water-soaked yellow streaks along leaf veins</li>
                    <li>Lesions turn white or gray as they mature</li>
                    <li>Affected leaves wither and die</li>
                    <li>Can affect the crop at any growth stage</li>
                  </ul>
                  <h5>Recommended Actions:</h5>
                  <ul>
                    <li>Use disease-resistant rice varieties</li>
                    <li>Ensure balanced fertilization</li>
                    <li>Avoid excessive nitrogen application</li>
                    <li>Practice good field drainage</li>
                  </ul>
                </>
              )}
              
              {data.disease_class === 'Brown Spot' && (
                <>
                  <p>
                    <strong>Brown Spot</strong> is a fungal disease typically associated with 
                    nutrient-deficient soils, particularly potassium deficiency.
                  </p>
                  <h5>Symptoms:</h5>
                  <ul>
                    <li>Small, oval or circular brown lesions on leaves</li>
                    <li>Dark brown spots with lighter yellow halos</li>
                    <li>Spots can merge as infection progresses</li>
                    <li>More common in stressed or nutrient-deficient plants</li>
                  </ul>
                  <h5>Recommended Actions:</h5>
                  <ul>
                    <li>Ensure proper soil fertility and potassium levels</li>
                    <li>Apply balanced fertilizers</li>
                    <li>Consider fungicide application in severe cases</li>
                    <li>Practice crop rotation</li>
                  </ul>
                </>
              )}
              
              {data.disease_class === 'Leaf Smut' && (
                <>
                  <p>
                    <strong>Leaf Smut</strong> is a fungal disease that appears as small, black spots 
                    on rice leaves but generally causes less damage than other diseases.
                  </p>
                  <h5>Symptoms:</h5>
                  <ul>
                    <li>Small, black, slightly raised spots on both leaf surfaces</li>
                    <li>Spots are angular to oval in shape</li>
                    <li>Often appears in patches across the field</li>
                    <li>Rarely causes significant yield loss</li>
                  </ul>
                  <h5>Recommended Actions:</h5>
                  <ul>
                    <li>Usually not severe enough to warrant specific control</li>
                    <li>Maintain proper field sanitation</li>
                    <li>Ensure balanced nutrition</li>
                    <li>Use resistant varieties if available</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;
