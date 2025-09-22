// Global Vars
let sprites = [];
let previewCtx;

document.addEventListener("DOMContentLoaded", () => {
  initSpriteCanvas();
  initPreviewCanvas();
});

function initSpriteCanvas() {
  // Get canvas
  const canvas = document.getElementById("pixelCanvas");
  const ctx = canvas.getContext("2d");

  //   Draw checkboard (transparent background)
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

  //   Setup basic variables
  let drawing = false;
  let drawnPixels = Array(32)
    .fill()
    .map(() => Array(32).fill(false));
  canvas.addEventListener("mousedown", () => (drawing = true));
  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mousemove", draw);

  //   Draw pixels
  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);
    ctx.fillStyle = document.getElementById("colorPicker").value;
    ctx.fillRect(x * 10, y * 10, 10, 10);

    drawnPixels[x][y] = true;
  }

  //   Clear pixels
  document.getElementById("clearButton").addEventListener("click", () => {
    drawnPixels = Array(32)
      .fill()
      .map(() => Array(32).fill(false));
    drawCheckboard();
  });

  // Sprite Handling
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
    sprites.push(transparentImgData);
    updateSpritesList();
  });

  function updateSpritesList() {
    const list = document.getElementById("spritesList");
    list.innerHTML = "";
    sprites.forEach((sprite, i) => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.margin = "5px 0";

      // Create small preview canvas (32x32 scaled down)
      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = 32;
      previewCanvas.height = 32;
      const pctx = previewCanvas.getContext("2d");

      // Temporary canvas for full-size sprite
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 320;
      tempCanvas.height = 320;
      const tctx = tempCanvas.getContext("2d");
      tctx.putImageData(sprite, 0, 0);

      // Draw the full sprite scaled down to 32x32 over the white background
      pctx.drawImage(tempCanvas, 0, 0, 320, 320, 0, 0, 32, 32);

      div.appendChild(previewCanvas);

      const text = document.createElement("span");
      text.textContent = ` sprite${i + 1}`;
      text.style.marginLeft = "10px";
      div.appendChild(text);

      list.appendChild(div);
    });
  }
}

function initPreviewCanvas() {
  const canvas = document.getElementById("previewCanvas");
  previewCtx = canvas.getContext("2d");
  const cursorPosSpan = document.getElementById("cursorPosition");

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    cursorPosSpan.textContent = `Cursor: x${x} y${y}`;
  });

  canvas.addEventListener("mouseleave", () => {
    cursorPosSpan.textContent = "Cursor: Not on canvas";
  });

  //   Reset
  const resetButton = document.getElementById("resetButton");
  resetButton.addEventListener("click", () => {
    previewCtx.clearRect(0, 0, canvas.width, canvas.height);
    resetSprites();
  });

  //   Run
  const runButton = document.getElementById("runButton");
  runButton.addEventListener("click", async () => {
    if (runButton.disabled) return;
    const code = document.getElementById("codeBox").value;
    try {
      runButton.disabled = true;
      await executeCode(code, sprites, previewCtx);
    } catch (err) {
      console.error("Error running script:", err);
    } finally {
      runButton.disabled = false;
    }
  });
}
