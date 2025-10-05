const developHeading = document.getElementById("developHeading");
const developContainer = document.getElementById("developContainer");
let CURRENT_PAGE = "";
let changesMade = false;

document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
});

async function loadOverview() {
  if (CURRENT_PAGE === "overview") return;

  if (changesMade) {
    const result = await checkIfSaved();
    if (result.action === "cancelled") {
      return;
    }
    if (result.action === "save_failed") {
      return;
    }
  }

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));
  document.getElementById("overviewSidebarLink").classList.add("active");

  CURRENT_PAGE = "overview";

  fetch(`/api/games?id=${GAMEID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      developHeading.textContent = `${data.title} | Overview`;

      let backgroundPurchased = data.purchases.includes(10);
      developContainer.innerHTML = `
      <div class="row">

        <div class="col-12">
          <div class="form-floating w-100">
            <input 
              type="text" 
              class="form-control w-100" 
              id="gameName" 
              name="gameName"
              placeholder="name@example.com" 
              value="${data.title}"
            >
            <label for="gameName">Game Name</label>
          </div>
        </div>

        <div class="col-12 mt-3">
          <div class="form-floating w-100">
            <textarea 
              class="form-control w-100" 
              placeholder="Leave a comment here" 
              id="gameDescription"
            ></textarea>
            <label for="gameDescription">Game Description</label>
          </div>
        </div>

        <div class="col-12 mt-3">
          <h5>Addons Available</h5>
          <div class="d-flex justify-content-between align-items-center w-100 mb-2 sprite-list-item">
            <span>BACKGROUND command</span>
            <div>
              <button class="btn btn-secondary btn-small" ${
                backgroundPurchased ? "disabled" : ""
              } id="purchaseBackgroundBtn">${
        backgroundPurchased ? "Purchased" : "Purchase (30 coins)"
      }</button>
            </div>
          </div>
        </div>

      </div>
      `;

      const titleEl = document.getElementById("gameName");
      const descEl = document.getElementById("gameDescription");
      // const selectEl = document.getElementById("gameVisibility");

      if (descEl) descEl.value = data.description || "";

      descEl.addEventListener("input", () => {
        changesMade = true;
        if (descEl.value.length > 500) {
          descEl.classList.add("error");
        } else {
          descEl.classList.remove("error");
        }
      });

      titleEl.addEventListener("input", () => {
        changesMade = true;
        if (titleEl.value.length === 0) {
          titleEl.classList.add("error");
        } else {
          titleEl.classList.remove("error");
        }
      });

      // selectEl.addEventListener("change", () => {
      //   changesMade = true;
      // });

      const purchaseBackgroundBtn = document.getElementById(
        "purchaseBackgroundBtn"
      );
      purchaseBackgroundBtn.addEventListener("click", () => {
        purchaseBackgroundBtn.disabled = true;
        purchaseBackgroundBtn.textContent = "Purchasing.";
        let dots = 1;
        const interval = setInterval(() => {
          dots = (dots % 3) + 1;
          purchaseBackgroundBtn.textContent = "Purchasing" + ".".repeat(dots);
        }, 300);

        fetch("/api/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ item_id: 10, game_id: GAMEID }),
        })
          .then((response) => {
            clearInterval(interval);
            return response.json().then((result) => {
              if (response.ok) {
                purchaseBackgroundBtn.textContent = "Purchased";
                purchaseBackgroundBtn.disabled = true;
              } else {
                showError(result.error || "Purchase failed");
                purchaseBackgroundBtn.textContent = "Purchase (30 coins)";
                purchaseBackgroundBtn.disabled = false;
              }
            });
          })
          .catch((err) => {
            clearInterval(interval);
            showError("An error occurred during purchase");
            purchaseBackgroundBtn.textContent = "Purchase (30 coins)";
            purchaseBackgroundBtn.disabled = false;
          });
      });
    })
    .catch((err) => {
      console.error("Error loading game:", err);
    });
}

async function saveGame() {
  try {
    if (CURRENT_PAGE === "spriteEditor") {
      const ok = await saveAllSprites();
      if (ok) {
        showSuccess && showSuccess("Sprites saved!");
        changesMade = false;
        return true;
      } else {
        showError && showError("Failed to save sprites");
        return false;
      }
    } else if (CURRENT_PAGE === "codeEditor") {
      const codeEditorInstance = window.codeEditorInstance;

      if (!codeEditorInstance) {
        return false;
      }

      const payload = {
        code: codeEditorInstance.getValue(),
      };

      const response = await fetch(`/api/games/${GAMEID}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.message) {
        showSuccess && showSuccess("Game saved!");
        changesMade = false;
        return true;
      } else {
        showError && showError(data.error || "Failed to save game");
        return false;
      }
    } else if (CURRENT_PAGE === "overview") {
      // Get the form values
      const titleEl = document.getElementById("gameName");
      const descEl = document.getElementById("gameDescription");
      // const selectEl = document.getElementById("gameVisibility");

      if (!titleEl || !descEl) {
        showError && showError("Missing form elements");
        return false;
      }

      // Validate inputs
      if (titleEl.value.trim().length === 0) {
        showError && showError("Game title cannot be empty");
        titleEl.classList.add("error");
        return false;
      }

      if (descEl.value.length > 500) {
        showError && showError("Description must be 500 characters or less");
        descEl.classList.add("error");
        return false;
      }

      // // Map visibility values
      // const visibilityMapping = {
      //   Private: -1,
      //   Public: 0,
      //   Unlisted: 1,
      // };

      const payload = {
        gameName: titleEl.value.trim(),
        gameDescription: descEl.value,
        // gameVisibility: visibilityMapping[selectEl.value],
      };

      const response = await fetch(`/api/games/${GAMEID}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.message) {
        showSuccess && showSuccess("Game saved!");
        changesMade = false;
        titleEl.classList.remove("error");
        descEl.classList.remove("error");
        return true;
      } else {
        showError && showError(data.error || "Failed to save game");
        return false;
      }
    } else {
      showError && showError("Save not implemented for this page");
      return false;
    }
  } catch (err) {
    console.error("Save failed:", err);
    showError && showError("Save failed");
    return false;
  }
}

function checkIfSaved() {
  if (!changesMade) {
    return Promise.resolve({ action: "noop" });
  }

  return new Promise((resolve) => {
    const modal = showModal("You have unsaved changes", "", "", [], true);

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer custom-modal-footer";
    modal.querySelector(".modal-content").appendChild(modalFooter);

    const nextButton = document.createElement("button");
    nextButton.className = "btn btn-primary btn-long";
    nextButton.textContent = "Save";
    nextButton.id = "login-next-btn";
    nextButton.addEventListener("click", async function (e) {
      e.preventDefault();
      const ok = await saveGame();
      if (ok) {
        closeAllModals();
        resolve({ action: "saved" });
      } else {
        resolve({ action: "save_failed" });
      }
    });
    modalFooter.appendChild(nextButton);

    const registerButton = document.createElement("button");
    registerButton.className = "btn btn-secondary btn-long";
    registerButton.textContent = "Cancel";
    registerButton.addEventListener("click", function (e) {
      e.preventDefault();
      closeAllModals();
      resolve({ action: "cancelled" });
    });
    modalFooter.appendChild(registerButton);

    const slackLoginButton = document.createElement("span");
    slackLoginButton.textContent = "Continue without Saving";
    slackLoginButton.className = "modal-link";
    slackLoginButton.addEventListener("click", function (e) {
      e.preventDefault();
      changesMade = false;
      closeAllModals();
      resolve({ action: "continued" });
    });
    modalFooter.appendChild(slackLoginButton);
  });
}

async function loadSpriteEditor() {
  if (CURRENT_PAGE === "spriteEditor") return;

  if (changesMade) {
    const result = await checkIfSaved();
    if (result.action === "cancelled") {
      return;
    }
    if (result.action === "save_failed") {
      return;
    }
  }

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));
  document.getElementById("spriteEditorSidebarLink").classList.add("active");

  CURRENT_PAGE = "spriteEditor";

  fetch(`/api/games?id=${GAMEID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      developHeading.textContent = `${data.title} | Sprite Editor`;
      developContainer.innerHTML = `
        <div class="row">

          <div class="col-5 h-100">
            <div class="w-100 sprite-list">
              <div class="d-flex justify-content-between align-items-center w-100">
                <h4 class="mb-0">Sprites</h4>
                <button id="new-sprite-btn" class="btn btn-primary btn-sm">New Sprite</button>
              </div>
              <div class="w-100 mt-3 sprite-list-container" id="spriteList">
                  <div class="d-flex justify-content-between align-items-center w-100 sprite-list-item">
                    <span>Loading Sprites...</span>
                  </div>
                </div>
            </div>
          </div>

          <div class="col-7 h-100">
            <div class="w-100 sprite-list">
              <div class="d-flex justify-content-between align-items-center w-100">
                <h4 class="mb-0">Sprite Canvas</h4>
              </div>
              <div class="w-100 mt-3 sprite-list-container">
                <div class="canvas-area">

                  <div class="sidebar-buttons">
                    <button id="pencil-btn" class="sidebar-btn active" title="Pencil">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button id="eraser-btn" class="sidebar-btn" title="Eraser">
                      <i class="bi bi-eraser"></i>
                    </button>
                    <button id="clear-btn" class="sidebar-btn" title="Clear">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <div class="canvas-center">
                    <canvas id="pixelCanvas" class="sprite-canvas" width="320" height="320"></canvas>

                    <div class="canvas-actions mt-2 d-flex align-items-center">
                      <input type="color" id="colorPicker" value="#00ff00" style="margin-right:10px;">
                      <button id="save-sprite-btn" class="btn btn-secondary btn-long">Save Sprite</button>
                    </div>
                  </div>

                  <div class="sidebar-buttons mt-3">
                    <!-- color swatches could go here if you want -->
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
        `;
      window.spriteEditor.init(data.max_sprites);
    })
    .catch((err) => {
      console.error("Error loading game:", err);
    });
}

