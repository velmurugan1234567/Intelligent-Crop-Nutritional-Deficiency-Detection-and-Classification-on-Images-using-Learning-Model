import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import UploadPage from './components/UploadPage';
import VisualizationPage from './components/VisualizationPage';
import HistoryPage from './components/HistoryPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // Handler to view a specific analysis in visualization page
  const handleViewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
  };
  

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage onAnalysisComplete={handleViewAnalysis} />} />
            <Route 
              path="/visualization" 
              element={
                selectedAnalysis ? 
                <VisualizationPage analysis={selectedAnalysis} /> : 
                <Navigate to="/upload" replace />
              } 
            />
            <Route 
              path="/visualization/:id" 
              element={<VisualizationPage />} 
            />
            <Route path="/history" element={<HistoryPage onViewAnalysis={handleViewAnalysis} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
