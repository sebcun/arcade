// Base Modal
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalContents = document.getElementById("modal-contents");
const modalButtons = document.getElementById("modal-buttons");
const closeBtn = document.querySelector("#modal .close");

function showModal(
  title = "Placeholder Title",
  content = "Place",
  buttons = [],
  hideGameTF = true
) {
  if (hideGameTF) {
    hideGame();
  }

  modalTitle.textContent = title;
  modalContents.innerHTML = content;

  modalButtons.innerHTML = "";

  buttons.forEach((btnConfig) => {
    const button = document.createElement("button");
    button.className = "long-button";
    button.id = btnConfig.id || "";

    const img = document.createElement("img");
    img.src = btnConfig.image || "/static/images/LongButton.png";
    img.alt = btnConfig.alt || "Button Image";
    button.appendChild(img);

    const span = document.createElement("span");
    span.textContent = btnConfig.text;
    span.id = btnConfig.textid || "";
    button.appendChild(span);
    if (btnConfig.onClick) {
      button.addEventListener("click", btnConfig.onClick);
    }
    modalButtons.appendChild(button);
  });

  modal.style.display = "flex";
  modal.offsetHeight;
  modal.classList.add("show");
}

function hideModal() {
  modal.classList.remove("show");
  clearParameters();

  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
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

  showModal(title, `${message}${codeFormHTML}`, [
    {
      text: "Verify",
      id: "submit-code-btn",
      textid: "submit-code-txt",
      onClick: () => {
        const hiddenCode = document.getElementById("code");
        const verifyBtn = document.getElementById("submit-code-btn");
        const verifySpan = document.getElementById("submit-code-txt");
        const codeVal = hiddenCode ? hiddenCode.value : "";

        if (!hiddenCode || codeVal.length < 6) {
          document.querySelectorAll("#code-inputs .code-digit").forEach((d) => {
            if (!d.value) d.classList.add("error");
          });
          showToast("Please enter the 6-digit code.", { color: "error" });
          return;
        }

        verifyBtn.disabled = true;

        verifySpan.textContent = "Verifying.";
        let dots = 1;
        const interval = setInterval(() => {
          dots = (dots % 3) + 1;
          verifySpan.textContent = "Verifying" + ".".repeat(dots);
        }, 300);

        fetch("/api/auth/verify_code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email, code: codeVal, mode: mode }),
        })
          .then(async (resp) => {
            clearInterval(interval);
            verifySpan.textContent = "Verify";
            verifyBtn.disabled = false;
            const data = await resp.json();
            if (!resp.ok) {
              showToast(data.error || "Invalid code.", { color: "error" });
              document
                .querySelectorAll("#code-inputs .code-digit")
                .forEach((d) => {
                  if (!d.value) d.classList.add("error");
                });
              return;
            }
            showToast(
              mode === "register"
                ? "Account created and logged in!"
                : "Logged in!",
              {
                color: "success",
              }
            );
            // refresh after a short delay so the UI reflects logged-in state
            setTimeout(() => {
              location.reload();
            }, 600);
          })
          .catch((err) => {
            clearInterval(interval);
            verifySpan.textContent = "Verify";
            verifyBtn.disabled = false;
            showToast("Failed to verify code.", { color: "error" });
            console.error(err);
          });
      },
    },
    {
      text: "Resend Code in 30s",
      id: "resend-code-btn",
      image: "/static/images/LongButtonTwo.png",
      textid: "resend-code-txt",
      onClick: () => {
        // handled below
      },
    },
  ]);

  const digitInputs = Array.from(
    document.querySelectorAll("#code-inputs .code-digit")
  );
  const hiddenCode = document.getElementById("code");

  if (digitInputs.length === 0 || !hiddenCode) return;

  const verifyBtn = document.getElementById("submit-code-btn");
  verifyBtn.disabled = true;

  const resendCodeBtn = document.getElementById("resend-code-btn");
  let resendTimer = null;
  let resendSeconds = 30;

  function startResendCooldown() {
    resendCodeBtn.disabled = true;
    const resendSpan = document.getElementById("resend-code-txt");
    resendSeconds = 30;
    resendSpan.textContent = `Resend Code in ${resendSeconds}s`;
    resendTimer = setInterval(() => {
      resendSeconds--;
      if (resendSeconds <= 0) {
        clearInterval(resendTimer);
        resendTimer = null;
        resendCodeBtn.disabled = false;
        resendSpan.textContent = "Resend Code";
      } else {
        resendSpan.textContent = `Resend Code in ${resendSeconds}s`;
      }
    }, 1000);
  }

  startResendCooldown();

  if (resendCodeBtn) {
    resendCodeBtn.addEventListener("click", () => {
      if (resendCodeBtn.disabled) return;

      resendCodeBtn.disabled = true;
      const resendSpan = document.getElementById("resend-code-txt");
      const originalText = resendSpan.textContent;
      let dots = 1;
      resendSpan.textContent = "Sending.";
      const sendingInterval = setInterval(() => {
        dots = (dots % 3) + 1;
        resendSpan.textContent = "Sending" + ".".repeat(dots);
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
            showToast(data.error || "Failed to resend code.", {
              color: "error",
            });
            resendCodeBtn.disabled = false;
            resendSpan.textContent = "Resend Code";
            return;
          }
          showToast("Verification code resent.", { color: "success" });
          startResendCooldown();
        })
        .catch((err) => {
          clearInterval(sendingInterval);
          showToast("Failed to resend code.", { color: "error" });
          resendCodeBtn.disabled = false;
          resendSpan.textContent = "Resend Code";
          console.error(err);
        });
    });
  }

  function updateHidden() {
    const val = digitInputs.map((i) => i.value || "").join("");
    hiddenCode.value = val;

    if (val.length === digitInputs.length) {
      digitInputs.forEach((i) => i.classList.remove("error"));
    }

    if (verifyBtn)
      verifyBtn.disabled = hiddenCode.value.length !== digitInputs.length;
  }

  digitInputs[0].focus();

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
            e.preventDefault;
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
}

