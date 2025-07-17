import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/api';

const UploadPage = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  // Process the selected file
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPEG, PNG)');
      return;
    }

    // Check file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image to analyze');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadImage(formData);
      
      if (response.status === 'success') {
        // Pass the analysis data to parent component
        onAnalysisComplete(response.data);
        
        // Navigate to visualization page
        navigate('/visualization');
      } else {
        setError(response.message || 'An error occurred during analysis');
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Upload Crop Image</h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div 
                  className={`upload-zone mb-4 ${dragging ? 'active' : ''} ${preview ? 'd-none' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  <i className="fas fa-cloud-upload-alt fa-3x mb-3 text-muted"></i>
                  <h4>Drag & Drop Image Here!</h4>
                  <p className="text-muted">or</p>
                  <button type="button" className="btn btn-outline-primary">
                    Browse Files
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="d-none" 
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={handleFileChange}
                  />
                  <p className="mt-3 small text-muted">
                    Supported formats: JPEG, PNG | Max size: 5MB
                  </p>
                </div>
                
                {preview && (
                  <div className="mb-4 preview-container">
                    <div className="position-relative">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="img-fluid rounded mb-3" 
                        style={{ maxHeight: '300px', display: 'block', margin: '0 auto' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={handleCancel}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="fas fa-file-image me-2"></i>
                        {file?.name}
                      </span>
                      <span className="text-muted">
                        {Math.round(file?.size / 1024)} KB
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg px-5"
                    disabled={!file || loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>Analyze Image</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="card mt-4">
            <div className="card-header">
              <h4 className="mb-0">Tips for Good Results</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5><i className="fas fa-check-circle text-success me-2"></i>Do</h5>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>Use good lighting</li>
                    <li><i className="fas fa-check text-success me-2"></i>Capture clear, focused images</li>
                    <li><i className="fas fa-check text-success me-2"></i>Include multiple leaves if possible</li>
                    <li><i className="fas fa-check text-success me-2"></i>Photograph the affected area clearly</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5><i className="fas fa-times-circle text-danger me-2"></i>Don't</h5>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-times text-danger me-2"></i>Use blurry images</li>
                    <li><i className="fas fa-times text-danger me-2"></i>Photograph in poor lighting</li>
                    <li><i className="fas fa-times text-danger me-2"></i>Include unrelated objects</li>
                    <li><i className="fas fa-times text-danger me-2"></i>Use overly edited photos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
