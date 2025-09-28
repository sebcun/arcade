(function () {
  const LOCALE_KEY = "preloadedImagesHash";
  const LAST_PRELOAD_KEY = "preloadedImagesAt";
  const REVALIDATE_MS = 24 * 60 * 60 * 500;
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) return;

  const prevHash = localStorage.getItem(LOCALE_KEY);
  const lastPreloadAt = parseInt(
    localStorage.getItem(LAST_PRELOAD_KEY) || "0",
    10
  );
  const now = Date.now();

  if (prevHash && now - lastPreloadAt < REVALIDATE_MS) {
    loadingScreen.style.display = "none";
  }

  fetch("/api/images")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch images list");
      return response.json();
    })
    .then((images) => {
      if (!Array.isArray(images)) throw new Error("Unexpected images payload");

      const newHash = images.join("|");

      if (prevHash === newHash) {
        localStorage.setItem(LAST_PRELOAD_KEY, String(Date.now()));
        loadingScreen.style.display = "none";
        images.forEach((src) => {
          const img = new Image();
          img.src = "/static/" + src;
        });
        return;
      }

      loadingScreen.style.display = "flex";
      return preloadAll(images).then(() => {
        localStorage.setItem(LOCALE_KEY, newHash);
        localStorage.setItem(LAST_PRELOAD_KEY, String(Date.now()));
        loadingScreen.style.display = "none";
      });
    })
    .catch((err) => {
      console.error("Image preloading failed:", err);
      loadingScreen.style.display = "none";
    });

  function preloadAll(images) {
    let loadedCount = 0;
    const total = images.length;
    if (total === 0) return Promise.resolve();

    return Promise.all(
      images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            resolve({ src, ok: true });
          };
          img.onerror = () => {
            loadedCount++;
            resolve({ src, ok: false });
          };
          img.src = "/static/" + src;
        });
      })
    );
  }
})();
