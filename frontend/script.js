// frontend/script.js

// ========= Firebase imports & config =========
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


// TODO: Paste your firebaseConfig from Firebase console here:
const firebaseConfig = {
  apiKey: "AIzaSyCwssU0kctnSS4oZsgt8qqNd3C7bY4XT50",
  authDomain: "handwritten-digit-identi-7c366.firebaseapp.com",
  projectId: "handwritten-digit-identi-7c366",
  storageBucket: "handwritten-digit-identi-7c366.firebasestorage.app",
  messagingSenderId: "711382413160",
  appId: "1:711382413160:web:cdc773dc32ed12073b30dd",
};

// Initialize Firebase & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ========= Backend API URL =========
const API_BASE_URL = "https://handwritten-digit-identifier.onrender.com";

let selectedFile = null;
let isLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
  // Auth-related elements
  const authStatus = document.getElementById("authStatus");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const signupButton = document.getElementById("signupButton");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const authMessage = document.getElementById("authMessage");

  // Prediction-related elements
  const fileInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const predictButton = document.getElementById("predictButton");
  const resultText = document.getElementById("resultText");

  // ----- Helpers -----
  function showAuthMessage(msg) {
    authMessage.textContent = msg || "";
  }

  function clearAuthInputs() {
    authPassword.value = "";
  }

  function resetPreview() {
    selectedFile = null;
    previewImage.src = "";
    previewImage.classList.add("hidden");
    previewPlaceholder.textContent = isLoggedIn
      ? "No image selected yet."
      : "Login required to use this feature.";
    resultText.textContent = isLoggedIn
      ? "No prediction yet."
      : "Please log in to use digit identification.";
    predictButton.disabled = true;
  }

  // Enable/disable prediction UI based on login state
  function updatePredictionAccess() {
    if (!isLoggedIn) {
      // Lock everything
      fileInput.disabled = true;
      predictButton.disabled = true;
      resetPreview();
    } else {
      // Allow selecting files
      fileInput.disabled = false;
      resetPreview();
    }
  }

  // ----- Auth state listener -----
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn = true;
      authStatus.textContent = `Logged in as: ${user.email}`;
      showAuthMessage("");
    } else {
      isLoggedIn = false;
      authStatus.textContent = "Not logged in.";
    }
    updatePredictionAccess();
  });

  // ----- Auth actions -----
  signupButton.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      showAuthMessage("Please enter both email and password.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      showAuthMessage(`Signup successful. Welcome, ${userCred.user.email}!`);
      clearAuthInputs();
    } catch (error) {
      console.error("Signup error:", error);
      showAuthMessage(error.message || "Signup failed.");
    }
  });

  loginButton.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      showAuthMessage("Please enter both email and password.");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      showAuthMessage(`Login successful. Hello, ${userCred.user.email}!`);
      clearAuthInputs();
    } catch (error) {
      console.error("Login error:", error);
      showAuthMessage(error.message || "Login failed.");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showAuthMessage("Logged out successfully.");
      clearAuthInputs();
    } catch (error) {
      console.error("Logout error:", error);
      showAuthMessage(error.message || "Logout failed.");
    }
  });

  // ----- Image upload & prediction logic -----

  fileInput.addEventListener("change", () => {
    if (!isLoggedIn) {
      // Shouldn't normally happen because input is disabled, but just in case
      fileInput.value = "";
      alert("Please log in to use digit identification.");
      return;
    }

    const file = fileInput.files[0];

    if (!file) {
      resetPreview();
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG image.");
      fileInput.value = "";
      resetPreview();
      return;
    }

    selectedFile = file;

    const imageUrl = URL.createObjectURL(file);
    previewImage.src = imageUrl;
    previewImage.onload = () => {
      URL.revokeObjectURL(imageUrl);
    };

    previewImage.classList.remove("hidden");
    previewPlaceholder.textContent = "";
    predictButton.disabled = false;
    resultText.textContent = "Ready to predict.";
  });

  predictButton.addEventListener("click", async () => {
    if (!isLoggedIn) {
      alert("Please log in to use digit identification.");
      updatePredictionAccess();
      return;
    }

    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    resultText.textContent = "Predicting...";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response from backend:", errorData);
        resultText.textContent = `Error: ${errorData.detail || "Failed to get prediction."}`;
        return;
      }

      const data = await response.json();
      console.log("Prediction response:", data);

      if (typeof data.digit === "number") {
        resultText.textContent = `Predicted digit: ${data.digit}`;
      } else {
        resultText.textContent = "Unexpected response from server.";
      }
    } catch (error) {
      console.error("Request error:", error);
      resultText.textContent = "Network error. Please try again.";
    }
  });

  // Initial state
  updatePredictionAccess();
});
