let sprites = [];
let previewCtx;
let currentGameId = null;
let currentGameTitle = "No Game Selected";
let editingSpriteIndex = -1;
let drawnPixels;

document.addEventListener("DOMContentLoaded", () => {
  initSpriteCanvas();
  initPreviewCanvas();
  showProjectModal();
});

function showProjectModal() {
  fetch("/api/games?author=me")
    .then((response) => response.json())
    .then((games) => {
      let content =
        '<div class="project-list" style="margin-bottom: 10px; margin-top: 10px;">';
      games.forEach((game) => {
        content += `<button class="long-button project-item" data-id="${game.id}" data-title="${game.title}" style="opacity: 0.8;">
        <img src="/static/images/LongButtonTwo.png" alt="${game.title}">
        <span>${game.title}</span>
        </button>`;
      });

      content += "</div>";
      content +=
        '<button id="createNewGameBtn" class="long-button"><img src="/static/images/LongButton.png" alt="Create New"><span>Create New Game</span></button>';

      showModal("Select or Create Project", content, []);

      document.querySelectorAll(".project-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = parseInt(item.dataset.id);
          const title = item.dataset.title;
          loadGame(id, title);
          hideModal();
        });
      });

      document
        .getElementById("createNewGameBtn")
        .addEventListener("click", () => {
          showCreateNewModal();
        });
    });
}

function showCreateNewModal() {
  const content = `
    <form id="create-game-form">
      <div class="form-group">
        <label for="game-title">Title:</label>
        <input type="text" id="game-title" class="settings-input" required>
      </div>
      <div class="form-group" style="margin-bottom: 20px">
        <label for="game-description">Description:</label>
        <textarea id="game-description" class="settings-input" rows="3"></textarea>
      </div>
    </form>
  `;

  showModal("Create New Game", content, [
    {
      text: "Create",
      onClick: () => {
        const title = document.getElementById("game-title").value.trim();
        const desc = document.getElementById("game-description").value.trim();
        if (!title) {
          showToast("Title is required", { color: "error" });
          return;
        }
        fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: desc }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.game_id) {
              loadGame(data.game_id, title);
              hideModal();
            } else {
              showToast(data.error || "Failed to create game", {
                color: "error",
              });
            }
          })
          .catch((err) => {
            showToast("Error creating game", { color: "error" });
          });
      },
    },
    {
      text: "Cancel",
      image: "/static/images/LongButtonTwo.png",
      onClick: () => showProjectModal(),
    },
  ]);
}

function loadGame(id, title) {
  currentGameId = id;
  currentGameTitle = title;
  document.getElementById("projectTitle").textContent = title;

  document.getElementById("selectProjectButton").style.display = "none";
  document.getElementById("runButton").style.display = "block";
  document.getElementById("saveButton").style.display = "block";
  document.getElementById("shareButton").style.display = "block";

  fetch(`/api/games/${id}`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("codeBox").value = data.code || "";

      sprites = [];
      if (data.sprites && data.sprites.length > 0) {
        sprites = data.sprites.map((base64) => {
          const binary = atob(base64);
          const imgData = new Uint8ClampedArray(binary.length);
          for (let i = 0; i < binary.length; i++) {
            imgData[i] = binary.charCodeAt(i);
          }
          return new ImageData(imgData, 320, 320);
        });
        updateSpritesList();
      }

      document.getElementById("editorContainer").style.display = "flex";
    });
}

function updateSpritesList() {
  const list = document.getElementById("spritesList");
  list.innerHTML = "";
  sprites.forEach((sprite, i) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.margin = "5px 0";

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 32;
    previewCanvas.height = 32;
    const pctx = previewCanvas.getContext("2d");

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 320;
    tempCanvas.height = 320;
    const tctx = tempCanvas.getContext("2d");
    tctx.putImageData(sprite, 0, 0);

    pctx.drawImage(tempCanvas, 0, 0, 320, 320, 0, 0, 32, 32);

    div.appendChild(previewCanvas);

    const text = document.createElement("span");
    text.textContent = ` sprite${i + 1}`;
    text.style.marginLeft = "10px";
    div.appendChild(text);

    const editBtn = document.createElement("button");
    editBtn.style.marginLeft = "10px";
    editBtn.style.border = "none";
    editBtn.style.background = "none";
    editBtn.innerHTML =
      '<img src="/static/images/Pencil.png" alt="edit" style="width: 16px; height: 16px">';
    editBtn.addEventListener("click", () => editSprite(i));
    div.appendChild(editBtn);

    list.appendChild(div);
  });
}

