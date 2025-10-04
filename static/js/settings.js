function showSettings() {
  fetch("/api/user", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showLoginModal();
        showError("You are not logged in!");
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

        const editUsernameButton = document.createElement("button");
        editUsernameButton.className = "btn btn-primary btn-long";
        editUsernameButton.textContent = "Edit Username";
        editUsernameButton.addEventListener("click", () =>
          showEditUsername(data.username)
        );
        modalFooter.appendChild(editUsernameButton);

        const editAvatarButton = document.createElement("button");
        editAvatarButton.className = "btn btn-secondary btn-long";
        editAvatarButton.textContent = "Edit Avatar";
        editAvatarButton.addEventListener("click", () => showEditAvatar());
        modalFooter.appendChild(editAvatarButton);

        const separator = document.createElement("div");
        separator.className = "modal-seperator";
        separator.innerHTML = `<span class="modal-seperator-text">OR</span>`;
        modalFooter.appendChild(separator);

        const logoutButton = document.createElement("button");
        logoutButton.className = "btn btn-outline-danger btn-long";
        logoutButton.textContent = "Logout";
        logoutButton.addEventListener("click", () => showLogoutConfirmation());
        modalFooter.appendChild(logoutButton);
      }
    })
    .catch((err) => {
      showError("There was an issue loading your profile.");
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

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-primary btn-long";
  saveButton.textContent = "Save";
  saveButton.id = "save-btn";
  saveButton.disabled = true;
  modalFooter.appendChild(saveButton);

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
        showError(errorData.error || "Username already taken.");
        console.log("Update username error:", errorData.error);
        saveButton.textContent = "Save";
        saveButton.disabled = false;
      }
    } catch (err) {
      clearInterval(interval);
      showError("An error occurred while updating your username");
      console.log("Update username error:", err);
      saveButton.textContent = "Save";
      saveButton.disabled = false;
    }
  });
}

