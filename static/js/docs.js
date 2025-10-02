document.addEventListener("DOMContentLoaded", () => {
  const documentationCollapseContents = document.getElementById(
    "documentationCollapseContents"
  );

  fetch("/static/docs.json")
    .then((response) => response.json())
    .then((data) => {
      const keyMap = {};
      Object.keys(data).forEach((k) => {
        keyMap[k.toLowerCase()] = k;
      });

      Object.entries(data).forEach(([categoryName, contents]) => {
        if (contents["title"]) {
          const a = document.createElement("a");
          a.href = "#";
          a.className = "list-group-item list-group-item-action";
          a.textContent = contents["title"];
          a.dataset.section = categoryName;
          a.dataset.page = "";
          a.addEventListener("click", (event) => {
            event.preventDefault();
            document
              .querySelectorAll(".sidebar a")
              .forEach((link) => link.classList.remove("active"));
            event.target.classList.add("active");
            loadDoc(categoryName, contents["title"], contents);
          });
          documentationCollapseContents.appendChild(a);
        } else {
          const button = document.createElement("button");
          button.className = "list-group-item list-group-item-action";
          button.type = "button";
          button.setAttribute("data-bs-toggle", "collapse");
          button.setAttribute("data-bs-target", `#${categoryName}Collapse`);
          button.setAttribute("aria-expanded", "false");
          button.setAttribute("aria-controls", `${categoryName}Collapse`);
          button.textContent = categoryName;

          const icon = document.createElement("i");
          icon.className = "bi bi-chevron-right chevron-icon ms-auto";
          button.appendChild(icon);

          documentationCollapseContents.appendChild(button);

          const collapseDiv = document.createElement("div");
          collapseDiv.className = "collapse";
          collapseDiv.id = `${categoryName}Collapse`;

          const listGroup = document.createElement("div");
          listGroup.className = "list-group list-group-flush ms-3";
          collapseDiv.appendChild(listGroup);

          Object.entries(contents).forEach(([docName, content]) => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = "list-group-item list-group-item-action";
            a.textContent = content["docTitle"] || content["title"] || docName;
            a.dataset.section = categoryName;
            a.dataset.page = docName;

            a.addEventListener("click", (event) => {
              event.preventDefault();

              document
                .querySelectorAll(".sidebar a")
                .forEach((link) => link.classList.remove("active"));

              event.target.classList.add("active");

              loadDoc(categoryName, content["title"], content);
            });

            listGroup.appendChild(a);
          });

          documentationCollapseContents.appendChild(collapseDiv);
        }
      });

      const urlParams = new URLSearchParams(window.location.search);
      const introKey = keyMap["introduction"] || Object.keys(data)[0];

      const openDocs = urlParams.has("docs");

      let initialSectionKey = openDocs ? introKey : null;
      let initialPage = null;
      if (openDocs) {
        if (urlParams.has("command")) {
          const cmd = urlParams.get("command");
          if (keyMap["commands"]) {
            const commandsKey = keyMap["commands"];
            if (data[commandsKey] && data[commandsKey][cmd]) {
              initialSectionKey = commandsKey;
              initialPage = cmd;
            }
          }
        } else if (urlParams.has("event")) {
          const evt = urlParams.get("event");
          if (keyMap["events"]) {
            const eventsKey = keyMap["events"];
            if (data[eventsKey] && data[eventsKey][evt]) {
              initialSectionKey = eventsKey;
              initialPage = evt;
            }
          }
        } else if (urlParams.has("tutorial")) {
          const tut = urlParams.get("tutorial");
          if (keyMap["tutorials"]) {
            const tutorialsKey = keyMap["tutorials"];
            if (data[tutorialsKey] && data[tutorialsKey][tut]) {
              initialSectionKey = tutorialsKey;
              initialPage = tut;
            }
          }
        }
      }

      let toLoad = null;
      if (initialSectionKey && initialPage) {
        toLoad = data[initialSectionKey][initialPage];
      } else if (initialSectionKey) {
        const sectionObj = data[initialSectionKey];
        if (sectionObj && sectionObj.title) {
          toLoad = sectionObj;
          initialPage = "";
        } else if (sectionObj) {
          const firstDocKey = Object.keys(sectionObj)[0];
          initialPage = firstDocKey;
          toLoad = sectionObj[firstDocKey];
        }
      }

      if (openDocs && initialSectionKey) {
        const navLink = document.querySelector(
          `.sidebar a[data-section="${initialSectionKey.toLowerCase()}"]`
        );
        if (navLink) {
          document
            .querySelectorAll(".sidebar a")
            .forEach((link) => link.classList.remove("active"));
          navLink.classList.add("active");
        }
      }

      if (openDocs && toLoad) {
        document
          .querySelectorAll(".list-group a")
          .forEach((link) => link.classList.remove("active"));

        const anchorSelector = `.list-group a[data-section="${initialSectionKey}"][data-page="${
          initialPage || ""
        }"]`;
        const anchor = document.querySelector(anchorSelector);
        if (anchor) {
          anchor.classList.add("active");
        }

        loadDoc(
          initialSectionKey,
          toLoad.title || toLoad.docTitle || "",
          toLoad
        );
      }
    })
    .catch((error) => console.error("Error loading docs:", error));
});

