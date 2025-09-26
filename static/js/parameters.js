// Variables
const params = new URLSearchParams(window.location.search);

function clearParameters() {
  window.history.replaceState({}, "", `${window.location.pathname}`);
  window.name = "Arcade";
}
function setParameter(key, value, noValue = false) {
  clearParameters();
  const params = new URLSearchParams(window.location.search);
  if (noValue) {
    let query = params.toString();
    if (query) query += "&";
    query += key;
    window.history.replaceState({}, "", `${window.location.pathname}?${query}`);
  } else {
    if (value !== undefined) {
      params.set(key, value);
    } else {
      params.set(key, "");
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }
}

if (params.has("login")) {
  if (LOGGEDIN === "True") {
    clearParameters();
  } else {
    showLoginModal();
  }

  // Get rid of parameters in URL
} else if (params.has("register")) {
  // Show register page if URL has ?register
  if (LOGGEDIN === "True") {
    clearParameters();
  } else {
    showRegisterModal();
  }
  // Get rid of parameters in URL
} else if (params.has("settings")) {
  // Show settings page if URL has ?settings
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
} else if (params.has("profile")) {
  // Show profile page if URL has ?profile
  const profileValue = params.get("profile");

  // If a profile value is given load other profile (?profile=<id>)
  if (profileValue) {
    showProfile(profileValue);
  } else {
    // Otherwise show own profile
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
  }
} else if (params.has("game")) {
  const gameValue = params.get("game");
  if (gameValue) {
    startGame(Number(gameValue));
  }
}
