import os
import cv2
import json
import logging
import numpy as np
from flask import request, jsonify, send_file
from werkzeug.utils import secure_filename
from backend.app import db
from backend.models import Analysis
from backend.ml_model import get_model
from backend.image_processing import ImageProcessor
from backend.utils import generate_unique_filename, save_image_to_disk, format_json_response

logger = logging.getLogger(__name__)

# Constants
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
PROCESSED_FOLDER = os.path.join(os.path.dirname(__file__), 'processed')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def register_routes(app):
    """Register API routes with the Flask app"""
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({"status": "healthy", "message": "API is running"}), 200
    
    @app.route('/api/upload', methods=['POST'])
    def upload_image():
        """
        Upload and process an image for disease detection
        
        Request:
            - file: Image file
            
        Response:
            - JSON with analysis results
        """
        try:
            logger.debug("Processing image upload request")
            
            # Check if image file was uploaded
            if 'file' not in request.files:
                logger.warning("No file part in request")
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message="No file part"
                )), 400
            
            file = request.files['file']
            
            # Check if filename is empty
            if file.filename == '':
                logger.warning("No file selected")
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message="No file selected"
                )), 400
            
            # Check if file type is allowed
            if not allowed_file(file.filename):
                logger.warning(f"File type not allowed: {file.filename}")
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message=f"File type not allowed. Please upload {', '.join(ALLOWED_EXTENSIONS)}"
                )), 400
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(filename)
            
            # Save original file
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            logger.debug(f"File saved: {file_path}")
            
            # Read image with OpenCV
            image = cv2.imread(file_path)
            if image is None:
                logger.error(f"Failed to read image: {file_path}")
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message="Failed to read image file"
                )), 400
            
            # Process image
            processor = ImageProcessor()
            processed_data = processor.preprocess_image(image)
            processed_image = processed_data["processed_image"]
            
            # Save processed image
            processed_filename = f"processed_{unique_filename}"
            processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
            cv2.imwrite(processed_path, processed_image)
            logger.debug(f"Processed image saved: {processed_path}")
            
            # Extract features using ResNet
            model = get_model()
            features = model.extract_features(processed_image)
            
            # Make prediction
            disease_class, confidence = model.predict(features)
            
            # Create entry in database
            analysis = Analysis(
                filename=filename,
                original_image_path=file_path,
                processed_image_path=processed_path,
                disease_class=disease_class,
                confidence=confidence,
                features=json.dumps(features.tolist()),
                preprocessing_details=json.dumps(processed_data["processing_details"])
            )
            
            db.session.add(analysis)
            db.session.commit()
            logger.debug(f"Analysis saved to database with ID: {analysis.id}")
            
            # Convert images to base64 for response
            original_base64 = processor.image_to_base64(image)
            processed_base64 = processor.image_to_base64(processed_image)
            
            # Prepare response
            result = {
                "id": analysis.id,
                "filename": filename,
                "disease_class": disease_class,
                "confidence": confidence,
                "original_image": original_base64,
                "processed_image": processed_base64,
                "processing_steps": processed_data["processing_details"]
            }
            
            return jsonify(format_json_response(result)), 200
            
        except Exception as e:
            logger.error(f"Error processing upload: {str(e)}")
            return jsonify(format_json_response(
                None, 
                status="error", 
                message=f"Error processing image: {str(e)}"
            )), 500
    
    @app.route('/api/analysis/<int:analysis_id>', methods=['GET'])
    def get_analysis(analysis_id):
        """
        Get a specific analysis by ID
        
        Response:
            - JSON with analysis details
        """
        try:
            analysis = Analysis.query.get(analysis_id)
            
            if not analysis:
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message=f"Analysis with ID {analysis_id} not found"
                )), 404
            
            # Read images and convert to base64
            processor = ImageProcessor()
            original_image = cv2.imread(analysis.original_image_path)
            processed_image = cv2.imread(analysis.processed_image_path)
            
            if original_image is None or processed_image is None:
                logger.error(f"Failed to read image files for analysis {analysis_id}")
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message="Failed to read image files"
                )), 500
            
            original_base64 = processor.image_to_base64(original_image)
            processed_base64 = processor.image_to_base64(processed_image)
            
            # Prepare response
            result = {
                "id": analysis.id,
                "filename": analysis.filename,
                "disease_class": analysis.disease_class,
                "confidence": analysis.confidence,
                "created_at": analysis.created_at.isoformat(),
                "original_image": original_base64,
                "processed_image": processed_base64,
                "processing_details": json.loads(analysis.preprocessing_details) if analysis.preprocessing_details else None
            }
            
            return jsonify(format_json_response(result)), 200
            
        except Exception as e:
            logger.error(f"Error retrieving analysis {analysis_id}: {str(e)}")
            return jsonify(format_json_response(
                None, 
                status="error", 
                message=f"Error retrieving analysis: {str(e)}"
            )), 500
    
    @app.route('/api/history', methods=['GET'])
    def get_history():
        """
        Get history of all analyses
        
        Response:
            - JSON list of all analyses
        """
        try:
            analyses = Analysis.query.order_by(Analysis.created_at.desc()).all()
            
            results = []
            for analysis in analyses:
                results.append({
                    "id": analysis.id,
                    "filename": analysis.filename,
                    "disease_class": analysis.disease_class,
                    "confidence": analysis.confidence,
                    "created_at": analysis.created_at.isoformat()
                })
            
            return jsonify(format_json_response(results)), 200
            
        except Exception as e:
            logger.error(f"Error retrieving history: {str(e)}")
            return jsonify(format_json_response(
                None, 
                status="error", 
                message=f"Error retrieving history: {str(e)}"
            )), 500
    
    @app.route('/api/download/<int:analysis_id>', methods=['GET'])
    def download_analysis(analysis_id):
        """
        Generate and download analysis report
        
        Response:
            - PDF or JSON file with analysis details
        """
        try:
            analysis = Analysis.query.get(analysis_id)
            
            if not analysis:
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message=f"Analysis with ID {analysis_id} not found"
                )), 404
            
            # Get format from query parameter
            report_format = request.args.get('format', 'json')
            
            if report_format == 'json':
                # Generate JSON report
                report_data = {
                    "id": analysis.id,
                    "filename": analysis.filename,
                    "disease_class": analysis.disease_class,
                    "confidence": analysis.confidence,
                    "created_at": analysis.created_at.isoformat(),
                    "preprocessing_details": json.loads(analysis.preprocessing_details) if analysis.preprocessing_details else None,
                    "features": json.loads(analysis.features) if analysis.features else None
                }
                
                # Save to temporary file
                report_filename = f"analysis_{analysis_id}_report.json"
                report_path = os.path.join(os.path.dirname(__file__), 'temp', report_filename)
                os.makedirs(os.path.dirname(report_path), exist_ok=True)
                
                with open(report_path, 'w') as f:
                    json.dump(report_data, f, indent=2)
                
                return send_file(
                    report_path,
                    as_attachment=True,
                    download_name=report_filename,
                    mimetype='application/json'
                )
            else:
                # For now, only JSON is supported
                return jsonify(format_json_response(
                    None, 
                    status="error", 
                    message=f"Unsupported format: {report_format}. Only 'json' is supported"
                )), 400
                
        except Exception as e:
            logger.error(f"Error downloading analysis {analysis_id}: {str(e)}")
            return jsonify(format_json_response(
                None, 
                status="error", 
                message=f"Error downloading analysis: {str(e)}"
            )), 500
