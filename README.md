# Handwritten Digit Identifier 🧠✍️

A full-stack web app that lets users upload an image of **handwritten digits**, and uses **Google Gemini** to recognize **single or multiple digits**.  

Access to the digit identifier is **protected by login + email verification** using Firebase Authentication.

- **Live App (Frontend)**: https://handwritten-digit-identi-7c366.web.app  
- **Backend API (FastAPI)**: https://handwritten-digit-identifier.onrender.com  

Built as an intern project by **Pushkar Chaturvedy (IIT Kharagpur)**.

---

## 🚀 Features

- Upload an image containing handwritten digits (`0–9`).
- Supports **JPEG** and **PNG** formats.
- Clean UI with **live image preview**.
- Uses **Google Gemini Vision** to recognize:
  - A single digit (`"5"`)
  - A sequence of digits (`"42"`, `"2025"`)
- Handles **“no digit detected”** explicitly (doesn’t confuse it with `0`).
- Fully **login-gated digit identification**:
  - Email/password **signup** and **login** (Firebase Auth)
  - **Email verification required** before using the identifier
  - **Forgot password** (password reset email)

---

## 🏗️ Tech Stack

**Frontend**
- HTML, CSS, Vanilla JavaScript
- Firebase Authentication (email/password)
- Hosted on **Firebase Hosting**

**Backend**
- Python, **FastAPI**
- Uvicorn (ASGI server)
- Deployed on **Render**

**AI**
- **Google Gemini** Vision model (`gemini-2.5-flash`)

**Other**
- Git & GitHub for version control

---

## 🧬 Architecture Overview

```mermaid
flowchart TD
    A[User Browser] --> B[Firebase Hosting<br/>(Frontend HTML/CSS/JS)]
    B --> C[FastAPI Backend<br/>on Render (/predict)]
    C --> D[Gemini Vision API]
    D --> C
    C --> B

    subgraph Auth
      B --> E[Firebase Auth<br/>(Email + Password)]
    end
