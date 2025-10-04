const spriteEditor = {};

const SPRITE_CANVAS_SIZE = 320;
const SPRITE_DIM = 32;
const CELL_SIZE = SPRITE_CANVAS_SIZE / SPRITE_DIM;

let sprites = [];
let editingIndex = -1;
let drawnPixels = [];
let pixelColors = [];
let tool = "pencil";
let currentColor = "#00ff00";

let pixelCanvas, pixelCtx;
let spriteListEl;
let colorPickerEl;
let pencilBtn, eraserBtn, clearBtn, saveSpriteBtn, newSpriteBtn, saveAllBtn;
let canvasColumnEl;

function init() {
  pixelCanvas = document.getElementById("pixelCanvas");
  pixelCtx = pixelCanvas && pixelCanvas.getContext("2d");
  spriteListEl = document.getElementById("spriteList");
  colorPickerEl = document.getElementById("colorPicker");
  pencilBtn = document.getElementById("pencil-btn");
  eraserBtn = document.getElementById("eraser-btn");
  clearBtn = document.getElementById("clear-btn");
  saveSpriteBtn = document.getElementById("save-sprite-btn");
  newSpriteBtn = document.getElementById("new-sprite-btn");

  if (!pixelCanvas || !pixelCtx) {
    console.warn(
      "spriteEditor: pixelCanvas not found - ensure the Sprite Editor DOM is present"
    );
    return;
  }

  canvasColumnEl =
    pixelCanvas.closest(".col-7") ||
    pixelCanvas.closest(".canvas-area") ||
    pixelCanvas.parentElement;

  pixelCanvas.width = SPRITE_CANVAS_SIZE;
  pixelCanvas.height = SPRITE_CANVAS_SIZE;

  resetDrawState();
  setupCanvasDrawing();

  // Controls
  if (colorPickerEl) {
    colorPickerEl.value = currentColor;
    colorPickerEl.addEventListener("change", (e) => {
      currentColor = e.target.value;
    });
  }
  if (pencilBtn) {
    pencilBtn.addEventListener("click", () => {
      tool = "pencil";
      pencilBtn.classList.add("active");
      eraserBtn && eraserBtn.classList.remove("active");
    });
  }
  if (eraserBtn) {
    eraserBtn.addEventListener("click", () => {
      tool = "eraser";
      eraserBtn.classList.add("active");
      pencilBtn && pencilBtn.classList.remove("active");
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      resetDrawState();
      drawCheckboard();
      editingIndex = -1;
      hideCanvas();
    });
  }
  if (saveSpriteBtn) {
    saveSpriteBtn.addEventListener("click", () => {
      saveCurrentSprite();
    });
  }
  if (newSpriteBtn) {
    newSpriteBtn.addEventListener("click", () => {
      createNewSprite();
    });
  }

  loadSprites();
  drawCheckboard();
  hideCanvas();
}

function resetDrawState() {
  drawnPixels = Array.from({ length: SPRITE_DIM }, () =>
    Array.from({ length: SPRITE_DIM }, () => false)
  );
  pixelColors = Array.from({ length: SPRITE_DIM }, () =>
    Array.from({ length: SPRITE_DIM }, () => null)
  );
}

function drawCheckboard() {
  const size = CELL_SIZE;
  for (let x = 0; x < SPRITE_DIM; x++) {
    for (let y = 0; y < SPRITE_DIM; y++) {
      pixelCtx.fillStyle = (x + y) % 2 === 0 ? "#cccccc" : "#ffffff";
      pixelCtx.fillRect(x * size, y * size, size, size);
    }
  }
}