function loadDoc(section, title, content, copy) {
  document.querySelectorAll(".collapse").forEach((el) => {
    if (el.id !== `${section}Collapse` && el.id !== "documentationCollapse") {
      el.classList.remove("show");
      const btn = document.querySelector(`[data-bs-target  ="#${el.id}"]`);
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });

  const docCollapse = document.getElementById(`documentationCollapse`);
  if (docCollapse && !docCollapse.classList.contains("show")) {
    docCollapse.classList.add("show");
    const button = document.querySelector(
      `[data-bs-target="#documentationCollapse"]`
    );
    if (button) {
      button.setAttribute("aria-expanded", "true");
    }
  }

  const sectionCollapse = document.getElementById(`${section}Collapse`);
  if (sectionCollapse && !sectionCollapse.classList.contains("show")) {
    sectionCollapse.classList.add("show");
    const button = document.querySelector(
      `[data-bs-target="#${section}Collapse"]`
    );
    if (button) {
      button.setAttribute("aria-expanded", "true");
    }
  }

  const developHeading = document.getElementById("developHeading");
  const developContainer = document.getElementById("developContainer");

  let html = "<div>";
  content.content.forEach((item) => {
    if (item.type === "text") {
      html += item.content.replace(/\n/g, "<br>");
    } else if (item.type === "sub") {
      html += `<br><br><h5>${item.content.replace(/\n/g, "<br>")}</h5>`;
    } else if (item.type === "code") {
      const escaped = item.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<div class="code-block"><code>${escaped}</code></div>`;
    } else if (item.type === "br") {
      html += `<br>`;
    } else if (item.type === "img") {
      html += `<img src="${item.content}" alt="Documentation image" style="max-width: 100%; height: auto;">`;
    } else if (item.type === "link") {
      html += `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.content}</a>`;
    } else if (item.type === "vid") {
      html += `<video src="${item.content}" controls style="max-width: 100%; height: auto;" alt="Documentation video"></video>`;
    }
  });
  html += "</div>";
  developHeading.textContent = title;
  developContainer.innerHTML = html;

  let docTitle = (content["docTitle"] || "").replace(/\s+/g, "");
  let copyUrl = `${WEBSITE_URL}/develop?docs`;
  if (section === "Commands") {
    copyUrl += `&command=${docTitle}`;
  } else if (section === "Events") {
    copyUrl += `&event=${docTitle}`;
  } else if (section === "Tutorials") {
    copyUrl += `&tutorial=${docTitle}`;
  }

  const copyBtn = document.getElementById("copy-button");
  if (copyBtn) copyBtn.dataset.copyText = copyUrl;
  const copyBtnImg = document.getElementById("copy-button-img");
  copyBtnImg.classList.remove("d-none");
}
