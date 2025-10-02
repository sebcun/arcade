let modalCounter = 0;
const activeModals = [];

function showModal(
  title,
  content = "",
  htmlContent = "",
  buttons = [],
  close = false
) {
  if (close) {
    closeAllModals();
  }

  const modalId = `modal-${++modalCounter}`;

  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = modalId;
  modal.setAttribute("tabindex", "-1");
  modal.setAttribute("aria-labelledby", `${modalId}Label`);
  modal.setAttribute("aria-hidden", "true");

  const modalDialog = document.createElement("div");
  modalDialog.className = "modal-dialog modal-dialog-centered";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content custom-modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header custom-modal-header";

  const titleElement = document.createElement("h1");
  titleElement.className = "modal-title fs-5 custom-modal-title";
  titleElement.id = `${modalId}Label`;
  titleElement.textContent = title;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close custom-modal-close";
  closeButton.setAttribute("data-bs-dismiss", "modal");
  closeButton.setAttribute("aria-label", "Close");

  modalHeader.appendChild(titleElement);
  modalHeader.appendChild(closeButton);

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body custom-modal-body";

  if (content) {
    modalBody.textContent = content;
  } else if (htmlContent) {
    modalBody.innerHTML = htmlContent;
  }

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);

  if (buttons.length > 0) {
    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer custom-modal-footer";

    buttons.forEach((buttonConfig) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = buttonConfig.class || "btn btn-primary";
      if (buttonConfig.id) button.id = buttonConfig.id;
      button.innerHTML = "";
      if (buttonConfig.image) {
        const img = document.createElement("img");
        img.src = buttonConfig.image;
        img.alt = buttonConfig.alt || "Button Image";
        button.appendChild(img);
      }
      const span = document.createElement("span");
      span.textContent = buttonConfig.text || "Button";
      if (buttonConfig.textid) span.id = buttonConfig.textid;
      button.appendChild(span);
      if (typeof buttonConfig.onClick === "function") {
        button.addEventListener("click", (e) => {
          buttonConfig.onClick(e, modal);
        });
      }
      modalFooter.appendChild(button);
    });

    modalContent.appendChild(modalFooter);
  }

  modalDialog.appendChild(modalContent);
  modal.appendChild(modalDialog);

  document.body.appendChild(modal);

  const bootstrapModal = new bootstrap.Modal(modal, {
    backdrop: activeModals.length === 0,
    keyboard: true,
    focus: true,
  });

  modal.addEventListener("shown.bs.modal", () => {
    const baseZIndex = 1050;
    const zIndex = baseZIndex + activeModals.length * 20;
    modal.style.zIndex = zIndex;

    const backdrop = document.querySelector(".modal-backdrop:last-of-type");
    if (backdrop) {
      backdrop.style.zIndex = zIndex - 1;
    }
  });

  activeModals.push({
    id: modalId,
    element: modal,
    bootstrapModal: bootstrapModal,
  });

  bootstrapModal.show();

  modal.addEventListener("hidden.bs.modal", () => {
    const index = activeModals.findIndex((m) => m.id === modalId);
    if (index > -1) {
      activeModals.splice(index, 1);
    }

    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });

  return modal;
}

function closeAllModals() {
  activeModals.forEach((modalObj) => {
    modalObj.bootstrapModal.hide();
  });
}

