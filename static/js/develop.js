document.addEventListener("DOMContentLoaded", () => {
  const copyBtn = document.getElementById("copy-button");
  if (copyBtn) copyBtn.dataset.copyText = `${WEBSITE_URL}/develop`;

  copyBtn.addEventListener("click", async () => {
    const text = copyBtn.dataset.copyText || "";
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("URL copied to clipboard!", { color: "success" });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        showToast("Failed to copy URL", { color: "error" });
      });
  });

  loadDevelop(
    "Pixelcade Develop Portal",
    "Welcome to the Pixelcade develop portal!<br><br>Use the sidebar to navigate the documentation, your games, and more!"
  );
  const urlParams = new URLSearchParams(window.location.search);
  const openDocs = urlParams.has("ysws");

  if (openDocs) {
    openYSWSEvent();
  }

  fetch(`/api/user`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showError("Profile not found!");
        console.log(`Profile loading error: ${data.error}`);
      } else {
        fetch(`/api/games?author=${data.id}`, {
          method: "GET",
        })
          .then((response) => response.json())
          .then((data) => {
            let htmlForContainer = "";
            data.forEach((game) => {
              htmlForContainer += `<a href="/develop/${game["id"]}" class="list-group-item list-group-item-action"
                >${game["title"]}</a
              >`;
            });
            document.getElementById("gamesContainer").innerHTML =
              htmlForContainer;
          })
          .catch((err) => {
            showError("There was an issue loading your games.");
            console.log(`Games error: ${err}`);
          });
      }
    })
    .catch((err) => {
      showError("Profile not found!");
      console.log(`Profile loading error: ${data.error}`);
    });
});

function loadDevelop(title, content, copy = null) {
  const developHeading = document.getElementById("developHeading");
  const developContainer = document.getElementById("developContainer");
  const copyBtn = document.getElementById("copy-button");
  const copyBtnImg = document.getElementById("copy-button-img");

  developHeading.textContent = title;
  developContainer.innerHTML = content;

  if (copy) {
    copyBtnImg.classList.remove("d-none");
    copyBtn.dataset.copyText = copy;
  } else {
    copyBtnImg.classList.add("d-none");
  }
}

function openDevelopHome() {
  loadDevelop(
    "Pixelcade Develop Portal",
    "Welcome to the Pixelcade develop portal!<br><br>Use the sidebar to navigate the documentation, your games, and more!"
  );

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));

  document.querySelectorAll(".collapse").forEach((el) => {
    el.classList.remove("show");
    const btn = document.querySelector(`[data-bs-target  ="#${el.id}"]`);
    if (btn) btn.setAttribute("aria-expanded", "false");
  });

  const navbarDevelopHome = document.getElementById("navbarDevelopHome");

  navbarDevelopHome.classList.add("active");
}

function openCreateModal() {
  const createFormHTML = `
  <form class="form-floating">
    <input 
      type="text" 
      class="form-control" 
      id="title" 
      name="title"
      placeholder="Cookie Clicker" 
      required
    >
    <label for="title">Game Name</label>
  </form>
  `;

  const modal = showModal("Create a Game", "", createFormHTML, [], true);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer custom-modal-footer";
  modal.querySelector(".modal-content").appendChild(modalFooter);

  const titleInput = modal.querySelector("#title");

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "btn btn-primary btn-long";
  nextButton.textContent = "Create";
  nextButton.id = "create-next-btn";
  nextButton.disabled = true;
  modalFooter.appendChild(nextButton);

  function updateNextButton() {
    if (titleInput.value === "") {
      nextButton.disabled = true;
    } else {
      nextButton.disabled = false;
    }
  }

  titleInput.addEventListener("input", function () {
    updateNextButton();
  });

  updateNextButton();

  nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    if (!title) {
      titleInput.classList.add("error");
      showToast("Please enter a game name.", { color: "error" });
      return;
    }

    nextButton.disabled = true;
    nextButton.textContent = "Creating.";
    let dots = 1;
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      nextButton.textContent = "Creating" + ".".repeat(dots);
    }, 300);

    fetch("/api/games/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: title }),
    })
      .then(async (resp) => {
        clearInterval(interval);
        nextButton.textContent = "Create";
        nextButton.disabled = false;
        const data = await resp.json();
        if (!resp.ok) {
          showError(data.error || "Failed to create game.");
          return;
        }
        const url = `/develop/${data["game_id"]}`;
        window.location.href = url;
      })
      .catch((err) => {
        clearInterval(interval);
        nextButton.textContent = "Create";
        nextButton.disabled = false;
        showError("Failed to create game.");
        console.error(err);
      });
  });
}

function openYSWSEvent() {
  loadDevelop(
    "YSWS Event",
    `
    <div>
    Want some free stickers for a task that should take less than 30 minutes? This is the event for you.<br><br>

    Simply create a game using Pixelcade's game editor, and 10 games will be chosen to receive a pack of stickers (3) shipped directly to you!<br>
    The 10 games will be chosen off of a criteria including functionality, originality, and looks.<br><br>
    
    We are also giving you the chance to get even more stickers!<br>Games with certain aspects that excel (eg code, or pixel art) will be given exclusive stickers for this event and for that aspect. For example, if your game is chosen to have amazing sprites/pixel art, you will receive a bonus cow sticker!<br><br>
    Games must be published and submitted by 11:59AEST October 31st 2025. Any games or changes made to games after this will not be counted.<br>
    Winners will be chosen and contacted on the 1st of November 2025 regarding shipment info.<br><br>
    There are some rules:<br>
       - Participants must be 18 or under at the end of the period (31st October, 2025)<br>
       - Participants can submit one game only<br>
       - All games must be individual work<br>
       - Games that copy the tutorial directly will not be accepted<br>
       - Have fun!<br><br>
    Ready to submit your project? <a href="https://forms.fillout.com/t/a59CMX3rfNus">Fill out this form.</a><br><br>
    Need some help getting started, <a href="https://pixelcade.sebcun.com/develop?docs&tutorial=CATCHTHEGUY">visit our docs and tutorial section for a tutorial on how to make a basic game.</a><br><br>
    Stickers, stickers, stickers! Here are some examples of the stickers you may receive: (You will also receive a Pixelcade sticker but that is still WIP)<br>
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/11d970ea35b1a6e36ab56a4377f3a9cc5304d679_cow.png">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/06a3d1a0a73f4028a72b0fdfc2cdf3cfcb47b948_startwo.png">
    </div>
       `
  );

  document
    .querySelectorAll(".sidebar a")
    .forEach((link) => link.classList.remove("active"));

  document.querySelectorAll(".collapse").forEach((el) => {
    el.classList.remove("show");
    const btn = document.querySelector(`[data-bs-target  ="#${el.id}"]`);
    if (btn) btn.setAttribute("aria-expanded", "false");
  });

  const navbarYSWSEvent = document.getElementById("navbarYSWSEvent");

  navbarYSWSEvent.classList.add("active");
}
