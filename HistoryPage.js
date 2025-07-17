import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, downloadAnalysis } from '../services/api';

const HistoryPage = ({ onViewAnalysis }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  // Fetch analysis history
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getHistory()
      .then(response => {
        if (response.status === 'success') {
          setHistory(response.data);
        } else {
          setError(response.message || 'Failed to load history');
          console.error('API Error:', response);
        }
      })
      .catch(err => {
        setError('Failed to load analysis history');
        console.error('Fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter and search functionality
  const filteredHistory = history.filter(item => {
    // Filter by disease type
    if (filterType !== 'all' && item.disease_class !== filterType) {
      return false;
    }
    
    // Search by filename
    if (searchTerm && !item.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Handle view analysis
  const handleViewAnalysis = (id) => {
    // If using context/state for passing analysis data
    const analysis = history.find(item => item.id === id);
    if (analysis) {
      onViewAnalysis(analysis);
      navigate(`/visualization/${id}`);
    }
  };

  // Handle download analysis
  const handleDownload = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    try {
      await downloadAnalysis(id);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download analysis results');
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get confidence badge class
  const getConfidenceBadgeClass = (confidence) => {
    if (confidence >= 0.7) return 'bg-danger';
    if (confidence >= 0.4) return 'bg-warning text-dark';
    return 'bg-success';
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading analysis history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Analysis History</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/upload')}
          >
            <i className="fas fa-plus me-2"></i>
            New Analysis
          </button>
        </div>
        
        <div className="card-body">
          <div className="row mb-4">
            {/* Search box */}
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by filename" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filter dropdown */}
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-filter"></i>
                </span>
                <select 
                  className="form-select" 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Diseases</option>
                  <option value="Bacterial Leaf Blight">Bacterial Leaf Blight</option>
                  <option value="Brown Spot">Brown Spot</option>
                  <option value="Leaf Smut">Leaf Smut</option>
                </select>
              </div>
            </div>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
              <h5>No analysis results found</h5>
              <p className="text-muted">
                {history.length === 0 ? 
                  "You haven't analyzed any images yet." : 
                  "No results match your search criteria."}
              </p>
              {history.length === 0 && (
                <button 
                  className="btn btn-primary mt-2"
                  onClick={() => navigate('/upload')}
                >
                  Analyze Your First Image
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date</th>
                    <th>Disease</th>
                    <th>Confidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(item => (
                    <tr 
                      key={item.id}
                      className="history-item"
                      onClick={() => handleViewAnalysis(item.id)}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-file-image text-primary me-2"></i>
                          {item.filename}
                        </div>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{item.disease_class}</td>
                      <td>
                        <span className={`badge ${getConfidenceBadgeClass(item.confidence)}`}>
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleViewAnalysis(item.id)}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => handleDownload(item.id, e)}
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-3 text-muted">
            <small>
              Showing {filteredHistory.length} of {history.length} analysis results
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
