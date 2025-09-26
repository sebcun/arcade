const gameList = document.getElementById("game-list");

document.addEventListener("DOMContentLoaded", async () => {
  if (!gameList) {
    console.error("No element with id 'game-list' found.");
    return;
  }

  gameList.addEventListener("click", (e) => {
    const card = e.target.closest && e.target.closest(".game-card");
    if (!card || !gameList.contains(card)) return;
    const gameId = card.dataset.gameid;
    if (!gameId) return;
    if (typeof window.startGame === "function") {
      window.startGame(gameId);
    }
    e.preventDefault();
  });

  try {
    const resp = await fetch("/api/games");
    if (!resp.ok) throw new Error(`Failed to load games: ${resp.status}`);
    const data = await resp.json();

    const htmlParts = await Promise.all(
      data.map(async (game) => {
        try {
          const authorResp = await fetch(`/api/profile/${game.author}`);
          if (!authorResp.ok) {
            console.warn(
              `Failed to fetch author ${game.author}: ${authorResp.status}`
            );
            return createGameCard(game, { username: "unknown" });
          }
          const authorData = await authorResp.json();
          return createGameCard(game, authorData);
        } catch (err) {
          console.warn("Author fetch error for", game.author, err);
          return createGameCard(game, { username: "unknown" });
        }
      })
    );

    gameList.innerHTML = htmlParts.join("");
  } catch (err) {
    console.error("Error loading games:", err);
    gameList.innerHTML = "<div class='error'>Failed to load games.</div>";
  }
});

function createGameCard(game, authorData) {
  const title = (game.title || "Untitled").toString();
  const username =
    authorData && authorData.username
      ? authorData.username.toString()
      : "unknown";
  const gameId = game.id !== undefined ? String(game.id) : "";

  return `
    <a
      class="game-card"
      data-gameid="${escapeHtml(gameId)}"
      aria-label="${escapeHtml(title)}"
      style="background-color: #555555"
      href="#"
    >
      <div class="badge">Arcade</div>
      <div class="overlay">
        <div class="title">${escapeHtml(title)}</div>
        <div class="author">@${escapeHtml(username)}</div>
      </div>
    </a>
  `;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