function showCodeModal(email, mode = "login") {
  const title =
    mode === "register" ? "Verify your Email" : "Enter One Time Code";
  const message =
    mode === "register"
      ? `A verification code was sent to <strong>${email}</strong>. Enter it below to finish creating your account.`
      : `If an account with that email exists, a one time code was sent to <strong>${email}</strong>. Enter it below to sign in`;

  const codeFormHTML = `
    <form id ="code-form" class="code-form">
      <div class="form-group">
        <div id="code-inputs" class="code-inputs" style="display: flex; gap: 8px; margin-top: 8px; margin-bottom: 10px">
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
          <input inputmode="numeric" pattern="[0-9]" maxlength="1" class="code-digit" />
        </div>

        <input type="hidden" id="code" name="code" required />
      </div>
    </form>
  `;

  // Create modal without auto-buttons; we'll append a custom footer like showLogin
  const modal = showModal(title, "", `${message}${codeFormHTML}`, [], true);

  // Create footer and append to modal content
  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  // Verify (primary) button
  const verifyBtn = document.createElement("button");
  verifyBtn.className = "btn btn-primary btn-long";
  verifyBtn.id = "submit-code-btn";
  verifyBtn.textContent = "Verify";
  verifyBtn.disabled = true;
  modalFooter.appendChild(verifyBtn);

  // Resend button (secondary)
  const resendBtn = document.createElement("button");
  resendBtn.className = "btn btn-secondary btn-long";
  resendBtn.id = "resend-code-btn";
  resendBtn.textContent = "Resend Code in 30s";
  modalFooter.appendChild(resendBtn);

  // Grab inputs and hidden field
  const digitInputs = Array.from(
    modal.querySelectorAll("#code-inputs .code-digit")
  );
  const hiddenCode = modal.querySelector("#code");

  if (digitInputs.length === 0 || !hiddenCode) return;

  // State for resend cooldown
  let resendTimer = null;
  let resendSeconds = 30;

  function startResendCooldown() {
    resendBtn.disabled = true;
    resendSeconds = 30;
    resendBtn.textContent = `Resend Code in ${resendSeconds}s`;
    resendTimer = setInterval(() => {
      resendSeconds--;
      if (resendSeconds <= 0) {
        clearInterval(resendTimer);
        resendTimer = null;
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Code";
      } else {
        resendBtn.textContent = `Resend Code in ${resendSeconds}s`;
      }
    }, 1000);
  }

  startResendCooldown();

  // Update hidden input and verify button enabled state
  function updateHidden() {
    const val = digitInputs.map((i) => i.value || "").join("");
    hiddenCode.value = val;

    if (val.length === digitInputs.length) {
      digitInputs.forEach((i) => i.classList.remove("error"));
    }

    verifyBtn.disabled = hiddenCode.value.length !== digitInputs.length;
  }

  // Focus first input
  digitInputs[0].focus();

  // Wire up digit inputs (same behavior as before)
  digitInputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      let v = input.value;
      v = v.replace(/\D/g, "");
      if (v.length > 1) {
        const chars = v.split("");
        input.value = chars.shift() || "";
        let nextIndex = idx + 1;
        while (chars.length && nextIndex < digitInputs.length) {
          digitInputs[nextIndex].value = chars.shift();
          nextIndex++;
        }
      } else {
        input.value = v;
      }

      updateHidden();

      if (input.value && idx < digitInputs.length - 1) {
        digitInputs[idx + 1].focus();
        digitInputs[idx + 1].select?.();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (input.value === "") {
          if (idx > 0) {
            const prev = digitInputs[idx - 1];
            prev.focus();
            prev.value = "";
            updateHidden();
            e.preventDefault();
          } else {
            input.value = "";
            updateHidden();
            e.preventDefault();
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (idx > 0) {
          digitInputs[idx - 1].focus();
        }
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        if (idx < digitInputs.length - 1) {
          digitInputs[idx + 1].focus();
        }
        e.preventDefault();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      const digits = paste.replace(/\D/g, "").split("");
      if (!digits.length) return;
      let cur = idx;

      for (let d of digits) {
        if (cur >= digitInputs.length) break;
        digitInputs[cur].value = d;
        cur++;
      }

      updateHidden();

      const focusIndex = Math.min(idx + digits.length, digitInputs.length - 1);
      digitInputs[focusIndex].focus();
      digitInputs[focusIndex].select?.();
    });
  });

  // Verify button click handler (same logic as previous)
  verifyBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const codeVal = hiddenCode ? hiddenCode.value : "";

    if (!hiddenCode || codeVal.length < digitInputs.length) {
      modal.querySelectorAll("#code-inputs .code-digit").forEach((d) => {
        if (!d.value) d.classList.add("error");
      });
      showToast("Please enter the 6-digit code.", { color: "error" });
      return;
    }

    verifyBtn.disabled = true;
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = "Verifying.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      verifyBtn.textContent = "Verifying" + ".".repeat(dots);
    }, 300);

    fetch("/api/auth/verify_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, code: codeVal, mode: mode }),
    })
      .then(async (resp) => {
        clearInterval(interval);
        verifyBtn.textContent = originalText;
        verifyBtn.disabled = false;
        const data = await resp.json();
        if (!resp.ok) {
          showToast(data.error || "Invalid code.", { color: "error" });
          modal.querySelectorAll("#code-inputs .code-digit").forEach((d) => {
            if (!d.value) d.classList.add("error");
          });
          return;
        }
        showToast(
          mode === "register" ? "Account created and logged in!" : "Logged in!",
          { color: "success" }
        );
        setTimeout(() => {
          location.reload();
        }, 600);
      })
      .catch((err) => {
        clearInterval(interval);
        verifyBtn.textContent = originalText;
        verifyBtn.disabled = false;
        showToast("Failed to verify code.", { color: "error" });
        console.error(err);
      });
  });

  // Resend click handler (uses same fetch logic + cooldown)
  resendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (resendBtn.disabled) return;

    resendBtn.disabled = true;
    const originalText = resendBtn.textContent;
    resendBtn.textContent = "Sending.";
    let dots = 1;
    const sendingInterval = setInterval(() => {
      dots = (dots % 3) + 1;
      resendBtn.textContent = "Sending" + ".".repeat(dots);
    }, 300);

    fetch("/api/auth/send_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, mode: mode }),
    })
      .then(async (resp) => {
        clearInterval(sendingInterval);
        const data = await resp.json();
        if (!resp.ok) {
          showToast(data.error || "Failed to resend code.", { color: "error" });
          resendBtn.disabled = false;
          resendBtn.textContent = "Resend Code";
          return;
        }
        showToast("Verification code resent.", { color: "success" });
        startResendCooldown();
      })
      .catch((err) => {
        clearInterval(sendingInterval);
        showToast("Failed to resend code.", { color: "error" });
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Code";
        console.error(err);
      });
  });
}

