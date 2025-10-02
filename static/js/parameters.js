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
  if (LOGGEDIN === "True") {
    clearParameters();
  } else {
    showRegisterModal();
  }
} else if (params.has("settings")) {
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
}
