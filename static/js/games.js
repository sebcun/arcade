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

        fetch(`/api/games/${gameidOrData}/play`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.warn("Failed to increment play count:", err);
        });

        runGameInModal(
          data.code || "",
          processedSprites,
          data.title || title,
          data.likes || 0,
          data.liked || false,
          gameidOrData,
          data.plays || 0,
          data.author || null
        );
      })
      .catch((err) => {
        console.error("Error starting game:", err);
      });
  } else {
    const code = gameidOrData;
    runGameInModal(code, sprites, title);
  }
}

function runGameInModal(
  code,
  sprites,
  title,
  likes = 0,
  liked = false,
  gameId = null,
  plays = 0,
  authorId = null
) {
  gameModalTitle.textContent = title;
  gameModalContents.innerHTML = `
    <canvas id="gameCanvas" width="600" height="380"></canvas>
    <span id="gameText" style="margin-top:8px;"></span>
    <div id="game-controls" class="game-controls" style="display:flex; gap:8px; align-items:center;">
      <i id="like-icon" class="bi ${
        liked ? "bi-heart-fill liked" : "bi-heart"
      }" style="cursor:pointer;font-size:1.2rem;" role="button" aria-pressed="${
    liked ? "true" : "false"
  }" tabindex="0" aria-label="Like"></i>
      <span id="like-count">${likes}</span>
      <span id="play-icon" style="margin-left:12px; display:flex; align-items:center; gap:6px;">
        <i class="bi bi-eye-fill" style="font-size:1.2rem;"></i>
        <span id="play-count">${plays}</span>
      </span>
      <span id="author-wrap" style="margin-left:auto; display:flex; align-items:center; gap:6px;">
        <a id="author-link" href="#" role="button" tabindex="0" aria-label="View author profile" style="text-decoration:none; color:inherit;"></a>
      </span>
    </div>
  `;
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (gameId !== null) {
    gameModalContents.querySelector("#game-controls").dataset.gameId =
      String(gameId);
  }

  gameModal.style.display = "flex";
  gameModal.offsetHeight;
  gameModal.classList.add("show");

  window.isGameRunning = true;
  resetSprites();

  const authorLink = document.getElementById("author-link");
  if (authorLink) {
    if (authorId !== null && authorId !== undefined) {
      authorLink.textContent = "@loading";
      authorLink.style.cursor = "pointer";

      fetch(`/api/profile/${authorId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Profile fetch failed: ${response.status}`);
          }
          return response.json();
        })
        .then((pdata) => {
          authorLink.textContent = `@${pdata.username}`;
        })
        .catch((err) => {
          console.warn("Could not fetch author profile:", err);
          authorLink.textContent = `@${String(authorId)}`;
        });

      authorLink.addEventListener("click", (e) => {
        e.preventDefault();
        showProfile(authorId);
      });
    }
  }

  const likeIcon = document.getElementById("like-icon");
  const likeCount = document.getElementById("like-count");

  if (likeIcon && gameId !== null) {
    const toggleLocalIcon = (isLiked) => {
      if (isLiked) {
        likeIcon.classList.remove("bi-heart");
        likeIcon.classList.add("bi-heart-fill", "liked");
        likeIcon.setAttribute("aria-pressed", "true");
      } else {
        likeIcon.classList.remove("bi-heart-fill", "liked");
        likeIcon.classList.add("bi-heart");
        likeIcon.setAttribute("aria-pressed", "false");
      }
    };

    const doToggleLike = async () => {
      try {
        const resp = await fetch(`/api/games/${gameId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (resp.status === 401) {
          window.location = "/?login";
          return;
        }
        const json = await resp.json();
        if (resp.ok && json) {
          likeCount.textContent = json.likes;
          toggleLocalIcon(!!json.liked);
        } else {
          console.error("Failed to toggle like:", json);
        }
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    };

    likeIcon.addEventListener("click", (e) => {
      e.preventDefault();
      doToggleLike();
    });
  }

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