function showLoginModal() {
  const loginFormHTML = `
  <form class="form-floating">
    <input 
      type="email" 
      class="form-control" 
      id="email" 
      name="email"
      placeholder="name@example.com" 
    >
    <label for="email">Email Address</label>
  </form>
  `;

  const modal = showModal("Login", "", loginFormHTML, [], true);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  const emailInput = modal.querySelector("#email");

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "btn btn-primary btn-long";
  nextButton.textContent = "Next";
  nextButton.id = "login-next-btn";
  nextButton.disabled = true;
  modalFooter.appendChild(nextButton);

  // OR separator
  const seperator = document.createElement("div");
  seperator.className = "modal-seperator";
  seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
  modalFooter.appendChild(seperator);

  // Create an Account
  const registerButton = document.createElement("button");
  registerButton.className = "btn btn-secondary btn-long";
  registerButton.textContent = "Create an Account";
  registerButton.addEventListener("click", function (e) {
    e.preventDefault();
    showRegisterModal();
  });
  modalFooter.appendChild(registerButton);

  // Slack button like profile
  const slackLoginButton = document.createElement("button");
  slackLoginButton.className = "btn p-0 slack-login-btn";
  slackLoginButton.title = "Sign in with Slack";
  const slackLoginImg = document.createElement("img");
  slackLoginImg.src = "/static/images/SlackBtn.png";
  slackLoginImg.alt = "Slack Sign In";
  slackLoginImg.style.width = "45px";
  slackLoginImg.style.height = "45px";
  slackLoginImg.style.objectFit = "cover";
  slackLoginButton.appendChild(slackLoginImg);
  slackLoginButton.addEventListener("click", () => {
    window.location.href = "/api/auth/slack";
  });
  modalFooter.appendChild(slackLoginButton);

  function updateNextButton() {
    if (emailInput.value === "") {
      nextButton.disabled = true;
    } else {
      const emailValid = emailInput.checkValidity();
      nextButton.disabled = !emailValid;
    }
  }

  emailInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z0-9@._-]/g, "");
    if (this.checkValidity()) {
      this.classList.remove("error");
    } else {
      this.classList.add("error");
    }
    updateNextButton();
  });

  updateNextButton();

  nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    if (!email || !emailInput.checkValidity()) {
      emailInput.classList.add("error");
      showToast("Please enter a valid email.", { color: "error" });
      return;
    }

    nextButton.disabled = true;
    nextButton.textContent = "Sending Code.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      nextButton.textContent = "Sending Code" + ".".repeat(dots);
    }, 300);

    fetch("/api/auth/send_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, mode: "login" }),
    })
      .then(async (resp) => {
        clearInterval(interval);
        nextButton.textContent = "Next";
        nextButton.disabled = false;
        const data = await resp.json();
        if (!resp.ok) {
          emailInput.classList.add("error");
          showToast(data.error || "Failed to send code.", { color: "error" });
          return;
        }
        showToast("Verification code sent.", { color: "success" });
        showCodeModal(email, "login");
      })
      .catch((err) => {
        clearInterval(interval);
        nextButton.textContent = "Next";
        nextButton.disabled = false;
        showToast("Failed to send code.", { color: "error" });
        console.error(err);
      });
  });
}