function setupCanvasDrawing() {
  let drawing = false;

  pixelCanvas.addEventListener("mousedown", (e) => {
    drawing = true;
    handleDrawAt(e);
  });
  window.addEventListener("mouseup", () => (drawing = false));
  pixelCanvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    handleDrawAt(e);
  });

  function handleDrawAt(e) {
    const rect = pixelCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    // Add bounds checking to prevent errors
    if (x < 0 || y < 0 || x >= SPRITE_DIM || y >= SPRITE_DIM) return;

    if (tool === "pencil") {
      drawnPixels[x][y] = true;
      pixelColors[x][y] = currentColor;
      pixelCtx.fillStyle = currentColor;
      pixelCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    } else if (tool === "eraser") {
      drawnPixels[x][y] = false;
      pixelColors[x][y] = null;
      pixelCtx.fillStyle = (x + y) % 2 === 0 ? "#cccccc" : "#ffffff";
      pixelCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

function createBlankImageData() {
  const arr = new Uint8ClampedArray(
    SPRITE_CANVAS_SIZE * SPRITE_CANVAS_SIZE * 4
  );
  return new ImageData(arr, SPRITE_CANVAS_SIZE, SPRITE_CANVAS_SIZE);
}

function createNewSprite() {
  changesMade = true;
  const imgData = createBlankImageData();
  sprites.push(imgData);
  const newIndex = sprites.length - 1;
  renderSpritesList();
  editSprite(newIndex);
}

function saveCurrentSprite() {
  changesMade = true;
  const fullImg = pixelCtx.getImageData(
    0,
    0,
    SPRITE_CANVAS_SIZE,
    SPRITE_CANVAS_SIZE
  );
  const data = fullImg.data;
  const transparentData = new Uint8ClampedArray(data.length);

  for (let sx = 0; sx < SPRITE_DIM; sx++) {
    for (let sy = 0; sy < SPRITE_DIM; sy++) {
      const drawn = drawnPixels[sx][sy];
      for (let subx = 0; subx < CELL_SIZE; subx++) {
        for (let suby = 0; suby < CELL_SIZE; suby++) {
          const px = sx * CELL_SIZE + subx;
          const py = sy * CELL_SIZE + suby;
          const idx = (py * SPRITE_CANVAS_SIZE + px) * 4;
          if (drawn) {
            const color = pixelColors[sx][sy];
            if (color) {
              const rgb = parseColorToRgb(color);
              transparentData[idx] = rgb.r;
              transparentData[idx + 1] = rgb.g;
              transparentData[idx + 2] = rgb.b;
              transparentData[idx + 3] = 255;
            } else {
              transparentData[idx] = data[idx];
              transparentData[idx + 1] = data[idx + 1];
              transparentData[idx + 2] = data[idx + 2];
              transparentData[idx + 3] = data[idx + 3];
            }
          } else {
            transparentData[idx] = 0;
            transparentData[idx + 1] = 0;
            transparentData[idx + 2] = 0;
            transparentData[idx + 3] = 0;
          }
        }
      }
    }
  }

  const imgData = new ImageData(
    transparentData,
    SPRITE_CANVAS_SIZE,
    SPRITE_CANVAS_SIZE
  );

  if (editingIndex !== -1 && editingIndex < sprites.length) {
    sprites[editingIndex] = imgData;
    editingIndex = -1;
  } else {
    sprites.push(imgData);
  }

  resetDrawState();
  drawCheckboard();

  renderSpritesList();

  hideCanvas();
}

function parseColorToRgb(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    const bigint = parseInt(hex, 16);
    if (hex.length === 6) {
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    } else if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
  } else if (colorStr.startsWith("rgb")) {
    const nums = colorStr.match(/\d+/g);
    return { r: parseInt(nums[0]), g: parseInt(nums[1]), b: parseInt(nums[2]) };
  }
  return { r: 0, g: 0, b: 0 };
}

function renderSpritesList() {
  if (!spriteListEl) return;
  spriteListEl.innerHTML = "";

  if (!sprites || sprites.length === 0) {
    const empty = document.createElement("div");
    empty.className = "text-muted";
    empty.textContent = "No sprites yet. Click 'New Sprite' to create one.";
    spriteListEl.appendChild(empty);
    hideCanvas();
    return;
  }

  sprites.forEach((sprite, i) => {
    const row = document.createElement("div");
    row.className =
      "d-flex justify-content-between align-items-center w-100 mb-2 sprite-list-item";

    const left = document.createElement("span");
    left.textContent = `sprite${i + 1}`;

    const right = document.createElement("div");

    const editBtn = document.createElement("i");
    editBtn.className = "bi bi-pencil sprite-btn";
    editBtn.addEventListener("click", () => editSprite(i));

    const deleteBtn = document.createElement("i");
    deleteBtn.className = "bi bi-trash ms-2 sprite-btn";
    deleteBtn.addEventListener("click", () => {
      if (!confirm("Delete this sprite?")) return;
      changesMade = true;
      sprites.splice(i, 1);
      if (editingIndex === i) {
        editingIndex = -1;
        resetDrawState();
        drawCheckboard();
        hideCanvas();
      }
      renderSpritesList();
    });

    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    row.appendChild(left);
    row.appendChild(right);

    spriteListEl.appendChild(row);
  });
}

async function loadSprites() {
  sprites = [];
  try {
    let resp = null;
    resp = await fetch(`/api/games?id=${GAMEID}`);

    if (!resp || !resp.ok) {
      renderSpritesList();
      return;
    }

    const data = await resp.json();
    const arr = data && data.sprites ? data.sprites : [];
    parseSprites(arr);
    renderSpritesList();
    hideCanvas();
  } catch (err) {
    console.error("spriteEditor load error:", err);
    renderSpritesList();
    hideCanvas();
  }
}

function parseSprites(base64Arr) {
  sprites = [];
  for (const base64 of base64Arr || []) {
    try {
      const binary = atob(base64);
      const imgData = new Uint8ClampedArray(binary.length);
      for (let i = 0; i < binary.length; i++) imgData[i] = binary.charCodeAt(i);
      const id = new ImageData(imgData, SPRITE_CANVAS_SIZE, SPRITE_CANVAS_SIZE);
      sprites.push(id);
    } catch (e) {
      console.warn("spriteEditor: invalid sprite data", e);
    }
  }
}

async function saveAllSprites() {
  try {
    const spritesData = sprites.map((sprite) => {
      let binary = "";
      for (let i = 0; i < sprite.data.length; i++) {
        binary += String.fromCharCode(sprite.data[i]);
      }
      return btoa(binary);
    });

    const resp = await fetch(`/api/games/${GAMEID}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprites: spritesData }),
    });

    if (!resp || !resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("saveAllSprites: bad response", resp.status, text);
      showError("Failed to save sprites");
      return false;
    }

    const j = await resp.json();
    if (j && j.message) {
      try {
        if (typeof changesMade !== "undefined") changesMade = false;
      } catch (e) {}
      return true;
    } else {
      showError((j && j.error) || "Failed to save sprites");
      return false;
    }
  } catch (e) {
    console.error("saveAllSprites error:", e);
    showError("Failed to save sprites");
    return false;
  }
}

function editSprite(index) {
  changesMade = true;
  if (index < 0 || index >= sprites.length) return;
  editingIndex = index;
  const sprite = sprites[index];

  showCanvas();

  drawCheckboard();

  const temp = document.createElement("canvas");
  temp.width = SPRITE_CANVAS_SIZE;
  temp.height = SPRITE_CANVAS_SIZE;
  const tctx = temp.getContext("2d");
  tctx.putImageData(sprite, 0, 0);
  pixelCtx.drawImage(temp, 0, 0);

  resetDrawState();

  const data = sprite.data;
  for (let sx = 0; sx < SPRITE_DIM; sx++) {
    for (let sy = 0; sy < SPRITE_DIM; sy++) {
      let found = false;
      let r = 0,
        g = 0,
        b = 0;
      for (let subx = 0; subx < CELL_SIZE && !found; subx++) {
        for (let suby = 0; suby < CELL_SIZE && !found; suby++) {
          const px = sx * CELL_SIZE + subx;
          const py = sy * CELL_SIZE + suby;
          const idx = (py * SPRITE_CANVAS_SIZE + px) * 4;
          const a = data[idx + 3];
          if (a > 0) {
            found = true;
            r = data[idx];
            g = data[idx + 1];
            b = data[idx + 2];
          }
        }
      }
      if (found) {
        drawnPixels[sx][sy] = true;
        pixelColors[sx][sy] = `rgb(${r}, ${g}, ${b})`;
      }
    }
  }
}

function showCanvas() {
  if (!canvasColumnEl) return;
  canvasColumnEl.style.display = "";
}

function hideCanvas() {
  if (!canvasColumnEl) return;
  canvasColumnEl.style.display = "none";
}

spriteEditor.init = init;
window.spriteEditor = spriteEditor;
window.saveAllSprites = saveAllSprites;
