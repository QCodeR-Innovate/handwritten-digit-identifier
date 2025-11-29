// frontend/script.js

// ========= Firebase imports & config =========
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Your existing firebaseConfig
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
let currentUser = null;      // full Firebase user
let isLoggedIn = false;      // logged in AND email verified

document.addEventListener("DOMContentLoaded", () => {
  // Auth-related elements
  const authStatus = document.getElementById("authStatus");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const signupButton = document.getElementById("signupButton");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const resetPasswordButton = document.getElementById("resetPasswordButton");
  const authMessage = document.getElementById("authMessage");

  // Prediction-related elements
  const fileInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const predictButton = document.getElementById("predictButton");
  const resultText = document.getElementById("resultText");
  const predictCard = document.getElementById("predictCard");

  // ----- Helpers -----
  function showAuthMessage(msg) {
    authMessage.textContent = msg || "";
  }

  function clearAuthInputs(full = false) {
    authPassword.value = "";
    if (full) {
      authEmail.value = "";
    }
  }

  function resetPreview() {
    selectedFile = null;
    previewImage.src = "";
    previewImage.classList.add("hidden");
    previewPlaceholder.textContent = isLoggedIn
      ? "No image selected yet."
      : "Login with a verified email to use this feature.";
    resultText.textContent = isLoggedIn
      ? "No prediction yet."
      : "Please log in and verify your email to use digit identification.";
    predictButton.disabled = true;
  }

  function updateAuthUI() {
    if (currentUser) {
      const verifiedText = currentUser.emailVerified ? "" : " (email not verified)";
      authStatus.textContent = `Logged in as: ${currentUser.email}${verifiedText}`;
      // Show current email in field
      authEmail.value = currentUser.email;
    } else {
      authStatus.textContent = "Not logged in.";
      clearAuthInputs(true);
    }
  }

  // Enable/disable prediction UI based on login & verification state
  function updatePredictionAccess() {
    if (!isLoggedIn) {
      fileInput.disabled = true;
      predictButton.disabled = true;
      predictCard.classList.add("locked");
      resetPreview();
    } else {
      fileInput.disabled = false;
      predictCard.classList.remove("locked");
      resetPreview();
    }
  }

  // ----- Auth state listener -----
  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    isLoggedIn = !!(user && user.emailVerified);

    updateAuthUI();
    updatePredictionAccess();

    if (user && !user.emailVerified) {
      showAuthMessage("Please verify your email. Check your inbox for a verification link.");
    } else {
      showAuthMessage("");
    }
  });

  // ----- Auth actions -----

  // Signup with email verification
  signupButton.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      showAuthMessage("Please enter both email and password.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      showAuthMessage(
        `Signup successful. Verification email sent to ${userCred.user.email}. Please verify before using the app.`
      );
      clearAuthInputs(false);
    } catch (error) {
      console.error("Signup error:", error);
      showAuthMessage(error.message || "Signup failed.");
    }
  });

  // Login
  loginButton.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      showAuthMessage("Please enter both email and password.");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      if (userCred.user.emailVerified) {
        showAuthMessage(`Login successful. Hello, ${userCred.user.email}!`);
      } else {
        showAuthMessage(
          "Logged in, but email is not verified. Please check your inbox for the verification link."
        );
      }
      clearAuthInputs(false);
    } catch (error) {
      console.error("Login error:", error);
      showAuthMessage(error.message || "Login failed.");
    }
  });

  // Logout
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showAuthMessage("Logged out successfully.");
      clearAuthInputs(true);
    } catch (error) {
      console.error("Logout error:", error);
      showAuthMessage(error.message || "Logout failed.");
    }
  });

  // Forgot / Reset password
  resetPasswordButton.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    if (!email) {
      showAuthMessage("Enter your email above, then click reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showAuthMessage(`Password reset email sent to ${email}.`);
    } catch (error) {
      console.error("Password reset error:", error);
      showAuthMessage(error.message || "Failed to send password reset email.");
    }
  });

  // ----- Image upload & prediction logic -----

  fileInput.addEventListener("change", () => {
    if (!isLoggedIn) {
      fileInput.value = "";
      alert("Please log in with a verified email to use digit identification.");
      updatePredictionAccess();
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
      alert("Please log in with a verified email to use digit identification.");
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

      if (data.digit !== undefined && data.digit !== null) {
        resultText.textContent = `Predicted digit(s): ${data.digit}`;
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
