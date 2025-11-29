# backend/main.py

import os
import re
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from google import genai
from google.genai import types as genai_types

# Load .env from this directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Please create backend/.env with GEMINI_API_KEY=...")

# Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(
    title="Handwritten Digit Identifier API",
    description="Backend API for predicting handwritten single or multi-digit sequences from images using Gemini.",
    version="0.3.0",
)

# CORS: allow frontend to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; can restrict to your Firebase domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Handwritten Digit Identifier API is running with Gemini (multi-digit capable)."}


def extract_digits_from_text(text: str) -> str:
    """
    Given a text response from Gemini, try to extract a sequence of digits (e.g. '5', '42', '2025').
    Returns the first digit sequence found.
    Raises ValueError if nothing that looks like digits is found.
    """
    # Look for a contiguous digit sequence first
    match = re.search(r"\d{1,20}", text)
    if match:
        return match.group(0)
    raise ValueError(f"Could not find digits in Gemini response: {text!r}")


@app.post("/predict")
async def predict_digit(file: UploadFile = File(...)):
    """
    Accept an image (JPEG/PNG), send it to Gemini for analysis,
    and return the predicted digits (single or multi-digit).
    If no digit is detected, return no_digit = true and digits = null.
    """
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read uploaded file.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        image_part = genai_types.Part.from_bytes(
            data=image_bytes,
            mime_type=file.content_type,
        )

        # New prompt: full sequence OR NO_DIGIT, nothing else
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                (
                    "You are a strict OCR classifier. "
                    "Look at this image which may contain zero or more handwritten digits (0-9). "
                    "If you see digits, respond with ONLY the exact sequence of digits in order, "
                    "with NO spaces or extra characters. Examples of valid outputs: '5', '42', '2025'. "
                    "If you do NOT see any digits at all, respond with EXACTLY 'NO_DIGIT'. "
                    "Do not include any explanation or extra text."
                ),
                image_part,
            ],
        )

        gemini_text = (response.text or "").strip()
        print("Gemini raw response:", repr(gemini_text))

        norm = gemini_text.upper().strip()

        # Case 1: model explicitly says no digit
        if norm == "NO_DIGIT":
            return JSONResponse(
                content={
                    "digits": None,
                    "no_digit": True,
                    "raw_response": gemini_text,
                }
            )

        # Case 2: try to extract a digit sequence
        try:
            digits = extract_digits_from_text(gemini_text)
            return JSONResponse(
                content={
                    "digits": digits,
                    "no_digit": False,
                    "raw_response": gemini_text,
                }
            )
        except ValueError as ve:
            # If we couldn't parse digits, treat it as 'no digit' instead of crashing or returning 0
            print("Parsing error, treating as no digit:", ve)
            return JSONResponse(
                content={
                    "digits": None,
                    "no_digit": True,
                    "raw_response": gemini_text,
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        print("Error calling Gemini:", e)
        raise HTTPException(status_code=500, detail="Error while calling Gemini API.")
