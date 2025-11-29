// script.js

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const predictButton = document.getElementById("predictButton");
  const resultText = document.getElementById("resultText");

  // When a file is selected
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

    // Validate file type: only allow jpeg/png
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

  // Click handler for Predict button
  predictButton.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    resultText.textContent = "Predicting...";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // For now, backend is running locally on port 8000
      const response = await fetch("http://127.0.0.1:8000/predict", {
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
      if (typeof data.digit === "number") {
        resultText.textContent = `Predicted digit: ${data.digit}`;
      } else {
        resultText.textContent = "Unexpected response from server.";
        console.log("Response data:", data);
      }
    } catch (error) {
      console.error("Request error:", error);
      resultText.textContent = "Network error. Please check if the backend is running.";
    }
  });
});
