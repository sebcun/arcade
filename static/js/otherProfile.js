document.addEventListener("DOMContentLoaded", async () => {
  fetch(`/api/user?id=${USERID}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showError("Profile not found!");
        console.log(`Profile loading error: ${data.error}`);
      } else {
        // Level Image
        const starNumber = Math.min(5, Math.floor(data.level / 10) + 1);
        const starNames = ["One", "Two", "Three", "Four", "Five"];
        let levelImage = `/static/images/levels/Star${
          starNames[starNumber - 1]
        }.png`;

        // Avatar
        let avatar = { face: "white", eyes: "blue", hair: "one_brown" };
        if (data.avatar) {
          try {
            avatar = JSON.parse(data.avatar);
          } catch (e) {
            console.log("Invalid avatar data");
          }
        }
        let avatar_background = data.avatar_background ?? "GREY";

        // Setting Values
        document.getElementById("profile-username").innerHTML =
          `@${data.username} <i
          class="bi bi-copy copy-icon"
          style="cursor: pointer; margin-left: 10px; font-size: 1rem"
          title="Copy URL"
        ></i>` || "???";
        const copyIcon = document.querySelector(".copy-icon");
        if (copyIcon) {
          copyIcon.addEventListener("click", shareProfile);
        }

        document.getElementById("profile-level").textContent =
          data.level || "???";

        // Creation Date of user
        let creationDate = "";
        let createdAt = data.created_at;
        if (typeof createdAt === "string" && /^\d+$/.test(createdAt)) {
          createdAt = Number(createdAt);
        }
        if (typeof createdAt === "number" && createdAt < 1e12) {
          createdAt = createdAt * 1000;
        }
        const date = new Date(createdAt);
        const month = date.toLocaleString("en-US", { month: "long" });
        const year = date.getFullYear();
        creationDate = `${month} ${year}`;

        document.getElementById("profile-creation").textContent =
          creationDate || "???";

        // Avatar
        document.getElementById("profile-avatar-face").src =
          `/static/images/avatars/face/${avatar.face}.png` || "???";
        document.getElementById("profile-avatar-eyes").src =
          `/static/images/avatars/eyes/${avatar.eyes}.png` || "???";
        document.getElementById("profile-avatar-hair").src =
          `/static/images/avatars/hair/${avatar.hair}.png` || "???";
        document.getElementById("profile-avatar-level").src =
          levelImage || "???";
        document
          .getElementById("profile-avatar")
          .classList.add(avatar_background.toLowerCase());

        // Badges
        let badgesHTML = "";
        try {
          let badges = data.badges;

          if (typeof badges === "string") {
            badges = badges ? JSON.parse(badges) : [];
          }

          // Parse badges to proper array
          if (Array.isArray(badges)) {
            // For each badge
            badges.forEach((badgeArray) => {
              // Values
              const badgeid = badgeArray[0];
              const badgeName = badgeArray[1];
              const badgeDescription = badgeArray[2];
              const badgeCreationDate = badgeArray[3];
              const imageName = badgeid + ".png";

              // Given Date
              let badgeCreatedAt = badgeCreationDate;
              if (
                typeof badgeCreatedAt === "string" &&
                /^\d+$/.test(badgeCreatedAt)
              ) {
                badgeCreatedAt = Number(badgeCreatedAt);
              }
              if (typeof badgeCreatedAt === "number" && badgeCreatedAt < 1e12) {
                badgeCreatedAt = badgeCreatedAt * 1000;
              }
              const date = new Date(badgeCreatedAt);
              const day = date.getDate();
              const month = date.toLocaleString("en-US", { month: "short" });
              const year = date.getFullYear();
              const ordinal =
                day > 3 && day < 21
                  ? "th"
                  : ["th", "st", "nd", "rd"][day % 10] || "th";
              const formattedDate = `${day}${ordinal} ${month} ${year}`;

              badgesHTML += `<img
            class="badge-image"
            src="/static/images/badges/${imageName}"
            alt="${badgeName}"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="${badgeName} Badge | Awarded on ${formattedDate}"
          />`;
            });
          }
        } catch (err) {
          showError("There was an issue loading a badge.");
          console.log(`Badge loading error: ${err}`);
        }
        document.getElementById("profile-badges").innerHTML = badgesHTML;
        var tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Share Profile
        function shareProfile() {
          // Copy to clipboard
          navigator.clipboard
            .writeText(`${WEBSITE_URL}/profile/${data.id}`)
            .then(() => {
              showToast("Link copied to clipboard.");
            })
            .catch((err) => {
              // Error while sharing
              showError(
                "There was an issue while creating a link for your profile."
              );
              console.log(`Profile sharing error: ${err}`);
            });
        }

        // Fetch Posted Games
        fetch(`/api/games?author=${data.id}`, {
          method: "GET",
        })
          .then((response) => response.json())
          .then((data) => {
            let htmlForContainer = "";
            data.forEach((game) => {
              htmlForContainer += createGameCard(game);
            });
            document.getElementById("postedGameContainer").innerHTML =
              htmlForContainer;

            if (window.updateArrows) {
              window.updateArrows();
            }
          })
          .catch((err) => {
            showError("There was an issue loading your posted games.");
            console.log(`Posted games error: ${err}`);
          });
      }
    })
    .catch((err) => {
      showError("There was an issue loading your profile.");
      console.log(`Profile loading error: ${err}`);
      console.log(err);
    });
});

document.addEventListener("click", (e) => {
  const card = e.target.closest(".game-card");
  if (!card) return;
  const gameId = card.dataset.gameid;
  if (!gameId) return;
  if (typeof window.startGame === "function") {
    window.startGame(gameId);
  }
  e.preventDefault();
});

function createGameCard(game) {
  const title = (game.title || "Untitled").toString();
  const gameId = game.id !== undefined ? String(game.id) : "";
  const thumbnail =
    game.thumbnail ||
    "https://hc-cdn.hel1.your-objectstorage.com/s/v3/f5875e19da9c3d8f541114abe98599df3b7818aa_image.png";
  const likes = formatNumber(game.likes || 0);
  const plays = formatNumber(game.plays || 0);

  return `
    <a class="game-card" data-gameid="${escapeHtml(gameId)}" href="#">
      <div class="card card-game shadow-lg" style="width: 10rem">
        <div class="position-relative overflow-hidden">
          <img
            src="${escapeHtml(thumbnail)}"
            class="card-img-top rounded"
            alt="Game thumbnail"
          />
        </div>
        <div class="card-body text-white p-2">
          <h6 class="card-title fw-bold mb-2">${escapeHtml(title)}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <i
                class="bi bi-heart-fill text-danger me-1"
                style="font-size: 0.8rem"
              ></i>
              <small
                class="text-light fw-semibold"
                style="font-size: 0.7rem"
                >${escapeHtml(likes)}</small
              >
            </div>
            <div class="d-flex align-items-center">
              <i
                class="bi bi-eye-fill text-info me-1"
                style="font-size: 0.8rem"
              ></i>
              <small
                class="text-light fw-semibold"
                style="font-size: 0.7rem"
                >${escapeHtml(plays)}</small
              >
            </div>
          </div>
        </div>
      </div>
    </a>
  `;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
