let loadedCount = 0;
let totalImages = 0;
let imagesToPreload = [];

fetch("/api/images")
  .then((response) => response.json())
  .then((images) => {
    imagesToPreload = images;
    totalImages = imagesToPreload.length;
    return Promise.all(imagesToPreload.map(preloadImage));
  })
  .then(() => {
    document.getElementById("loading-screen").style.display = "none";
  });

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(src);
    img.src = "/static/" + src;
  });
}
