// Base Modal
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalContents = document.getElementById("modal-contents");
const modalButtons = document.getElementById("modal-buttons");
const closeBtn = document.querySelector(".close");

function showModal(
  title = "Placeholder Title",
  content = "Place",
  buttons = []
) {
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

  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

function showLoginModal() {
  showModal(
    "Loading",
    "If you see this dm me on slack for an extra free badge :) https://hackclub.slack.com/team/U0971C3C44D"
  );
  fetch("/api/me", {
    method: "GET",
  }).then((response) => {
    if (!response.ok) {
      const loginFormHTML = `
  <form id="login-form" class="login-form">
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

    <div class="form-group" style="margin-bottom: 20px">
        <label for="password">Password:</label>
        <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="Enter your password"
        />
    </div>

  </form>
  `;

      showModal("Login", loginFormHTML, []);

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      function updateLoginButton() {
        const emailValid = emailInput.checkValidity();
        const passwordEntered = passwordInput.value.trim() !== "";
        loginButton.disabled = !(emailValid && passwordEntered);
      }

      emailInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z0-9@._-]/g, "");
        if (this.checkValidity()) {
          this.classList.remove("error");
        } else {
          this.classList.add("error");
        }
        updateLoginButton();
      });

      passwordInput.addEventListener("input", function () {
        this.value = this.value.replace(/ /g, "");
        if (this.value.trim().length === 0) {
          this.classList.add("error");
        } else {
          this.classList.remove("error");
        }
        updateLoginButton();
      });

      modalButtons.innerHTML = "";

      //   Login Button
      const loginButton = document.createElement("button");
      loginButton.className = "long-button";
      loginButton.addEventListener("click", () => {
        document.getElementById("login-form").requestSubmit();
      });
      loginButton.disabled = true;

      const loginImg = document.createElement("img");
      loginImg.src = "/static/images/LongButton.png";
      loginImg.alt = "Login Button";
      loginButton.appendChild(loginImg);

      const loginSpan = document.createElement("span");
      loginSpan.textContent = "Login";
      loginButton.appendChild(loginSpan);
      modalButtons.appendChild(loginButton);

      //   Or Seperator
      const seperator = document.createElement("div");
      seperator.className = "modal-seperator";
      seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
      modalButtons.appendChild(seperator);

      //   Register Button
      const registerButton = document.createElement("button");
      registerButton.className = "long-button";
      registerButton.addEventListener("click", function () {
        showRegisterModal();
      });

      const registerImage = document.createElement("img");
      registerImage.src = "/static/images/LongButtonTwo.png";
      registerImage.alt = "Login Button";
      registerButton.appendChild(registerImage);

      const registerSpan = document.createElement("span");
      registerSpan.textContent = "Create an Account";
      registerButton.appendChild(registerSpan);
      modalButtons.appendChild(registerButton);

      // Form Submit Handler
      document
        .getElementById("login-form")
        .addEventListener("submit", async (e) => {
          loginButton.disabled = true;
          loginSpan.textContent = "Logging In.";
          let dots = 1;
          const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            loginSpan.textContent = "Logging In" + ".".repeat(dots);
          }, 300);

          e.preventDefault();

          const email = document.getElementById("email").value;
          const password = document.getElementById("password").value;

          try {
            const response = await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            clearInterval(interval);

            const data = await response.json();
            if (response.ok) {
              showToast("Logged in!", { color: "success" });
              hideModal();
              setTimeout(() => location.reload(), 2000);
            } else {
              loginSpan.textContent = "Login";
              updateLoginButton();
              emailInput.classList.add("error");
              passwordInput.classList.add("error");
              showToast(data.error, { color: "error" });
            }
          } catch (error) {
            loginSpan.textContent = "Login";
            updateLoginButton();
            showToast(error, { color: "error" });
            console.log(error);
          }
        });
    }
  });
}

