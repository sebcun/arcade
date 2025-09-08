// Mobile menu handler
document.querySelector(".hamburger").addEventListener("click", function () {
  document.querySelector(".mobile-menu").classList.toggle("open");
});

// Profile
document.getElementById("profile-btn").addEventListener("click", function () {
  if (LOGGEDIN === "True") {
    showProfile();
  } else {
    showModal(
      "You are not logged in!",
      `<p id="modal-text">Create an account or log in to save your results, level up, and customize your avatar!</p>`,
      [
        {
          text: "Login",
          onClick: () => showLoginModal(),
        },
        {
          text: "Create an Account",
          image: "/static/images/LongButtonTwo.png",
          onClick: () => showRegisterModal(),
        },
      ]
    );
  }
});

document
  .getElementById("profile-btn-mobile")
  .addEventListener("click", function () {
    if (LOGGEDIN === "True") {
      showProfile();
    } else {
      showModal(
        "You are not logged in!",
        `<p id="modal-text">Create an account or log in to save your results, level up, and customize your avatar!</p>`,
        [
          {
            text: "Login",
            onClick: () => showLoginModal(),
          },
          {
            text: "Create an Account",
            image: "/static/images/LongButtonTwo.png",
            onClick: () => showRegisterModal(),
          },
        ]
      );
    }
  });

// Settings
const settingsBtn = document.getElementById("settings-btn");
if (settingsBtn) {
  settingsBtn.addEventListener("click", function () {
    if (LOGGEDIN === "True") {
      showSettings();
    } else {
      showModal(
        "You are not logged in!",
        `<p id="modal-text">Create an account or log in to save your results, level up, and customize your avatar!</p>`,
        [
          {
            text: "Login",
            onClick: () => showLoginModal(),
          },
          {
            text: "Create an Account",
            image: "/static/images/LongButtonTwo.png",
            onClick: () => showRegisterModal(),
          },
        ]
      );
    }
  });
}

const settingsBtnMobile = document.getElementById("settings-btn-mobile");
if (settingsBtnMobile) {
  settingsBtnMobile.addEventListener("click", function () {
    if (LOGGEDIN === "True") {
      showSettings();
    } else {
      showModal(
        "You are not logged in!",
        `<p id="modal-text">Create an account or log in to save your results, level up, and customize your avatar!</p>`,
        [
          {
            text: "Login",
            onClick: () => showLoginModal(),
          },
          {
            text: "Create an Account",
            image: "/static/images/LongButtonTwo.png",
            onClick: () => showRegisterModal(),
          },
        ]
      );
    }
  });
}

// Notificaitons
const notificationsBtn = document.getElementById("notifications-btn");
if (notificationsBtn) {
  notificationsBtn.addEventListener("click", function () {
    showToast("Coming soon.");
  });
}

const notificationsBtnMobile = document.getElementById(
  "notifications-btn-mobile"
);
if (notificationsBtnMobile) {
  notificationsBtnMobile.addEventListener("click", function () {
    showToast("Coming soon.");
  });
}
