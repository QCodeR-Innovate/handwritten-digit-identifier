// script.js

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const predictButton = document.getElementById("predictButton");
  const resultText = document.getElementById("resultText");

  // When the label is clicked, it triggers the hidden file input automatically

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

  // For now, this is a dummy handler (no backend call yet)
  predictButton.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    // Later we will send selectedFile to backend here
    // For now, just simulate a prediction
    resultText.textContent = "Predicting...";
    
    setTimeout(() => {
      // Dummy digit just for UI testing
      const fakeDigit = 7;
      resultText.textContent = `Predicted digit (dummy): ${fakeDigit}`;
    }, 600);
  });
});