function showRegisterModal() {
  showModal(
    "Loading",
    "If you see this dm me on slack for an extra free badge :) https://hackclub.slack.com/team/U0971C3C44D"
  );
  fetch("/api/me", {
    method: "GET",
  }).then((response) => {
    if (!response.ok) {
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

    <div class="form-group" style="margin-bottom: 20px">
        <label for="password">Password:</label>
        <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="Enter your password"
        />
    </div>

  </form>
  `;

      showModal("Create an Account", registerFormHTML, []);
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const usernameInput = document.getElementById("username");

      let usernameValid = false;
      let passwordValid = false;

      function updateRegisterButton() {
        const emailValid = emailInput.checkValidity();
        registerButton.disabled = !(
          emailValid &&
          passwordValid &&
          usernameValid
        );
      }

      emailInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z0-9@._-]/g, "");
        if (this.checkValidity()) {
          this.classList.remove("error");
        } else {
          this.classList.add("error");
        }
        updateRegisterButton();
      });

      passwordInput.addEventListener("input", function () {
        this.value = this.value.replace(/ /g, "");
        const cleanedPassword = this.value;
        const lengthValid =
          cleanedPassword.length >= 6 && cleanedPassword.length <= 255;
        const hasLower = /[a-z]/.test(cleanedPassword);
        const hasUpper = /[A-Z]/.test(cleanedPassword);
        const hasDigit = /\d/.test(cleanedPassword);
        const hasSpecial = /[^a-zA-Z0-9]/.test(cleanedPassword);
        passwordValid =
          lengthValid && hasLower && hasUpper && hasDigit && hasSpecial;
        if (passwordValid) {
          this.classList.remove("error");
        } else {
          this.classList.add("error");
        }
        updateRegisterButton();
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
        updateRegisterButton();
      });

      modalButtons.innerHTML = "";

      //   Register Button
      const registerButton = document.createElement("button");
      registerButton.className = "long-button";
      registerButton.addEventListener("click", () => {
        document.getElementById("register-form").requestSubmit();
      });
      registerButton.disabled = true;

      const registerImg = document.createElement("img");
      registerImg.src = "/static/images/LongButton.png";
      registerImg.alt = "Login Button";
      registerButton.appendChild(registerImg);

      const registerSpan = document.createElement("span");
      registerSpan.textContent = "Create Account";
      registerButton.appendChild(registerSpan);
      modalButtons.appendChild(registerButton);

      //   Or Seperator
      const seperator = document.createElement("div");
      seperator.className = "modal-seperator";
      seperator.innerHTML = `
  <span class="modal-seperator-text">OR</span>
  `;
      modalButtons.appendChild(seperator);

      //   Login Button
      const loginButton = document.createElement("button");
      loginButton.className = "long-button";
      loginButton.addEventListener("click", function () {
        showLoginModal();
      });

      const loginImg = document.createElement("img");
      loginImg.src = "/static/images/LongButtonTwo.png";
      loginImg.alt = "Login Button";
      loginButton.appendChild(loginImg);

      const loginSpan = document.createElement("span");
      loginSpan.textContent = "Login";
      loginButton.appendChild(loginSpan);
      modalButtons.appendChild(loginButton);

      // Form Submit Handler
      document
        .getElementById("register-form")
        .addEventListener("submit", async (e) => {
          registerButton.disabled = true;
          registerSpan.textContent = "Creating Account.";
          let dots = 1;
          const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            registerSpan.textContent = "Creating Account" + ".".repeat(dots);
          }, 300);

          e.preventDefault();

          const email = document.getElementById("email").value;
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          try {
            const response = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, username, password }),
            });
            clearInterval(interval);
            const data = await response.json();
            if (response.ok) {
              showToast("Created Account!", { color: "success" });
              hideModal();
              setTimeout(() => location.reload(), 2000);
            } else {
              registerSpan.textContent = "Create Account";
              updateRegisterButton();
              if (
                data.error ===
                "An account with this email already exists. Try logging in."
              ) {
                emailInput.classList.add("error");
                showToast(data.error, { color: "error" });
              } else {
                usernameInput.classList.add("error");
                showToast(data.error, { color: "error" });
              }
            }
          } catch (error) {
            registerSpan.textContent = "Create Account";
            updateRegisterButton();
            showToast(error, { color: "error" });
          }
        });
    }
  });
}

closeBtn.addEventListener("click", hideModal);

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    hideModal();
  }
});
