// Base Modal
const gameModal = document.getElementById("game-modal");
const gameModalTitle = document.getElementById("game-modal-title");
const gameModalContents = document.getElementById("game-modal-contents");
const closeGameBtn = document.querySelector("#game-modal .close");

window.isGameRunning = false;

function startGame(gameidOrData, sprites = null, title = "Game") {
  if (sprites === null) {
    fetch(`/api/games/${gameidOrData}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch game: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        let processedSprites = data.sprites || [];
        if (processedSprites.length > 0) {
          processedSprites = processedSprites.map((base64) => {
            const binary = atob(base64);
            const imgData = new Uint8ClampedArray(binary.length);
            for (let i = 0; i < binary.length; i++) {
              imgData[i] = binary.charCodeAt(i);
            }
            return new ImageData(imgData, 320, 320);
          });
        }
        setParameter("game", gameidOrData, false);
        runGameInModal(data.code || "", processedSprites, data.title || title);
      })
      .catch((err) => {
        console.error("Error starting game:", err);
      });
  } else {
    const code = gameidOrData;
    runGameInModal(code, sprites, title);
  }
}
function runGameInModal(code, sprites, title) {
  gameModalTitle.textContent = title;
  gameModalContents.innerHTML = `<canvas id="gameCanvas" width="600" height="380"></canvas>`;
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  gameModal.style.display = "flex";
  gameModal.offsetHeight;
  gameModal.classList.add("show");

  window.isGameRunning = true;
  resetSprites();
  executeCode(code, sprites, ctx).catch((err) => {
    console.error("Game execution error:", err);
  });
}

function hideGame() {
  gameModal.classList.remove("show");
  stopExecution();
  window.isGameRunning = false;
  clearParameters();

  setTimeout(() => {
    gameModal.style.display = "none";
  }, 300);
}

closeGameBtn.addEventListener("click", hideGame);

window.addEventListener("click", (event) => {
  if (event.target === gameModal) {
    hideGame();
  }
});
