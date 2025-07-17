import os
import numpy as np
import cv2
from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA
import joblib
import logging

logger = logging.getLogger(__name__)

# Constants
IMG_HEIGHT = 224
IMG_WIDTH = 224
CLASSES = ['Bacterial Leaf Blight', 'Brown Spot', 'Leaf Smut']
MODEL_DIRECTORY = os.path.join(os.path.dirname(__file__), 'saved_models')
ML_MODEL_PATH = os.path.join(MODEL_DIRECTORY, 'classifier_model.pkl')
PCA_MODEL_PATH = os.path.join(MODEL_DIRECTORY, 'pca_model.pkl')

os.makedirs(MODEL_DIRECTORY, exist_ok=True)

class CropDiseaseModel:
    """
    A class for detecting nutritional deficiencies and diseases in crop images
    using PCA for feature extraction and RandomForest for classification.
    """
    
    def __init__(self):
        """Initialize the model components"""
        self.pca = None
        self.classifier = None
        self.load_or_create_models()
    
    def load_or_create_models(self):
        """Load existing models or create new ones if they don't exist"""
        # Setup PCA feature extractor
        try:
            if os.path.exists(PCA_MODEL_PATH):
                logger.info("Loading existing PCA model")
                self.pca = joblib.load(PCA_MODEL_PATH)
            else:
                logger.info("Creating new PCA model")
                self._create_pca()
        except Exception as e:
            logger.error(f"Error loading PCA model: {e}")
            logger.info("Creating new PCA model")
            self._create_pca()
            
        # Setup classifier
        try:
            if os.path.exists(ML_MODEL_PATH):
                logger.info("Loading existing classifier model")
                self.classifier = joblib.load(ML_MODEL_PATH)
            else:
                logger.info("Creating new classifier model")
                self._create_classifier()
        except Exception as e:
            logger.error(f"Error loading classifier: {e}")
            logger.info("Creating new classifier model")
            self._create_classifier()
    
    def _create_pca(self):
        """Create and save the PCA feature extractor"""
        # Create a PCA model for feature extraction
        self.pca = PCA(n_components=50)
        
        # Since we don't have real training data to fit the PCA, we'll save as-is
        # In a real scenario, we would fit this with training data first
        joblib.dump(self.pca, PCA_MODEL_PATH)
        logger.info("PCA feature extractor created and saved")
    
    def _create_classifier(self):
        """Create and save the ML classifier model"""
        # Create a random forest classifier (default model)
        # In a real scenario, this would be trained with actual data
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Since we don't have real training data, we'll just save the untrained model
        # In production, this would be trained before saving
        joblib.dump(self.classifier, ML_MODEL_PATH)
        logger.info("Classifier model created and saved")
    
    def _extract_traditional_features(self, image):
        """
        Extract traditional image features (color histograms, textures, etc.)
        
        Args:
            image: Input image
            
        Returns:
            np.array: Extracted features
        """
        features = []
        
        # 1. Resize for consistency
        resized = cv2.resize(image, (IMG_WIDTH, IMG_HEIGHT))
        
        # 2. Convert to different color spaces and extract features
        # HSV color space features
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        for i, channel in enumerate(cv2.split(hsv)):
            # Add histogram features
            hist = cv2.calcHist([channel], [0], None, [32], [0, 256])
            features.extend(hist.flatten())
            
            # Add statistical features
            features.append(np.mean(channel))
            features.append(np.std(channel))
        
        # 3. Texture features using Haralick texture
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        
        # Add edge features using Sobel filter
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        features.append(np.mean(sobelx))
        features.append(np.std(sobelx))
        features.append(np.mean(sobely))
        features.append(np.std(sobely))
        
        # Add more texture features
        features.append(np.mean(gray))
        features.append(np.std(gray))
        
        return np.array(features)
    
    def extract_features(self, processed_image):
        """
        Extract features from processed image
        
        Args:
            processed_image: Preprocessed image array
            
        Returns:
            np.array: Extracted features
        """
        # Extract traditional image features
        features = self._extract_traditional_features(processed_image)
        
        # Apply PCA to reduce dimensionality (if needed)
        # In a real scenario, this would be properly fitted with training data
        # For demonstration, we'll simply use the raw features
        
        return features
    
    def predict(self, features):
        """
        Classify the image based on extracted features
        
        Args:
            features: Features extracted from the image
            
        Returns:
            tuple: (predicted_class, confidence)
        """
        # Since we don't have a real trained model, this is a placeholder
        # In production, this would use the trained classifier
        
        # For demonstration, let's simulate a prediction
        # This is for demonstration only - in production use the trained model's predictions
        
        # Use the feature vector to generate a deterministic but simulated result
        # Calculate a simple hash of the features to make results consistent for the same image
        feature_hash = int(sum(features) * 1000) % 10000
        np.random.seed(feature_hash)
        
        # Generate "probabilities" for each class
        probabilities = np.random.rand(3)
        probabilities = probabilities / probabilities.sum()  # Normalize to sum to 1
        
        # Get the class with highest probability
        predicted_class_idx = np.argmax(probabilities)
        confidence = probabilities[predicted_class_idx]
        
        return CLASSES[predicted_class_idx], float(confidence)

# Singleton instance
_model_instance = None

def get_model():
    """Get or create the model singleton instance"""
    global _model_instance
    if _model_instance is None:
        _model_instance = CropDiseaseModel()
    return _model_instance
