# handwritten-digit-identifier
Web app that identifies handwritten digits using Gemini API


# Handwritten Digit Identifier 🧠✍️

A web application that lets users upload an image of a **handwritten digit (0–9)** and uses **Google Gemini** to recognize the digit and display the result.

- **Live App:** https://handwritten-digit-identi-7c366.web.app  
- **Backend API:** https://handwritten-digit-identifier.onrender.com  

Built as an intern project by **Pushkar Chaturvedy**.

---

## 🚀 Features

- Upload an image containing a handwritten digit (0–9)
- Supports **JPEG** and **PNG**
- Live image **preview** before prediction
- Uses **Gemini Vision API** to identify the digit
- Clean, responsive UI (works on desktop & mobile)
- Backend and frontend fully deployed and publicly accessible

---

## 🏗️ Tech Stack

**Frontend:**

- HTML, CSS, Vanilla JavaScript
- Hosted on **Firebase Hosting**

**Backend:**

- Python, **FastAPI**
- **Uvicorn** ASGI server
- Deployed on **Render**

**AI:**

- **Google Gemini** (image understanding)

**Other:**

- Git & GitHub for version control

---

## 🧬 Architecture

High-level data flow:

```text
[ User Browser ]
      |
      v
[ Frontend (Firebase Hosting) ]
  - HTML/CSS/JS
  - Lets user upload an image
  - Calls backend via fetch()
      |
      v
POST /predict (image)
      |
      v
[ Backend API (FastAPI on Render) ]
  - Accepts image
  - Sends image to Gemini Vision model
  - Parses Gemini response to extract digit (0–9)
      |
      v
JSON response: { "digit": <0-9> }
      |
      v
[ Frontend ]
  - Displays "Predicted digit: X" to user
