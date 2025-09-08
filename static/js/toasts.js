// Variables
const toastContainer = document.getElementById("toast-container");

// Show toast
function showToast(text, options = {}) {
  // Create toast, by default color is "info"
  const { color = "info" } = options;
  const toast = document.createElement("div");
  toast.className = `toast ${color}`;
  toast.innerHTML = `${text}`;
  toastContainer.appendChild(toast);

  // Add show for animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remove toast after 5 seconds
  setTimeout(() => {
    removeToast(toast);
  }, 5000);
}

// Remove toast
function removeToast(toast) {
  toast.classList.remove("show");

  // Wait 300ms before removing the toast so animation plays
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}
