function showSettings() {
  fetch("/api/user", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showLoginModal();
        showToast("You are not logged in!", { color: "error" });
        console.log(`Profile loading error: ${data.error}`);
      } else {
        const settingsHTML = `
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="username"
              name="username"
              value="@${data.username}"
              disabled
              placeholder="@username"
            />
            <label for="username">Username</label>
          </div>
        `;

        const modal = showModal("Settings", "", settingsHTML, [], true);

        const modalFooter = document.createElement("div");
        modalFooter.className = "modal-footer custom-modal-footer";
        modal.querySelector(".modal-content").appendChild(modalFooter);

        // Edit Username button
        const editUsernameButton = document.createElement("button");
        editUsernameButton.className = "btn btn-primary btn-long";
        editUsernameButton.textContent = "Edit Username";
        editUsernameButton.addEventListener("click", () =>
          showEditUsername(data.username)
        );
        modalFooter.appendChild(editUsernameButton);

        // Edit Avatar button
        const editAvatarButton = document.createElement("button");
        editAvatarButton.className = "btn btn-secondary btn-long";
        editAvatarButton.textContent = "Edit Avatar";
        editAvatarButton.addEventListener("click", () => showEditAvatar());
        modalFooter.appendChild(editAvatarButton);

        // OR separator
        const separator = document.createElement("div");
        separator.className = "modal-seperator";
        separator.innerHTML = `<span class="modal-seperator-text">OR</span>`;
        modalFooter.appendChild(separator);

        // Logout button
        const logoutButton = document.createElement("button");
        logoutButton.className = "btn btn-outline-danger btn-long";
        logoutButton.textContent = "Logout";
        logoutButton.addEventListener("click", () => showLogoutConfirmation());
        modalFooter.appendChild(logoutButton);
      }
    })
    .catch((err) => {
      showToast("There was an issue loading your profile.", {
        color: "error",
      });
      console.log(`Profile loading error: ${err}`);
    });
}

function showEditUsername(username) {
  const editHTML = `
    <form class="form-floating">
      <input
        type="text"
        class="form-control"
        id="username"
        name="username"
        value="@${username}"
        placeholder="@username"
        required
      />
      <label for="username">Username</label>
      <div class="form-text">Username must be 3-19 characters and contain only letters and numbers</div>
    </form>
  `;

  const modal = showModal("Edit Username", "", editHTML, [], true);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  const usernameInput = modal.querySelector("#username");

  // Save button
  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-primary btn-long";
  saveButton.textContent = "Save";
  saveButton.id = "save-btn";
  saveButton.disabled = true;
  modalFooter.appendChild(saveButton);

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary btn-long";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => showSettings());
  modalFooter.appendChild(cancelButton);

  let usernameValid = false;

  function updateSaveBtn() {
    saveButton.disabled = !usernameValid;
  }

  usernameInput.addEventListener("input", function () {
    let cleanedValue = this.value
      .replace(/ /g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    this.value = "@" + cleanedValue;

    usernameValid =
      cleanedValue.length > 2 &&
      cleanedValue.length < 20 &&
      cleanedValue !== "" &&
      cleanedValue !== username;

    if (usernameValid) {
      this.classList.remove("error");
    } else {
      this.classList.add("error");
    }
    updateSaveBtn();
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveButton.textContent = "Saving.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      saveButton.textContent = "Saving" + ".".repeat(dots);
    }, 300);

    const newUsername = usernameInput.value.slice(1);
    try {
      const response = await fetch("/api/edit_profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username: newUsername }),
      });

      clearInterval(interval);

      if (response.ok) {
        showToast("Username updated!", { color: "success" });
        showSettings();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Username already taken.", {
          color: "error",
        });
        console.log("Update username error:", errorData.error);
        saveButton.textContent = "Save";
        saveButton.disabled = false;
      }
    } catch (err) {
      clearInterval(interval);
      showToast("An error occurred while updating your username", {
        color: "error",
      });
      console.log("Update username error:", err);
      saveButton.textContent = "Save";
      saveButton.disabled = false;
    }
  });
}