function showRegisterModal() {
  const registerFormHTML = `
  <form id="register-form" class="register-form">
    <div class="form-floating mb-3">
      <input
        type="email"
        class="form-control"
        id="email"
        name="email"
        placeholder="name@example.com"
        required
      />
      <label for="email">Email address</label>
    </div>

    <div class="form-floating mb-3">
      <input
        type="text"
        class="form-control"
        id="username"
        name="username"
        placeholder="username"
        required
      />
      <label for="username">Username</label>
    </div>

    <div class="form-group" style="margin-bottom: 12px">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="agree-tos" />
        <label class="form-check-label" for="agree-tos">
          I agree to the <a href="/tos" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
        </label>
      </div>
    </div>
  </form>
  `;

  const modal = showModal("Create an Account", "", registerFormHTML, [], true);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  const emailInput = modal.querySelector("#email");
  const usernameInput = modal.querySelector("#username");
  const agreeCheckbox = modal.querySelector("#agree-tos");

  let usernameValid = false;

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "btn btn-primary btn-long";
  nextButton.textContent = "Next";
  nextButton.disabled = true;
  modalFooter.appendChild(nextButton);

  // OR separator
  const seperator = document.createElement("div");
  seperator.className = "modal-seperator";
  seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
  modalFooter.appendChild(seperator);

  // Login button
  const loginButton = document.createElement("button");
  loginButton.className = "btn btn-secondary btn-long";
  loginButton.textContent = "Login";
  loginButton.addEventListener("click", function (e) {
    e.preventDefault();
    showLoginModal();
  });
  modalFooter.appendChild(loginButton);

  // Slack button like profile
  const slackLoginButton = document.createElement("button");
  slackLoginButton.className = "btn p-0 slack-login-btn";
  slackLoginButton.title = "Sign in with Slack";
  const slackLoginImg = document.createElement("img");
  slackLoginImg.src = "/static/images/SlackBtn.png";
  slackLoginImg.alt = "Slack Sign In";
  slackLoginImg.style.width = "45px";
  slackLoginImg.style.height = "45px";
  slackLoginImg.style.objectFit = "cover";
  slackLoginButton.appendChild(slackLoginImg);
  slackLoginButton.addEventListener("click", () => {
    window.location.href = "/api/auth/slack";
  });
  modalFooter.appendChild(slackLoginButton);

  function updateNextButton() {
    const emailValid = emailInput.checkValidity();
    const agreed = agreeCheckbox.checked;
    nextButton.disabled = !(emailValid && usernameValid && agreed);
    slackLoginButton.disabled = !agreed;
    slackLoginButton.setAttribute(
      "aria-disabled",
      slackLoginButton.disabled ? "true" : "false"
    );
  }

  emailInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z0-9@._-]/g, "");
    if (this.checkValidity()) {
      this.classList.remove("error");
    } else {
      this.classList.add("error");
    }
    updateNextButton();
  });

  usernameInput.addEventListener("input", function () {
    this.value = this.value
      .replace(/ /g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const cleanedValue = this.value;
    usernameValid =
      cleanedValue.length > 2 &&
      cleanedValue.length < 20 &&
      cleanedValue !== "";
    if (usernameValid) {
      this.classList.remove("error");
    } else {
      this.classList.add("error");
    }
    updateNextButton();
  });

  agreeCheckbox.addEventListener("change", updateNextButton);

  nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const agreed = document.getElementById("agree-tos").checked;

    if (!email || !emailInput.checkValidity()) {
      emailInput.classList.add("error");
      showToast("Please enter a valid email.", { color: "error" });
      return;
    }
    if (!username || !usernameValid) {
      usernameInput.classList.add("error");
      showToast("Please enter a valid username (3-19 chars).", {
        color: "error",
      });
      return;
    }
    if (!agreed) {
      showToast("You must agree to the Terms of Service and Privacy Policy.", {
        color: "error",
      });
      return;
    }

    nextButton.disabled = true;
    nextButton.textContent = "Sending Code.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      nextButton.textContent = "Sending Code" + ".".repeat(dots);
    }, 300);

    fetch("/api/auth/send_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email,
        username: username,
        mode: "register",
      }),
    })
      .then(async (resp) => {
        clearInterval(interval);
        nextButton.textContent = "Next";
        nextButton.disabled = false;
        const data = await resp.json();
        if (!resp.ok) {
          if (data && data.error) {
            showToast(data.error, { color: "error" });
            if ((data.error || "").toLowerCase().includes("email"))
              emailInput.classList.add("error");
            if ((data.error || "").toLowerCase().includes("username"))
              usernameInput.classList.add("error");
          } else {
            showToast("Failed to send code.", { color: "error" });
          }
          return;
        }

        showToast("Verification code sent.", { color: "success" });
        showCodeModal(email, "register");
      })
      .catch((err) => {
        clearInterval(interval);
        nextButton.textContent = "Next";
        nextButton.disabled = false;
        showToast("Failed to send code.", { color: "error" });
        console.error(err);
      });
  });

  // initial sync
  updateNextButton();
}
