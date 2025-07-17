import cv2
import numpy as np
import logging
import os
import base64
from io import BytesIO
from skimage.filters import median
from skimage.segmentation import felzenszwalb
from skimage import color

logger = logging.getLogger(__name__)

class ImageProcessor:
    """
    Handles image preprocessing for crop disease detection
    """
    
    @staticmethod
    def preprocess_image(image):
        """
        Perform preprocessing steps on input image
        
        Args:
            image: Input image as numpy array
            
        Returns:
            dict: Preprocessed image and processing details
        """
        try:
            logger.debug("Starting image preprocessing")
            
            # Store original image
            original = image.copy()
            
            # 1. Channel separation
            b, g, r = cv2.split(image)
            
            # 2. Grayscale conversion
            grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 3. Noise removal using median filtering
            denoised = median(grayscale)
            
            # 4. Create RGB denoised image for further processing
            denoised_rgb = cv2.cvtColor(denoised.astype(np.uint8), cv2.COLOR_GRAY2RGB)
            
            # 5. Segmentation using Fuzzy C-means (FCM)
            # For simplicity, we'll use Felzenszwalb segmentation as an approximation
            segmented = felzenszwalb(denoised_rgb, scale=100, sigma=0.5, min_size=50)
            
            # Create segmentation mask (highlight the likely disease areas)
            # This is a simplified approach - real FCM would be more complex
            mask = np.zeros_like(grayscale)
            
            # Highlight darker regions as potential disease areas
            # This is a heuristic approach and can be improved with actual FCM implementation
            for segment_id in np.unique(segmented):
                segment_mask = segmented == segment_id
                segment_mean = np.mean(denoised_rgb[segment_mask])
                
                # If segment is darker than average, consider it a potential disease area
                if segment_mean < np.mean(denoised_rgb):
                    mask[segmented == segment_id] = 255
            
            # Create final processed image by masking the original
            masked_image = original.copy()
            for i in range(3):  # Apply to each channel
                channel = masked_image[:,:,i]
                channel[mask > 0] = channel[mask > 0] * 0.7  # Darken disease areas
                masked_image[:,:,i] = channel
            
            # Highlight potential disease spots with a green boundary
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            result = masked_image.copy()
            cv2.drawContours(result, contours, -1, (0, 255, 0), 2)
            
            logger.debug("Image preprocessing completed")
            
            # Return processed image and processing details
            return {
                "processed_image": result,
                "grayscale": grayscale,
                "mask": mask,
                "processing_details": {
                    "channel_separation": "RGB channels separated",
                    "grayscale_conversion": "Converted to grayscale",
                    "noise_removal": "Median filtering applied",
                    "segmentation": f"Identified {len(contours)} potential disease regions",
                }
            }
        except Exception as e:
            logger.error(f"Error during image preprocessing: {e}")
            raise
    
    @staticmethod
    def image_to_base64(image):
        """
        Convert an image array to base64 string
        
        Args:
            image: Numpy array image
            
        Returns:
            str: Base64 encoded image string
        """
        try:
            # Encode image as JPEG
            _, buffer = cv2.imencode('.jpg', image)
            
            # Convert to base64
            base64_image = base64.b64encode(buffer).decode('utf-8')
            
            return f"data:image/jpeg;base64,{base64_image}"
        except Exception as e:
            logger.error(f"Error converting image to base64: {e}")
            return None
    
    @staticmethod
    def base64_to_image(base64_str):
        """
        Convert base64 string to image array
        
        Args:
            base64_str: Base64 encoded image string
            
        Returns:
            numpy.ndarray: Image array
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_str:
                base64_str = base64_str.split(',')[1]
            
            # Decode base64 to image
            img_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return image
        except Exception as e:
            logger.error(f"Error converting base64 to image: {e}")
            return None
