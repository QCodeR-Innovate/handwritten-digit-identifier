# backend/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Handwritten Digit Identifier API",
    description="Backend API for predicting handwritten digits from images.",
    version="0.1.0",
)

# CORS: allow requests from frontend (for now allow all, okay for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Handwritten Digit Identifier API is running."}


@app.post("/predict")
async def predict_digit(file: UploadFile = File(...)):
    """
    Accept an image (JPEG/PNG) and return a dummy predicted digit.
    Later this will call Gemini and GCP storage.
    """
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    # For now, we are not using the file content. This is just a dummy.
    # Later: save file to GCP Storage + send to Gemini + parse the result.

    fake_digit = 7  # dummy prediction
    return JSONResponse(content={"digit": fake_digit})
