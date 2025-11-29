// frontend/script.js

// Your deployed backend base URL on Render
const API_BASE_URL = "https://handwritten-digit-identifier.onrender.com";

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const predictButton = document.getElementById("predictButton");
  const resultText = document.getElementById("resultText");

  // Handle file selection
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) {
      selectedFile = null;
      previewImage.src = "";
      previewImage.classList.add("hidden");
      previewPlaceholder.textContent = "No image selected yet.";
      predictButton.disabled = true;
      resultText.textContent = "No prediction yet.";
      return;
    }

    // Only allow JPEG or PNG
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG image.");
      fileInput.value = "";
      selectedFile = null;
      previewImage.src = "";
      previewImage.classList.add("hidden");
      previewPlaceholder.textContent = "No image selected yet.";
      predictButton.disabled = true;
      resultText.textContent = "No prediction yet.";
      return;
    }

    selectedFile = file;

    // Show preview
    const imageUrl = URL.createObjectURL(file);
    previewImage.src = imageUrl;
    previewImage.onload = () => {
      URL.revokeObjectURL(imageUrl); // free memory
    };

    previewImage.classList.remove("hidden");
    previewPlaceholder.textContent = "";
    predictButton.disabled = false;
    resultText.textContent = "Ready to predict.";
  });

  // Handle Predict button click
  predictButton.addEventListener("click", async () => {
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
      resultText.textContent = "Network error. Please check your connection.";
    }
  });
});
