function showSettings() {
  showModal(
    "Loading",
    "If you see this dm me on slack for an extra free badge :) https://hackclub.slack.com/team/U0971C3C44D"
  );
  fetch("/api/me", {
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
        setParameter("settings", undefined, true);
        const settingsHTML = `
          <div class="settings-form-group settings-form-group-row" style="margin-bottom: 10px;">
            <label for="email" class="settings-label">Email:</label>
            <input
              type="text"
              id="email"
              name="email"
              value="${data.email}"
              disabled
              class="settings-input"
            />
            <button class="settings-edit-btn">
              <img src="/static/images/Pencil.png" alt="Edit Email" title="You cannot edit your email." class="settings-edit-img disabled">
            </button>
          </div>
          <div class="settings-form-group settings-form-group-row" style="margin-bottom: 10px;">
            <label for="username" class="settings-label">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value="@${data.username}"
              class="settings-input"
              disabled
            />
            <button class="settings-edit-btn" onclick="showEditUsername('${data.username}')">
              <img src="/static/images/Pencil.png" alt="Edit Username" title="Edit Username." class="settings-edit-img">
            </button>
          </div>
          `;
        showModal("Settings", settingsHTML, [
          {
            text: "Logout",
            onClick: async () => {
              showModal(
                "Logout?",
                `<p id="modal-text">Are you sure you want to logout?</p>`,
                [
                  {
                    text: "Logout",
                    onClick: async () => {
                      try {
                        const response = await fetch("/api/logout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });
                        const logoutData = await response.json();
                        if (response.ok) {
                          showToast("Logged out successfully!", {
                            color: "success",
                          });
                          hideModal();
                          setTimeout(() => location.reload(), 2000);
                        } else {
                          showToast(logoutData.error || "Logout failed", {
                            color: "error",
                          });
                        }
                      } catch (error) {
                        showToast("An error occurred during logout", {
                          color: "error",
                        });
                      }
                    },
                  },
                  {
                    text: "Cancel",
                    image: "/static/images/LongButtonTwo.png",
                    onClick: () => showSettings(),
                  },
                ]
              );
            },
          },
        ]);
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
  editHTML = `
    <div class="settings-form-group settings-form-group-row" style="margin-bottom: 10px;">
      <label for="username" class="settings-label">Username:</label>
      <input
        type="text"
        id="username"
        name="username"
        value="@${username}"
        class="settings-input"
      />
    </div>
    `;
  showModal("Edit Username", editHTML, [
    {
      text: "Save",
      onClick: async () => {
        saveButton.disabled = true;
        document.getElementById("save-btn-text").textContent = "Saving...";
        saveBtnText = document.getElementById("save-btn-text");
        saveBtnText.textContent = "Saving.";
        let dots = 1;
        const interval = setInterval(() => {
          dots = (dots % 3) + 1;
          saveBtnText.textContent = "Saving" + ".".repeat(dots);
        }, 300);
        const newUsername = usernameInput.value.slice(1);
        try {
          const response = await fetch("/api/editprofile", {
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
            document.getElementById("save-btn-text").textContent = "Save";
          }
        } catch (err) {
          showToast("An error occurred while updating your username", {
            color: "error",
          });
          console.log("Update username error:", err);
          saveBtnText.textContent = "Save";
          saveButton.disabled = false;
        }
      },
      id: "save-btn",
      textid: "save-btn-text",
    },
    {
      text: "Cancel",
      image: "/static/images/LongButtonTwo.png",
      onClick: () => showSettings(),
    },
  ]);
  const saveButton = document.getElementById("save-btn");
  const usernameInput = document.getElementById("username");
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
      cleanedValue !== "";
    if (cleanedValue === username) {
      usernameValid = false;
    }
    if (usernameValid) {
      this.classList.remove("error");
    } else {
      this.classList.add("error");
    }
    updateSaveBtn();
  });
  saveButton.disabled = true;
}
function showEditAvatar() {
  fetch("/api/me", {
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
      let avatar_border = data.avatar_border ?? "NONE";
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
      modalHTML = `
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
      showModal("Edit Avatar", modalHTML, [
        {
          text: "Save",
          onClick: async () => {
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
              const hair = selectedHair
                ? selectedHair.dataset.value
                : "one_brown";
              const selectedBackground = document.querySelector(
                "#background-options .avatar-option.selected"
              );
              const background = selectedBackground
                ? selectedBackground.dataset.value
                : avatar_background ?? "GREY";
              const newAvatar = JSON.stringify({ face, eyes, hair });
              const response = await fetch("/api/editprofile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  avatar: newAvatar,
                  avatar_background: background,
                }),
              });
              if (response.ok) {
                showToast("Avatar updated!", { color: "success" });
                showProfile();
              } else {
                showToast("An error occurred while updating avatar", {
                  color: "error",
                });
              }
            } catch (err) {
              showToast("An error occurred while updating avatar", {
                color: "error",
              });
            }
          },
          id: "save-avatar-btn",
          textid: "save-avatar-text",
        },
      ]);
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
    })
    .catch((err) => {
      showToast("Failed to load current avatar", { color: "error" });
    });
}
