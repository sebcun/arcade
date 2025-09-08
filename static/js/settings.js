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
          </div>`;

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
