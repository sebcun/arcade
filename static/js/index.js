document.addEventListener("DOMContentLoaded", async () => {
  const categories = [
    { name: "Most Liked Games", sort: "liked", id: "mostLikedContainer" },
    { name: "Most Played Games", sort: "played", id: "mostPlayedContainer" },
    {
      name: "Most Recently Posted Games",
      sort: "recent",
      id: "mostRecentContainer",
    },
  ];

  for (const cat of categories) {
    const container = document.getElementById(cat.id);
    if (!container) continue;

    try {
      const resp = await fetch(`/api/games?sort=${cat.sort}&limit=30`);
      if (!resp.ok)
        throw new Error(`Failed to load ${cat.name}: ${resp.status}`);
      const data = await resp.json();

      const htmlParts = await Promise.all(
        data.map(async (game) => {
          try {
            const authorResp = await fetch(`/api/user?id=${game.author}`);
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

      container.innerHTML = htmlParts.join("");
    } catch (err) {
      console.error(`Error loading ${cat.name}:`, err);
      container.innerHTML = "<div class='error'>Failed to load games.</div>";
    }
  }
});

function createGameCard(game, authorData) {
  const title = (game.title || "Untitled").toString();
  const gameId = game.id !== undefined ? String(game.id) : "";
  const thumbnail =
    game.thumbnail ||
    "https://hc-cdn.hel1.your-objectstorage.com/s/v3/e3e093448e581885bec0d2944645d9adbc0ec443_black.png";
  const likes = formatNumber(game.likes || 0);
  const plays = formatNumber(game.plays || 0);

  return `
    <a class="game-card" data-gameid="${escapeHtml(
      gameId
    )}" href="/game/${gameId}">
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