function showEditAvatar() {
  fetch("/api/user", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      let currentAvatar = { face: "white", eyes: "blue", hair: "one_brown" };
      if (data.avatar) {
        try {
          currentAvatar = JSON.parse(data.avatar);
        } catch (e) {}
      }
      let avatar_background = data.avatar_background ?? "GREY";

      const bgColors = [
        { value: "GREY", cls: "grey", title: "Grey" },
        { value: "RED", cls: "red", title: "Red" },
        { value: "ORANGE", cls: "orange", title: "Orange" },
        { value: "YELLOW", cls: "yellow", title: "Yellow" },
        { value: "GREEN", cls: "green", title: "Green" },
        { value: "BLUE", cls: "blue", title: "Blue" },
        { value: "PURPLE", cls: "purple", title: "Purple" },
        { value: "WHITE", cls: "white", title: "White" },
        { value: "BLACK", cls: "black", title: "Black" },
      ];

      const faceOptions = [
        {
          value: "white",
          title: "White",
          img: "/static/images/avatars/face/white.png",
        },
        {
          value: "brown",
          title: "Brown",
          img: "/static/images/avatars/face/brown.png",
        },
      ];

      const eyesOptions = [
        {
          value: "blue",
          title: "Blue",
          img: "/static/images/avatars/eyes/blue.png",
        },
        {
          value: "brown",
          title: "Brown",
          img: "/static/images/avatars/eyes/brown.png",
        },
        {
          value: "gray",
          title: "Gray",
          img: "/static/images/avatars/eyes/gray.png",
        },
        {
          value: "green",
          title: "Green",
          img: "/static/images/avatars/eyes/green.png",
        },
      ];

      const hairOptions = [
        {
          value: "one_blonde",
          title: "Blonde (Short)",
          img: "/static/images/avatars/hair/one_blonde.png",
        },
        {
          value: "one_brown",
          title: "Brown (Short)",
          img: "/static/images/avatars/hair/one_brown.png",
        },
        {
          value: "two_blonde",
          title: "Blonde (Long)",
          img: "/static/images/avatars/hair/two_blonde.png",
        },
        {
          value: "two_brown",
          title: "Brown (Long)",
          img: "/static/images/avatars/hair/two_brown.png",
        },
      ];

      const buildOptionsHTML = (items, isColorBox = false) =>
        items
          .map((it) =>
            isColorBox
              ? `<div class="avatar-option" data-value="${it.value}" title="${it.title}"><div class="color-box ${it.cls}"></div></div>`
              : `<div class="avatar-option" data-value="${it.value}" title="${it.title}"><img src="${it.img}" alt="${it.title}"></div>`
          )
          .join("");

      const bgOptionsHTML = buildOptionsHTML(bgColors, true);
      const faceOptionsHTML = buildOptionsHTML(faceOptions, false);
      const eyesOptionsHTML = buildOptionsHTML(eyesOptions, false);
      const hairOptionsHTML = buildOptionsHTML(hairOptions, false);

      const modalHTML = `
        <div class="profile-modal-content">
          <div class="profile-scrollable">
            <div id="preview-avatar" class="profile-avatar ${avatar_background.toLowerCase()}"> 
              <img id="preview-face" src="/static/images/avatars/face/${
                currentAvatar.face
              }.png">
              <img id="preview-eyes" src="/static/images/avatars/eyes/${
                currentAvatar.eyes
              }.png">
              <img id="preview-hair" src="/static/images/avatars/hair/${
                currentAvatar.hair
              }.png">
            </div>
            <div class="profile-details">
              <div class="avatar-category">
                <label>Background:</label>
                <div class="avatar-options" id="background-options">
                  ${bgOptionsHTML}
                </div>
              </div>
              <div class="avatar-category">
                <label>Face:</label>
                <div class="avatar-options" id="face-options">
                  ${faceOptionsHTML}
                </div>
              </div>     
              <div class="avatar-category">
                <label>Eyes:</label>
                <div class="avatar-options" id="eyes-options">
                  ${eyesOptionsHTML}
                </div>
              </div>
              <div class="avatar-category">
                <label>Hair:</label>
                <div class="avatar-options" id="hair-options">
                  ${hairOptionsHTML}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const modal = showModal("Edit Avatar", "", modalHTML, [], true);

      const modalFooter = document.createElement("div");
      modalFooter.className = "modal-footer custom-modal-footer";
      modal.querySelector(".modal-content").appendChild(modalFooter);

      // Save button
      const saveButton = document.createElement("button");
      saveButton.className = "btn btn-primary btn-long";
      saveButton.textContent = "Save";
      saveButton.id = "save-avatar-btn";
      modalFooter.appendChild(saveButton);

      // Cancel button
      const cancelButton = document.createElement("button");
      cancelButton.className = "btn btn-secondary btn-long";
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", () => showSettings());
      modalFooter.appendChild(cancelButton);

      const selectMatching = (containerSelector, matchValue) => {
        const list = document.querySelectorAll(
          `${containerSelector} .avatar-option`
        );
        list.forEach((opt) => {
          if (opt.dataset.value === matchValue) opt.classList.add("selected");
        });
      };

      selectMatching("#face-options", currentAvatar.face);
      selectMatching("#eyes-options", currentAvatar.eyes);
      selectMatching("#hair-options", currentAvatar.hair);
      selectMatching("#background-options", avatar_background);

      const attachImageOptionHandler = (containerId, previewImgId) => {
        document
          .querySelectorAll(`#${containerId} .avatar-option`)
          .forEach((option) => {
            option.addEventListener("click", function () {
              document
                .querySelectorAll(`#${containerId} .avatar-option`)
                .forEach((opt) => opt.classList.remove("selected"));
              this.classList.add("selected");
              const value = this.dataset.value;
              const preview = document.getElementById(previewImgId);
              if (preview)
                preview.src =
                  preview.src.split("/").slice(0, -1).join("/") +
                  `/${value}.png`;
            });
          });
      };

      attachImageOptionHandler("face-options", "preview-face");
      attachImageOptionHandler("eyes-options", "preview-eyes");
      attachImageOptionHandler("hair-options", "preview-hair");

      const bgClassList = bgColors.map((b) => b.cls);
      document
        .querySelectorAll("#background-options .avatar-option")
        .forEach((option) => {
          option.addEventListener("click", function () {
            document
              .querySelectorAll("#background-options .avatar-option")
              .forEach((opt) => opt.classList.remove("selected"));
            this.classList.add("selected");
            const value = this.dataset.value;
            const cls = value.toLowerCase();
            const preview = document.getElementById("preview-avatar");
            if (preview) {
              bgClassList.forEach((c) => preview.classList.remove(c));
              preview.classList.add(cls);
            }
          });
        });

      saveButton.addEventListener("click", async () => {
        saveButton.disabled = true;
        saveButton.textContent = "Saving.";
        let dots = 1;
        const interval = setInterval(() => {
          dots = (dots % 3) + 1;
          saveButton.textContent = "Saving" + ".".repeat(dots);
        }, 300);

        try {
          const selectedFace = document.querySelector(
            "#face-options .avatar-option.selected"
          );
          const face = selectedFace ? selectedFace.dataset.value : "white";
          const selectedEyes = document.querySelector(
            "#eyes-options .avatar-option.selected"
          );
          const eyes = selectedEyes ? selectedEyes.dataset.value : "blue";
          const selectedHair = document.querySelector(
            "#hair-options .avatar-option.selected"
          );
          const hair = selectedHair ? selectedHair.dataset.value : "one_brown";
          const selectedBackground = document.querySelector(
            "#background-options .avatar-option.selected"
          );
          const background = selectedBackground
            ? selectedBackground.dataset.value
            : avatar_background ?? "GREY";

          const newAvatar = JSON.stringify({ face, eyes, hair });

          const response = await fetch("/api/edit_profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              avatar: newAvatar,
              avatar_background: background,
            }),
          });

          clearInterval(interval);

          if (response.ok) {
            showToast("Avatar updated!", { color: "success" });
            showSettings();
          } else {
            const errorData = await response.json();
            showToast(
              errorData.error || "An error occurred while updating avatar",
              {
                color: "error",
              }
            );
            saveButton.textContent = "Save";
            saveButton.disabled = false;
          }
        } catch (err) {
          clearInterval(interval);
          showToast("An error occurred while updating avatar", {
            color: "error",
          });
          console.log("Update avatar error:", err);
          saveButton.textContent = "Save";
          saveButton.disabled = false;
        }
      });
    })
    .catch((err) => {
      showToast("Failed to load current avatar", { color: "error" });
      console.log("Load avatar error:", err);
    });
}

function showLogoutConfirmation() {
  const confirmationHTML = `
    <p class="modal-text">Are you sure you want to logout?</p>
  `;

  const modal = showModal("Logout?", "", confirmationHTML, [], true);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  // Logout button
  const logoutButton = document.createElement("button");
  logoutButton.className = "btn btn-danger btn-long";
  logoutButton.textContent = "Logout";
  modalFooter.appendChild(logoutButton);

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary btn-long";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => showSettings());
  modalFooter.appendChild(cancelButton);

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      logoutButton.textContent = "Logging out" + ".".repeat(dots);
    }, 300);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      clearInterval(interval);

      const logoutData = await response.json();
      if (response.ok) {
        showToast("Logged out successfully!", {
          color: "success",
        });
        setTimeout(() => location.reload(), 2000);
      } else {
        showToast(logoutData.error || "Logout failed", {
          color: "error",
        });
        logoutButton.textContent = "Logout";
        logoutButton.disabled = false;
      }
    } catch (error) {
      clearInterval(interval);
      showToast("An error occurred during logout", {
        color: "error",
      });
      console.log("Logout error:", error);
      logoutButton.textContent = "Logout";
      logoutButton.disabled = false;
    }
  });
}
