from datetime import datetime
from backend.app import db

class Analysis(db.Model):
    """
    Model for storing crop analysis results
    """
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_image_path = db.Column(db.String(512), nullable=False)
    processed_image_path = db.Column(db.String(512), nullable=True)
    disease_class = db.Column(db.String(100), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Additional metadata fields
    features = db.Column(db.Text, nullable=True)  # JSON string of extracted features
    preprocessing_details = db.Column(db.Text, nullable=True)  # JSON string of preprocessing steps
    
    def __repr__(self):
        return f"<Analysis {self.id}: {self.filename} - {self.disease_class}>"
    
    def to_dict(self):
        """
        Convert model instance to a dictionary for API responses
        """
        return {
            'id': self.id,
            'filename': self.filename,
            'disease_class': self.disease_class,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat(),
            'features': self.features,
            'preprocessing_details': self.preprocessing_details
        }