function showEditAvatar(preselectedBackground = null) {
  fetch("/api/user", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      fetch("/api/purchases", {
        method: "GET",
        credentials: "include",
      })
        .then((response) => response.json())
        .then((purchasesData) => {
          const purchasedItems = new Set(
            purchasesData.map((purchase) => purchase.item_id)
          );

          const itemIdToBackground = {
            1: "RED",
            2: "ORANGE",
            3: "YELLOW",
            4: "GREEN",
            5: "BLUE",
            6: "PURPLE",
            7: "WHITE",
            8: "BLACK",
          };

          let currentAvatar = {
            face: "white",
            eyes: "blue",
            hair: "one_brown",
          };
          if (data.avatar) {
            try {
              currentAvatar = JSON.parse(data.avatar);
            } catch (e) {}
          }
          let avatar_background =
            preselectedBackground || data.avatar_background || "GREY";

          const bgColors = [
            { value: "GREY", cls: "grey", title: "Grey", unlocked: true },
            {
              value: "RED",
              cls: "red",
              title: "Red",
              unlocked: purchasedItems.has(1),
            },
            {
              value: "ORANGE",
              cls: "orange",
              title: "Orange",
              unlocked: purchasedItems.has(2),
            },
            {
              value: "YELLOW",
              cls: "yellow",
              title: "Yellow",
              unlocked: purchasedItems.has(3),
            },
            {
              value: "GREEN",
              cls: "green",
              title: "Green",
              unlocked: purchasedItems.has(4),
            },
            {
              value: "BLUE",
              cls: "blue",
              title: "Blue",
              unlocked: purchasedItems.has(5),
            },
            {
              value: "PURPLE",
              cls: "purple",
              title: "Purple",
              unlocked: purchasedItems.has(6),
            },
            {
              value: "WHITE",
              cls: "white",
              title: "White",
              unlocked: purchasedItems.has(7),
            },
            {
              value: "BLACK",
              cls: "black",
              title: "Black",
              unlocked: purchasedItems.has(8),
            },
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
                  ? `<div class="avatar-option ${
                      !it.unlocked ? "locked" : ""
                    }" data-value="${it.value}" title="${it.title}">
                       <div class="color-box ${it.cls}"></div>
                       ${
                         !it.unlocked
                           ? '<i class="bi bi-lock-fill lock-icon"></i>'
                           : ""
                       }
                     </div>`
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

          const saveButton = document.createElement("button");
          saveButton.className = "btn btn-primary btn-long";
          saveButton.textContent = "Save";
          saveButton.id = "save-avatar-btn";
          modalFooter.appendChild(saveButton);

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
              if (opt.dataset.value === matchValue)
                opt.classList.add("selected");
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
                if (this.classList.contains("locked")) {
                  const backgroundValue = this.dataset.value;
                  const backgroundToItemId = {
                    RED: 1,
                    ORANGE: 2,
                    YELLOW: 3,
                    GREEN: 4,
                    BLUE: 5,
                    PURPLE: 6,
                    WHITE: 7,
                    BLACK: 8,
                  };
                  const item_id = backgroundToItemId[backgroundValue];

                  const lockedItemHTML = `
                    <p class="modal-text">This background color is locked! Would you like to purchase it? You have ${data.coins} coins.</p>
                  `;

                  const lockedModal = showModal(
                    "Background Locked",
                    "",
                    lockedItemHTML,
                    [],
                    true
                  );

                  const modalFooter = document.createElement("div");
                  modalFooter.className = "modal-footer custom-modal-footer";
                  lockedModal
                    .querySelector(".modal-content")
                    .appendChild(modalFooter);

                  const shopButton = document.createElement("button");
                  shopButton.className = "btn btn-primary btn-long";
                  if (data.coins < 10) {
                    shopButton.disabled = true;
                  }
                  shopButton.textContent = "Purchase (10 Coins)";
                  shopButton.addEventListener("click", async () => {
                    shopButton.disabled = true;
                    shopButton.textContent = "Purchasing.";
                    let dots = 1;
                    const interval = setInterval(() => {
                      dots = (dots % 3) + 1;
                      shopButton.textContent = "Purchasing" + ".".repeat(dots);
                    }, 300);

                    try {
                      const response = await fetch("/api/purchase", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ item_id: item_id }),
                      });

                      clearInterval(interval);
                      const result = await response.json();

                      console.log(result);

                      if (response.ok) {
                        showToast("Background purchased successfully!", {
                          color: "success",
                        });
                        lockedModal.remove();
                        const currentModal = document.querySelector(".modal");
                        if (currentModal) {
                          currentModal.remove();
                        }
                        setTimeout(() => {
                          showEditAvatar(backgroundValue);
                        }, 100);
                      } else {
                        showError(result.error || "Purchase failed");
                        shopButton.textContent = "Purchase (10 Coins)";
                        shopButton.disabled = false;
                      }
                    } catch (err) {
                      clearInterval(interval);
                      showError("An error occurred during purchase");
                      console.log("Purchase error:", err);
                      shopButton.textContent = "Purchase (10 Coins)";
                      shopButton.disabled = false;
                    }
                  });
                  modalFooter.appendChild(shopButton);

                  const closeButton = document.createElement("button");
                  closeButton.className = "btn btn-secondary btn-long";
                  closeButton.textContent = "Close";
                  closeButton.addEventListener("click", () => {
                    showEditAvatar();
                  });
                  modalFooter.appendChild(closeButton);

                  return;
                }

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
                showError(
                  errorData.error || "An error occurred while updating avatar"
                );
                saveButton.textContent = "Save";
                saveButton.disabled = false;
              }
            } catch (err) {
              clearInterval(interval);
              showError("An error occurred while updating avatar");
              console.log("Update avatar error:", err);
              saveButton.textContent = "Save";
              saveButton.disabled = false;
            }
          });
        });
    })
    .catch((err) => {
      showError("Failed to load current avatar");
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

  const logoutButton = document.createElement("button");
  logoutButton.className = "btn btn-danger btn-long";
  logoutButton.textContent = "Logout";
  modalFooter.appendChild(logoutButton);

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary btn-long";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => showSettings());
  modalFooter.appendChild(cancelButton);

  logoutButton.addEventListener("click", async () => {
    window.location.href = "/api/auth/logout";
  });
}