async function loadCodeEditor() {
  if (CURRENT_PAGE === "codeEditor") return;

  if (changesMade) {
    const result = await checkIfSaved();
    if (result.action === "cancelled") {
      return;
    }
    if (result.action === "save_failed") {
      return;
    }
  }

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));
  document.getElementById("codeEditorSidebarLink").classList.add("active");

  CURRENT_PAGE = "codeEditor";

  fetch(`/api/games?id=${GAMEID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      developHeading.textContent = `${data.title} | Code Editor`;
      developContainer.innerHTML = `
        <div class="row">
          <div class="col-12 mt-3">
            <div class="code-editor-container">
              <textarea 
                class="form-control w-100" 
                placeholder="Start coding your Pixelcade game here!" 
                id="code-editor"
              ></textarea>
            </div>
          </div>
        </div>
      `;

      const arcadeHints = [
        // Commands
        "WAIT",
        "LOG",
        "SPAWN",
        "DESPAWN",
        "MOVE",
        "SCALE",
        "TINT",
        "ROTATE",
        "HIDE",
        "SHOW",
        "STORE",
        "TEXT",
        "GIVEXP",

        // LOGIC
        "LOOP",
        "ENDLOOP",
        "STOPLOOP",
        "IF",
        "ENDIF",
        "ONTOUCH",
        "ENDTOUCH",
        "ONKEY",
        "ENDKEY",

        // OTHER

        "AT",
        "AS",
        "TO",
        "WITH",

        // GIVE XP SIZES

        "small",
        "medium",
        "large",
      ];

      CodeMirror.registerHelper("hint", "arcade", function (editor) {
        const cursor = editor.getCursor();
        const currentLine = editor.getLine(cursor.line);
        const start = cursor.ch;
        let end = cursor.ch;

        let wordStart = start;
        while (wordStart > 0 && /\w/.test(currentLine.charAt(wordStart - 1))) {
          wordStart--;
        }

        const currentWord = currentLine.slice(wordStart, start).toUpperCase();

        if (currentWord.length === 0) {
          return null;
        }

        const filteredHints = arcadeHints.filter((hint) =>
          hint.toUpperCase().startsWith(currentWord)
        );

        if (filteredHints.length === 0) {
          return null;
        }

        return {
          list: filteredHints,
          from: CodeMirror.Pos(cursor.line, wordStart),
          to: CodeMirror.Pos(cursor.line, end),
        };
      });

      CodeMirror.defineMode("arcade", function () {
        var keywords = {
          // Commands
          WAIT: true,
          LOG: true,
          SPAWN: true,
          DESPAWN: true,
          MOVE: true,
          SCALE: true,
          TINT: true,
          ROTATE: true,
          HIDE: true,
          SHOW: true,
          STORE: true,
          TEXT: true,
          GIVEXP: true,

          // Logic
          LOOP: true,
          ENDLOOP: true,
          STOPLOOP: true,
          IF: true,
          ENDIF: true,
          ONTOUCH: true,
          ENDTOUCH: true,
          ONKEY: true,
          ENDKEY: true,

          // Other
          AT: true,
          AS: true,
          TO: true,
          WITH: true,
        };

        var sizeModifiers = {
          SMALL: true,
          MEDIUM: true,
          LARGE: true,
        };

        return {
          startState: function () {
            return {
              afterGiveXP: false,
              lineStart: true,
            };
          },

          token: function (stream, state) {
            if (stream.eatSpace()) return null;

            if (state.lineStart) {
              state.afterGiveXP = false;
              state.lineStart = false;
            }

            if (stream.match(/^\/\/.*/)) {
              return "comment";
            }

            if (stream.match(/^'([^'\\]|\\.)*'/)) {
              return "string";
            }

            if (stream.match(/^"([^"\\]|\\.)*"/)) {
              return "string";
            }

            if (stream.match(/^\$\{[^}]*\}/)) {
              return "variable-2";
            }

            if (stream.match(/^\d+(\.\d+)?(#\d+(\.\d+)?)?/)) {
              return "number";
            }

            if (stream.match(/^sprite\d+\.(x|y|rotation|scale)\b/)) {
              return "property";
            }

            if (stream.match(/^sprite\d+/)) {
              return "variable";
            }

            var word = stream.match(/^[A-Z]+/);
            if (word) {
              var wordText = word[0];

              if (wordText === "GIVEXP") {
                state.afterGiveXP = true;
                return "keyword";
              }

              if (state.afterGiveXP && sizeModifiers[wordText]) {
                return "variable";
              }

              if (keywords[wordText]) {
                return "keyword";
              }

              if (sizeModifiers[wordText]) {
                return "keyword";
              }
            }

            if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
              return "def";
            }

            if (stream.match(/^[+\-*/=<>!,()]/)) {
              return "operator";
            }

            stream.next();
            return null;
          },

          blankLine: function (state) {
            state.lineStart = true;
          },
        };
      });

      const codeEditor = CodeMirror.fromTextArea(
        document.getElementById("code-editor"),
        {
          lineNumbers: true,
          mode: "arcade",
          theme: "default",
          autoCloseBrackets: false,
          matchBrackets: false,
          indentUnit: 2,
          tabSize: 2,
          lineWrapping: false,
          autofocus: true,
          styleActiveLine: true,
          hintOptions: {
            hint: CodeMirror.hint.arcade,
            completeSingle: false,
          },
          extraKeys: {
            Tab: function (cm) {
              cm.replaceSelection("  ", "end");
            },
            "Ctrl-Space": "autocomplete",
            "Ctrl-/": function (cm) {
              cm.toggleComment();
            },
          },
        }
      );

      codeEditor.on("inputRead", function (editor, event) {
        setChanges();
        if (event.text[0] && /[a-zA-Z]/.test(event.text[0])) {
          CodeMirror.commands.autocomplete(editor, null, {
            completeSingle: false,
          });
        }
      });

      if (data.code) {
        codeEditor.setValue(data.code);
      }

      window.codeEditorInstance = codeEditor;
    })
    .catch((err) => {
      console.error("Error loading game:", err);
    });
}

async function loadGamePreview() {
  if (CURRENT_PAGE === "gamePreview") return;

  if (changesMade) {
    const result = await checkIfSaved();
    if (result.action === "cancelled") {
      return;
    }
    if (result.action === "save_failed") {
      return;
    }
  }

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));
  document.getElementById("gamePreviewSidebarLink").classList.add("active");

  CURRENT_PAGE = "gamePreview";

  fetch(`/api/games?id=${GAMEID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      developHeading.textContent = `${data.title} | Preview`;
      developContainer.innerHTML = `
        <div class="row">
          <div class="col-12 mt-3">
            <div class="game-preview-container" id="gamePreviewContainer">

              <div class="game-canvas-wrapper">
                <canvas id="gameCanvas" width="676" height="380"></canvas>
                <div id="previewStartOverlay" class="preview-start-overlay">
                  <div class="start-content">
                    <i class="bi bi-play-circle-fill"></i>
                    <span>Click to Start Game</span>
                  </div>
                </div>
              </div>
              <div class="game-controls-row">
                <div id="gameText" class="game-output-text"></div>
                <button id="fullscreen-btn" class="btn btn-outline-secondary fullscreen-btn" title="Fullscreen">
                  <i class="bi bi-fullscreen"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("gameCanvas");
      const overlay = document.getElementById("previewStartOverlay");

      let gameRunning = false;

      canvas.addEventListener("click", async () => {
        if (gameRunning) return;
        gameRunning = true;

        let gameCode = data.code || "";

        let processedSprites = [];
        if (data.sprites && data.sprites.length > 0) {
          processedSprites = data.sprites.map((base64) => {
            const binary = atob(base64);
            const imgData = new Uint8ClampedArray(binary.length);
            for (let i = 0; i < binary.length; i++) {
              imgData[i] = binary.charCodeAt(i);
            }
            return new ImageData(imgData, 320, 320);
          });
        }
        startGame(canvas, overlay, processedSprites, gameCode, data.purchases);
      });
    })
    .catch((err) => {
      console.error("Error loading game:", err);
    });
}

function setChanges() {
  changesMade = true;
}

const saveButton = document.getElementById("save-button");
if (saveButton) {
  saveButton.addEventListener("click", async () => {
    await saveGame();
  });
}

const shareBtn = document.getElementById("share-button");
shareBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigator.clipboard
    .writeText(`${WEBSITE_URL}/game/${GAMEID}`)
    .then(() => {
      showToast("Link copied to clipboard.");
    })
    .catch((err) => {
      // Error while sharing
      showError("There was an issue while creating a link for your game.");
      console.log(`Game sharing error: ${err}`);
    });
});
