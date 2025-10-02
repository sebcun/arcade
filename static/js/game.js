window.addEventListener("DOMContentLoaded", () => {
  fetch(`/api/games?id=${GAMEID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const canvas = document.getElementById("gameCanvas");
      const overlay = document.getElementById("previewStartOverlay");

      const gameName = document.getElementById("gameName");
      gameName.textContent = data.title;

      const likeBtn = document.getElementById("like-btn");
      const likeIcon = document.getElementById("like-icon");
      const likeCount = document.getElementById("like-count");

      likeCount.textContent = data.likes || 0;
      const isLiked = data.liked || false;

      if (isLiked) {
        likeIcon.classList.remove("bi-heart");
        likeIcon.classList.add("bi-heart-fill");
        likeIcon.classList.add("red-liked");
      }
      likeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        fetch(`/api/games/${GAMEID}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => {
            if (response.status === 401) {
              throw new Error("UNAUTHORIZED");
            }
            if (!response.ok) {
              throw new Error(`Failed to fetch game likes: ${response.status}`);
            }
            return response.json();
          })
          .then((json) => {
            const isLikedNew = !!json.liked;
            likeCount.textContent = json.likes || 0;
            if (isLikedNew) {
              likeIcon.classList.remove("bi-heart");
              likeIcon.classList.add("bi-heart-fill");
              likeIcon.classList.add("red-liked");
            } else {
              likeIcon.classList.add("bi-heart");
              likeIcon.classList.remove("bi-heart-fill");
              likeIcon.classList.remove("red-liked");
            }
          })
          .catch((err) => {
            if (err.message === "UNAUTHORIZED") {
              showLoginModal();
              showError("You must be logged in to like games.");
            } else {
              console.error("Error liking game:", err);
              showToast("Failed to like game. Please try again.", {
                color: "error",
              });
            }
          });
      });

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
        startGame(canvas, overlay, processedSprites, gameCode);
      });

      const gameAuthor = document.getElementById("gameAuthor");
      fetch(`/api/user?id=${data.author}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Profile fetch failed: ${response.status}`);
          }
          return response.json();
        })
        .then((pdata) => {
          console.log(pdata);
          gameAuthor.textContent = `@${pdata.username}`;
          gameAuthor.href = `${WEBSITEURL}/profile/${data.author}`;
        })
        .catch((err) => {
          console.warn("Could not fetch author profile:", err);
          gameAuthor.textContent = ` | ${data.author}`;
        });
    })
    .catch((err) => {
      console.error("Error starting game:", err);
    });
});
