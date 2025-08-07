#!/usr/bin/env python3
import sys
import json
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ml_models import predict_health_risk
except ImportError as e:
    # Fallback if PyTorch is not available
    print(json.dumps({
        "error": f"Import error: {str(e)}",
        "cardiovascularRisk": 25,
        "diabetesRisk": 20,
        "overallHealthScore": 75,
        "recommendations": ["Schedule health checkup", "Maintain healthy lifestyle"]
    }))
    sys.exit(0)

def main():
    try:
        # Get input from command line argument
        if len(sys.argv) != 2:
            raise ValueError("Expected exactly one argument")
        
        input_data = json.loads(sys.argv[1])
        
        # Extract required fields
        age = input_data['age']
        gender = input_data['gender']
        systolic_bp = input_data['systolicBP']
        diastolic_bp = input_data['diastolicBP']
        blood_sugar = input_data['bloodSugar']
        bmi = input_data['bmi']
        
        # Make prediction using PyTorch model
        result = predict_health_risk(
            age=age,
            gender=gender,
            systolic_bp=systolic_bp,
            diastolic_bp=diastolic_bp,
            blood_sugar=blood_sugar,
            bmi=bmi
        )
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Return error with fallback prediction
        error_result = {
            "error": str(e),
            "cardiovascularRisk": 30,
            "diabetesRisk": 25,
            "overallHealthScore": 70,
            "recommendations": ["Consult healthcare provider", "Schedule regular checkups"]
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()