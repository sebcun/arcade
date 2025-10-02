const toastContainer = document.getElementById("toast-container");

const COLOR_TO_BG = {
  info: "primary",
  primary: "primary",
  success: "success",
  danger: "danger",
  warning: "warning",
  light: "light",
  dark: "dark",
  secondary: "secondary",
};

function closeBtnClassFor(bg) {
  if (!bg) return "btn-close me-2 m-auto";
  if (bg === "light" || bg === "warning") return "btn-close me-2 m-auto";
  return "btn-close btn-close-white me-2 m-auto";
}

function showToast(text, options = {}) {
  const { color = "info", delay = 5000, autohide = true } = options;
  const bg = COLOR_TO_BG[color] || COLOR_TO_BG.info;
  const bgClass = `text-bg-${bg}`;

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center ${bgClass} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  const btnClass = closeBtnClassFor(bg);
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${text}
      </div>
      <button type="button" class="${btnClass}" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  const bsToast = new bootstrap.Toast(toastEl, {
    autohide: autohide,
    delay: delay,
  });
  bsToast.show();
  toastEl.addEventListener("hidden.bs.toast", () => {
    if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
  });

  return toastEl;
}

function showInfo(msg, opts = {}) {
  return showToast(msg, { ...opts, color: "info" });
}
function showSuccess(msg, opts = {}) {
  return showToast(msg, { ...opts, color: "success" });
}
function showError(msg, opts = {}) {
  return showToast(msg, { ...opts, color: "danger" });
}