function showLoginModal() {
  const loginFormHTML = `
  <form id="login-form" class="login-form">
    <div class="form-group" style="margin-bottom: 20px">
      <label for="email">Email:</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="Enter your email"
      />
    </div>
  </form>
  `;

  showModal("Login", loginFormHTML, []);

  const emailInput = document.getElementById("email");

  // clear previous buttons
  modalButtons.innerHTML = "";

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "long-button";
  nextButton.id = "login-next-btn";

  const nextImg = document.createElement("img");
  nextImg.src = "/static/images/LongButton.png";
  nextImg.alt = "Next Button";
  nextButton.appendChild(nextImg);

  const nextSpan = document.createElement("span");
  nextSpan.id = "login-next-txt";
  nextSpan.textContent = "Next";
  nextButton.appendChild(nextSpan);

  nextButton.disabled = true;
  modalButtons.appendChild(nextButton);

  // OR separator
  const seperator = document.createElement("div");
  seperator.className = "modal-seperator";
  seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
  modalButtons.appendChild(seperator);

  // Create an Account (long button)
  const registerButton = document.createElement("button");
  registerButton.className = "long-button";
  registerButton.addEventListener("click", function (e) {
    e.preventDefault();
    showRegisterModal();
  });

  const registerImage = document.createElement("img");
  registerImage.src = "/static/images/LongButtonTwo.png";
  registerImage.alt = "Create Account Button";
  registerButton.appendChild(registerImage);

  const registerSpan = document.createElement("span");
  registerSpan.textContent = "Create an Account";
  registerButton.appendChild(registerSpan);

  modalButtons.appendChild(registerButton);

  // Slack square button (below the long button)
  const slackLoginButton = document.createElement("button");
  slackLoginButton.className = "square-button slack-btn";
  slackLoginButton.title = "Sign in with Slack";

  const slackLoginImg = document.createElement("img");
  slackLoginImg.src = "/static/images/SlackBtn.png";
  slackLoginImg.alt = "Slack Sign In";
  slackLoginButton.appendChild(slackLoginImg);

  slackLoginButton.addEventListener("click", () => {
    window.location.href = "/api/auth/slack";
  });

  // append Slack below the Create Account button
  modalButtons.appendChild(slackLoginButton);

  function updateNextButton() {
    const emailValid = emailInput.checkValidity();
    nextButton.disabled = !emailValid;
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
    nextSpan.textContent = "Sending Code.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      nextSpan.textContent = "Sending Code" + ".".repeat(dots);
    }, 300);

    fetch("/api/auth/send_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, mode: "login" }),
    })
      .then(async (resp) => {
        clearInterval(interval);
        nextSpan.textContent = "Next";
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
        nextSpan.textContent = "Next";
        nextButton.disabled = false;
        showToast("Failed to send code.", { color: "error" });
        console.error(err);
      });
  });
}

