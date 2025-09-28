const gameList = document.getElementById("game-list");

document.addEventListener("DOMContentLoaded", async () => {
  const categories = [
    { name: "Most Liked Games", sort: "liked", id: "most-liked" },
    { name: "Most Played Games", sort: "played", id: "most-played" },
    { name: "Most Recently Posted Games", sort: "recent", id: "most-recent" },
  ];

  for (const cat of categories) {
    const carousel = document.getElementById(`${cat.id}-carousel`);
    if (!carousel) continue;

    try {
      const resp = await fetch(`/api/games?sort=${cat.sort}&limit=30`);
      if (!resp.ok)
        throw new Error(`Failed to load ${cat.name}: ${resp.status}`);
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

      carousel.innerHTML = htmlParts.join("");

      // Duplicate items for infinite carousel effect
      const items = carousel.querySelectorAll(".game-card");
      if (items.length > 0) {
        const duplicated = Array.from(items).map((item) =>
          item.cloneNode(true)
        );
        duplicated.forEach((item) => carousel.appendChild(item));
      }

      carousel.addEventListener("scroll", () => {
        const scrollLeft = carousel.scrollLeft;
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        if (scrollLeft >= scrollWidth - clientWidth - 10) {
          carousel.scrollLeft = 0;
        }
      });
    } catch (err) {
      console.error(`Error loading ${cat.name}:`, err);
      carousel.innerHTML = "<div class='error'>Failed to load games.</div>";
    }
  }
});

// Global click handler for game cards
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

function createGameCard(game, authorData) {
  const title = (game.title || "Untitled").toString();
  const username =
    authorData && authorData.username
      ? authorData.username.toString()
      : "unknown";
  const gameId = game.id !== undefined ? String(game.id) : "";

  return `
    <a class="game-card" data-gameid="${escapeHtml(
      gameId
    )}" aria-label="${escapeHtml(
    title
  )}" style="background-color: #555555" href="#">
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