function editSprite(index) {
  editingSpriteIndex = index;
  const sprite = sprites[index];
  const canvas = document.getElementById("pixelCanvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 320, 320);
  const size = 10;
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#cccccc" : "#ffffff";
      ctx.fillRect(x * size, y * size, size, size);
    }
  }

  console.log(sprite);

  drawnPixels = Array(32)
    .fill()
    .map(() => Array(32).fill(false));

  const pixelColors = Array(32)
    .fill()
    .map(() => Array(32).fill(null));

  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      let hasPixel = false;
      let r, g, b;
      for (let subx = 0; subx < 10; subx++) {
        for (let suby = 0; suby < 10; suby++) {
          const pixelIndex = ((j * 10 + suby) * 320 + (i * 10 + subx)) * 4;
          if (sprite.data[pixelIndex + 3] > 0) {
            r = sprite.data[pixelIndex];
            g = sprite.data[pixelIndex + 1];
            b = sprite.data[pixelIndex + 2];
            hasPixel = true;
            break;
          }
        }
        if (hasPixel) break;
      }
      if (hasPixel) {
        drawnPixels[i][j] = true;
        pixelColors[i][j] = `rgb(${r}, ${g}, ${b})`;
      }
    }
  }

  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      if (drawnPixels[i][j]) {
        ctx.fillStyle = pixelColors[i][j];
        ctx.fillRect(i * 10, j * 10, 10, 10);
      }
    }
  }
}

function initSpriteCanvas() {
  const canvas = document.getElementById("pixelCanvas");
  const ctx = canvas.getContext("2d");

  function drawCheckboard() {
    const size = 10;
    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#cccccc" : "#ffffff";
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }
  drawCheckboard();

  let drawing = false;
  drawnPixels = Array(32)
    .fill()
    .map(() => Array(32).fill(false));
  canvas.addEventListener("mousedown", () => (drawing = true));
  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mousemove", draw);

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);
    ctx.fillStyle = document.getElementById("colorPicker").value;
    ctx.fillRect(x * 10, y * 10, 10, 10);

    drawnPixels[x][y] = true;
  }

  document.getElementById("clearButton").addEventListener("click", () => {
    drawnPixels = Array(32)
      .fill()
      .map(() => Array(32).fill(false));
    drawCheckboard();
    editingSpriteIndex = -1;
  });

  document.getElementById("saveSpriteButton").addEventListener("click", () => {
    const currentImgData = ctx.getImageData(0, 0, 320, 320);
    const data = currentImgData.data;
    const transparentData = new Uint8ClampedArray(data.length);

    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 32; j++) {
        const r = data[(j * 10 * 320 + i * 10) * 4];
        const g = data[(j * 10 * 320 + i * 10) * 4 + 1];
        const b = data[(j * 10 * 320 + i * 10) * 4 + 2];
        for (let subx = 0; subx < 10; subx++) {
          for (let suby = 0; suby < 10; suby++) {
            const pixelIndex = ((j * 10 + suby) * 320 + (i * 10 + subx)) * 4;
            if (drawnPixels[i][j]) {
              transparentData[pixelIndex] = r;
              transparentData[pixelIndex + 1] = g;
              transparentData[pixelIndex + 2] = b;
              transparentData[pixelIndex + 3] = 255;
            } else {
              transparentData[pixelIndex] = 0;
              transparentData[pixelIndex + 1] = 0;
              transparentData[pixelIndex + 2] = 0;
              transparentData[pixelIndex + 3] = 0;
            }
          }
        }
      }
    }

    const transparentImgData = new ImageData(transparentData, 320, 320);
    if (editingSpriteIndex !== -1) {
      sprites[editingSpriteIndex] = transparentImgData;
      editingSpriteIndex = -1;
    } else {
      sprites.push(transparentImgData);
    }
    updateSpritesList();

    drawnPixels = Array(32)
      .fill()
      .map(() => Array(32).fill(false));
    drawCheckboard();
    editingSpriteIndex = -1;
  });
}

function initPreviewCanvas() {
  const canvas = document.getElementById("previewCanvas");
  previewCtx = canvas.getContext("2d");
  const cursorPosSpan = document.getElementById("cursorPosition");
  let isRunning = false;

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    cursorPosSpan.textContent = `Cursor: x${x} y${y}`;
  });

  canvas.addEventListener("mouseleave", () => {
    cursorPosSpan.textContent = "Cursor: Not on canvas";
  });

  const runButton = document.getElementById("runButton");
  runButton.addEventListener("click", async () => {
    const code = document.getElementById("codeBox").value;
    const runImg = runButton.querySelector("img");

    window.isGameRunning = true;
    startGame(code, sprites, currentGameTitle || "Untitled Game");
  });

  window.addEventListener("gameModalClosed", () => {
    isRunning = false;
    window.isGameRunning = false;
    const runImg = runButton.querySelector("img");
    if (runImg) runImg.src = "/static/images/PlayBtn.png";
  });

  const saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", () => {
    const code = document.getElementById("codeBox").value;

    const spritesData = sprites.map((sprite) =>
      btoa(String.fromCharCode(...sprite.data))
    );

    fetch(`/api/games/${currentGameId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, sprites: spritesData }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          showToast("Game saved!", { color: "success" });
        } else {
          showToast(data.error || "Save failed", { color: "error" });
        }
      });
  });

  const shareButton = document.getElementById("shareButton");
  shareButton.addEventListener("click", async () => {
    navigator.clipboard
      .writeText(`${WEBSITE_URL}/?game=${currentGameId}`)
      .then(() => {
        showToast("Link copied to clipboard.");
      })
      .catch((err) => {
        // Error while sharing
        showToast("There was an issue while creating a link for the game.", {
          color: "error",
        });
        console.log(`Game sharing error: ${err}`);
      });
  });
}