function showRegisterModal() {
  const registerFormHTML = `
  <form id="register-form" class="register-form">
    <div class="form-group">
        <label for="email">Email:</label>
        <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="Enter your email"
        />
    </div>

      <div class="form-group">
        <label for="username">Username:</label>
        <input
            type="text"
            id="username"
            name="username"
            required
            placeholder="Enter your username"
        />
    </div>

    <div class="form-group" style="margin-bottom: 12px">
        <label class="checkbox-label">
          <input type="checkbox" id="agree-tos" />
          I agree to the <a href="/tos" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
        </label>
    </div>
  </form>
  `;

  showModal("Create an Account", registerFormHTML, []);

  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const agreeCheckbox = document.getElementById("agree-tos");

  let usernameValid = false;

  // Next button (top)
  const nextButton = document.createElement("button");
  nextButton.className = "long-button";

  const nextImg = document.createElement("img");
  nextImg.src = "/static/images/LongButton.png";
  nextImg.alt = "Next Button";
  nextButton.appendChild(nextImg);

  const nextSpan = document.createElement("span");
  nextSpan.textContent = "Next";
  nextButton.appendChild(nextSpan);
  nextButton.disabled = true;

  // Login long button (middle)
  const loginButton = document.createElement("button");
  loginButton.className = "long-button";
  loginButton.addEventListener("click", function (e) {
    e.preventDefault();
    showLoginModal();
  });

  const loginImg = document.createElement("img");
  loginImg.src = "/static/images/LongButtonTwo.png";
  loginImg.alt = "Login Button";
  loginButton.appendChild(loginImg);

  const loginSpan = document.createElement("span");
  loginSpan.textContent = "Login";
  loginButton.appendChild(loginSpan);

  // Slack square button (below the Login button) - disabled until agree checked
  const slackRegisterButton = document.createElement("button");
  slackRegisterButton.className = "square-button slack-btn";
  slackRegisterButton.title = "Create an account with Slack";
  slackRegisterButton.disabled = !agreeCheckbox.checked;
  slackRegisterButton.setAttribute(
    "aria-disabled",
    slackRegisterButton.disabled ? "true" : "false"
  );

  const slackRegisterImg = document.createElement("img");
  slackRegisterImg.src = "/static/images/SlackBtn.png";
  slackRegisterImg.alt = "Slack Sign Up";
  slackRegisterButton.appendChild(slackRegisterImg);

  slackRegisterButton.addEventListener("click", () => {
    if (slackRegisterButton.disabled) return;
    window.location.href = "/api/auth/slack";
  });

  function updateNextButton() {
    const emailValid = emailInput.checkValidity();
    const agreed = agreeCheckbox.checked;
    nextButton.disabled = !(emailValid && usernameValid && agreed);
    slackRegisterButton.disabled = !agreed;
    slackRegisterButton.setAttribute(
      "aria-disabled",
      slackRegisterButton.disabled ? "true" : "false"
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

  // Build modal buttons area
  modalButtons.innerHTML = "";
  modalButtons.appendChild(nextButton);

  const seperator = document.createElement("div");
  seperator.className = "modal-seperator";
  seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
  modalButtons.appendChild(seperator);

  modalButtons.appendChild(loginButton);
  // append Slack below the Login button
  modalButtons.appendChild(slackRegisterButton);

  // Hook up next button behavior (send code)
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
    nextSpan.textContent = "Sending Code.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      nextSpan.textContent = "Sending Code" + ".".repeat(dots);
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
        nextSpan.textContent = "Next";
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
        nextSpan.textContent = "Next";
        nextButton.disabled = false;
        showToast("Failed to send code.", { color: "error" });
        console.error(err);
      });
  });

  // initial sync
  updateNextButton();
}

closeBtn.addEventListener("click", hideModal);

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    hideModal();
  }
});
