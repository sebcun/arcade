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
        // Profile Not Found (not logged in)
        showLoginModal();
        showToast("You are not logged in!", { color: "error" });
        console.log(`Profile loading error: ${data.error}`);
      } else {
        setParameter("settings", undefined, true);
        // Profile Found
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
    // Error loading profile
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
      modalHTML = `
            <div class="profile-modal-content">
                <div class="profile-scrollable">
                    <div class="profile-avatar"> 
                      <img id="preview-face" src="/static/images/avatars/face/${currentAvatar.face}.png">
                      <img id="preview-eyes" src="/static/images/avatars/eyes/${currentAvatar.eyes}.png">
                      <img id="preview-hair" src="/static/images/avatars/hair/${currentAvatar.hair}.png">
                    </div>

                    <div class="profile-details">

                      <div class="avatar-category">
                        <label>Face:</label>
                        <div class="avatar-options" id="face-options">
                          <div class="avatar-option" data-value="white" title="White">
                            <img src="/static/images/avatars/face/white.png" alt="White">
                          </div>
                          <div class="avatar-option" data-value="brown" title="Brown">
                            <img src="/static/images/avatars/face/brown.png" alt="Brown">
                          </div>
                        </div>
                      </div>     

                      <div class="avatar-category">
                        <label>Eyes:</label>
                        <div class="avatar-options" id="eyes-options">
                          <div class="avatar-option" data-value="blue" title="Blue">
                            <img src="/static/images/avatars/eyes/blue.png" alt="Blue">
                          </div>
                          <div class="avatar-option" data-value="brown" title="Brown">
                            <img src="/static/images/avatars/eyes/brown.png" alt="Brown">
                          </div>
                          <div class="avatar-option" data-value="gray" title="Gray">
                            <img src="/static/images/avatars/eyes/gray.png" alt="Gray">
                          </div>
                          <div class="avatar-option" data-value="green" title="Green">
                            <img src="/static/images/avatars/eyes/green.png" alt="Green">
                          </div>
                        </div>
                      </div>

                      <div class="avatar-category">
                        <label>Hair:</label>
                        <div class="avatar-options" id="hair-options">
                          <div class="avatar-option" data-value="one_blonde" title="Blonde (Short)">
                            <img src="/static/images/avatars/hair/one_blonde.png" alt="Blonde Short">
                          </div>
                          <div class="avatar-option" data-value="one_brown" title="Brown (Short)">
                            <img src="/static/images/avatars/hair/one_brown.png" alt="Brown Short">
                          </div>
                          <div class="avatar-option" data-value="two_blonde" title="Blonde (Long)">
                            <img src="/static/images/avatars/hair/two_blonde.png" alt="Blonde Long">
                          </div>
                          <div class="avatar-option" data-value="two_brown" title="Brown (Long)">
                            <img src="/static/images/avatars/hair/two_brown.png" alt="Brown Long">
                          </div>
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
            // Get the selected face
            const selectedFace = document.querySelector(
              "#face-options .avatar-option.selected"
            );
            const face = selectedFace ? selectedFace.dataset.value : "white";

            // Get the selected eyes
            const selectedEyes = document.querySelector(
              "#eyes-options .avatar-option.selected" // Fixed: was "#eye-options"
            );
            const eyes = selectedEyes ? selectedEyes.dataset.value : "blue";

            // Get the selected hair
            const selectedHair = document.querySelector(
              "#hair-options .avatar-option.selected"
            );
            const hair = selectedHair
              ? selectedHair.dataset.value
              : "one_brown";

            const newAvatar = JSON.stringify({ face, eyes, hair });

            // Submit response
            try {
              const response = await fetch("/api/editprofile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ avatar: newAvatar }),
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

      // Pre load selected option with the current options
      document
        .querySelectorAll("#face-options .avatar-option")
        .forEach((option) => {
          if (option.dataset.value === currentAvatar.face) {
            option.classList.add("selected");
          }
        });
      document
        .querySelectorAll("#eyes-options .avatar-option")
        .forEach((option) => {
          if (option.dataset.value === currentAvatar.eyes) {
            option.classList.add("selected");
          }
        });
      document
        .querySelectorAll("#hair-options .avatar-option")
        .forEach((option) => {
          if (option.dataset.value === currentAvatar.hair) {
            option.classList.add("selected");
          }
        });

      document
        .querySelectorAll("#face-options .avatar-option")
        .forEach((option) => {
          option.addEventListener("click", function () {
            document
              .querySelectorAll("#face-options .avatar-option")
              .forEach((opt) => opt.classList.remove("selected"));
            this.classList.add("selected");
            const value = this.dataset.value;
            document.getElementById(
              "preview-face"
            ).src = `/static/images/avatars/face/${value}.png`;
          });
        });

      // Add click listeners for eyes options
      document
        .querySelectorAll("#eyes-options .avatar-option")
        .forEach((option) => {
          option.addEventListener("click", function () {
            document
              .querySelectorAll("#eyes-options .avatar-option")
              .forEach((opt) => opt.classList.remove("selected"));
            this.classList.add("selected");
            const value = this.dataset.value;
            document.getElementById(
              "preview-eyes"
            ).src = `/static/images/avatars/eyes/${value}.png`;
          });
        });

      // Add click listeners for hair options
      document
        .querySelectorAll("#hair-options .avatar-option")
        .forEach((option) => {
          option.addEventListener("click", function () {
            document
              .querySelectorAll("#hair-options .avatar-option")
              .forEach((opt) => opt.classList.remove("selected"));
            this.classList.add("selected");
            const value = this.dataset.value;
            document.getElementById(
              "preview-hair"
            ).src = `/static/images/avatars/hair/${value}.png`;
          });
        });
    })
    .catch((err) => {
      showToast("Failed to load current avatar", { color: "error" });
    });
}
