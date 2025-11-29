# backend/main.py

import os
import re

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from google import genai
from google.genai import types as genai_types

# Load .env from the same directory as this file
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# Gemini client will read GEMINI_API_KEY from environment automatically
# (as per official docs)
client = genai.Client()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("GEMINI_API_KEY loaded?", bool(GEMINI_API_KEY))
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Please create backend/.env with GEMINI_API_KEY=...")


app = FastAPI(
    title="Handwritten Digit Identifier API",
    description="Backend API for predicting handwritten digits from images using Gemini.",
    version="0.2.0",
)

# CORS: allow requests from frontend (for now allow all, okay for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Handwritten Digit Identifier API is running with Gemini."}

@app.get("/test-gemini")
def test_gemini():
    """
    Simple text-only check to verify that the Gemini client and API key work.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Respond with ONLY the digit 5.",
        )
        text = response.text.strip()
        return {"raw_response": text}
    except Exception as e:
        print("Error in /test-gemini:", e)
        raise HTTPException(status_code=500, detail=f"Gemini test failed: {e}")



def extract_digit_from_text(text: str) -> int:
    """
    Given a text response from Gemini, try to extract a single digit (0–9).
    We'll look for the first occurrence of a digit.
    """
    match = re.search(r"\b([0-9])\b", text)
    if match:
        return int(match.group(1))
    # If not found, we can try a more forgiving pattern (e.g., 'digit 7' or 'number 3')
    match = re.search(r"([0-9])", text)
    if match:
        return int(match.group(1))
    raise ValueError(f"Could not find a digit in Gemini response: {text!r}")


@app.post("/predict")
async def predict_digit(file: UploadFile = File(...)):
    """
    Accept an image (JPEG/PNG), send it to Gemini for analysis, and
    return the predicted digit (0–9).
    """
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    # Read the image file into memory
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read uploaded file.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        # Prepare the image as a Part for Gemini
        image_part = genai_types.Part.from_bytes(
            data=image_bytes,
            mime_type=file.content_type,
        )

        # Call Gemini vision model
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "You are a classifier. Look at this image of a handwritten digit (0-9). "
                "Respond with ONLY the single digit (0-9) that you see, nothing else.",
                image_part,
            ],
        )

        # The response text (might contain newlines etc.)
        gemini_text = response.text.strip()
        print("Gemini raw response:", gemini_text)

        digit = extract_digit_from_text(gemini_text)

        return JSONResponse(content={"digit": digit, "raw_response": gemini_text})

    except ValueError as ve:
        # Could not parse a digit
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        # Generic error (network, API, etc.)
        print("Error calling Gemini:", e)
        raise HTTPException(status_code=500, detail="Error while calling Gemini API.")
