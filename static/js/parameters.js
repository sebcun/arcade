// Variables
const params = new URLSearchParams(window.location.search);

function clearParameters() {
  window.history.replaceState({}, "", `${window.location.pathname}`);
  window.name = "Pixelcade";
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
    if (params.has("target")) {
      showLoginModal(params.get("target"));
      clearParameters();
    } else {
      showLoginModal();
      clearParameters();
    }
  }
} else if (params.has("register")) {
  if (LOGGEDIN === "True") {
    clearParameters();
  } else {
    if (params.has("target")) {
      showRegisterModal(params.get("target"));
      clearParameters();
    } else {
      showRegisterModal();
      clearParameters();
    }
  }
} else if (params.has("404")) {
  clearParameters();
  showModal(
    "Page not found!",
    "The page, user, or game was not found. Good luck finding what you were looking for!",
    null,
    [],
    true
  );
} else if (params.has("401")) {
  clearParameters();
  showModal(
    "Not authorized!",
    "You are not meant to see this page! Turn back before it is too late.",
    null,
    [],
    true
  );
}
