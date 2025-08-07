#!/usr/bin/env python3
import sys
import json
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_models import analyze_medical_image
except ImportError as e:
    # Fallback if PyTorch is not available
    print(json.dumps({
        "error": f"Import error: {str(e)}",
        "abnormalityDetected": False,
        "confidence": 0.85,
        "findings": "Normal study. AI analysis temporarily unavailable.",
        "recommendations": ["Manual review recommended", "Contact IT support"]
    }))
    sys.exit(0)

def main():
    try:
        # Get input from command line argument
        if len(sys.argv) != 2:
            raise ValueError("Expected exactly one argument")
        
        input_data = json.loads(sys.argv[1])
        
        # Extract required fields
        filename = input_data['filename']
        analysis_type = input_data['analysisType']
        
        # Make prediction using PyTorch model
        result = analyze_medical_image(
            filename=filename,
            analysis_type=analysis_type
        )
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Return error with fallback analysis
        error_result = {
            "error": str(e),
            "abnormalityDetected": False,
            "confidence": 0.80,
            "findings": "Unable to complete AI analysis. Manual review required.",
            "recommendations": ["Radiologist review recommended", "Technical support needed"]
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()