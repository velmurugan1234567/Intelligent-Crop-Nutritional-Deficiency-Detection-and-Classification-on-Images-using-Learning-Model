import os
import uuid
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def generate_unique_filename(original_filename):
    """
    Generate a unique filename based on timestamp and UUID
    
    Args:
        original_filename: Original filename from user
        
    Returns:
        str: Unique filename
    """
    # Get file extension
    _, file_extension = os.path.splitext(original_filename)
    
    # Generate timestamp and unique ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    # Create unique filename
    unique_filename = f"{timestamp}_{unique_id}{file_extension}"
    
    return unique_filename

def save_image_to_disk(image_data, filename, directory="uploads"):
    """
    Save image data to disk
    
    Args:
        image_data: Image data (bytes or numpy array)
        filename: Filename to save as
        directory: Directory to save in
        
    Returns:
        str: Path to saved file
    """
    try:
        # Ensure directory exists
        os.makedirs(directory, exist_ok=True)
        
        # Create full path
        file_path = os.path.join(directory, filename)
        
        # Save image
        if isinstance(image_data, bytes):
            with open(file_path, 'wb') as f:
                f.write(image_data)
        else:
            # Assume it's a numpy array
            import cv2
            cv2.imwrite(file_path, image_data)
        
        logger.debug(f"Image saved to {file_path}")
        
        return file_path
    except Exception as e:
        logger.error(f"Error saving image to disk: {e}")
        raise

def delete_file(file_path):
    """
    Delete a file from disk
    
    Args:
        file_path: Path to file to delete
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"File deleted: {file_path}")
            return True
        else:
            logger.warning(f"File not found for deletion: {file_path}")
            return False
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {e}")
        return False

def format_json_response(data, status="success", message=None):
    """
    Format standard JSON response
    
    Args:
        data: Data to include in response
        status: Response status (success/error)
        message: Optional message
        
    Returns:
        dict: Formatted response
    """
    response = {
        "status": status,
        "data": data
    }
    
    if message:
        response["message"] = message
    
    return response
