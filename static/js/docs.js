document.addEventListener("DOMContentLoaded", () => {
  let docsData = {};

  // Load docs.json
  fetch("/static/docs.json")
    .then((response) => response.json())
    .then((data) => {
      docsData = data;
      populateSidebar();

      const urlParams = new URLSearchParams(window.location.search);
      let initialSection = "introduction";
      let initialPage = null;

      if (urlParams.has("command")) {
        const cmd = urlParams.get("command");
        if (docsData.commands && docsData.commands[cmd]) {
          initialSection = "commands";
          initialPage = cmd;
        }
      } else if (urlParams.has("event")) {
        let evt = urlParams.get("event");
        if (evt === "ONTOUCH") evt = "ON TOUCH";
        else if (evt === "ONKEY") evt = "ON KEY";
        if (docsData.events && docsData.events[evt]) {
          initialSection = "events";
          initialPage = evt;
        }
      }

      loadSection(initialSection, initialPage);

      document
        .querySelectorAll(".sidebar-nav a")
        .forEach((a) => a.classList.remove("active"));

      const activeLink = document.querySelector(
        `a[data-section="${initialSection}"][data-page="${initialPage || ""}"]`
      );
      if (activeLink) {
        activeLink.classList.add("active");
        if (initialPage) {
          const submenu = activeLink.closest(".submenu");
          if (submenu) {
            submenu.classList.add("show");
            const toggle = document.querySelector(
              `.toggle-submenu[data-submenu="${initialSection}"]`
            );
            if (toggle) toggle.classList.add("open");
          }
        }
      }

      history.replaceState(null, "", window.location.pathname);

      document.querySelectorAll(".sidebar-nav a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const section = e.target.dataset.section;
          const page = e.target.dataset.page;
          loadSection(section, page);

          document
            .querySelectorAll(".sidebar-nav a")
            .forEach((a) => a.classList.remove("active"));
          e.target.classList.add("active");
        });
      });
    })
    .catch((error) => console.error("Error loading docs:", error));

  // Populate sidebar submenus
  function populateSidebar() {
    const commandsUl = document.getElementById("commands-submenu");
    const eventsUl = document.getElementById("events-submenu");
    const apiUl = document.getElementById("api-submenu");

    Object.keys(docsData.commands || {}).forEach((key) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-section="commands" data-page="${key}">${docsData.commands[key].title}</a>`;
      commandsUl.appendChild(li);
    });

    Object.keys(docsData.events || {}).forEach((key) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-section="events" data-page="${key}">${docsData.events[key].title}</a>`;
      eventsUl.appendChild(li);
    });

    Object.keys(docsData.api || {}).forEach((key) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-section="api" data-page="${key}">${docsData.api[key].title}</a>`;
      apiUl.appendChild(li);
    });
  }

  // Load section/page
  function loadSection(section, page = null) {
    const contentDiv = document.getElementById("content");
    let data;
    if (page) {
      data = docsData[section][page];
    } else {
      data = docsData[section];
    }

    let param = "";
    if (section === "commands" && page) {
      param = `?command=${page}`;
    } else if (section === "events" && page) {
      const urlEvent = page.replace(/\s+/g, "");
      param = `?event=${urlEvent}`;
    }

    const fullUrl = window.location.origin + "/docs" + param;

    let html = `<h1>${data.title} <i class="bi bi-copy copy-icon" style="cursor: pointer; margin-left: 10px; font-size: 1.2rem;" title="Copy URL"></i></h1>`;
    data.content.forEach((content) => {
      if (content.type === "text") {
        html += content.content.replace(/\n/g, "<br>");
      } else if (content.type === "sub") {
        html += `<h2>${content.content.replace(/\n/g, "<br>")}</h2>`;
      } else if (content.type === "code") {
        const escaped = content.content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        html += `<div class="code-block"><code>${escaped}</code></div>`;
      } else if (content.type === "br") {
        html += `<br>`;
      }
    });
    contentDiv.innerHTML = html;

    const copyIcon = contentDiv.querySelector(".copy-icon");
    if (copyIcon) {
      copyIcon.addEventListener("click", () => {
        navigator.clipboard
          .writeText(fullUrl)
          .then(() => {
            showToast("URL copied to clipboard!", { color: "success" });
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
            showToast("Failed to copy URL", { color: "error" });
          });
      });
    }
  }

  // Toggle submenus
  document.querySelectorAll(".toggle-submenu").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = document.getElementById(
        `${e.target.dataset.submenu}-submenu`
      );
      submenu.classList.toggle("show");
      e.target.classList.toggle("open");
    });
  });

  // Search functionality
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  function performSearch() {
    const query = searchInput.value.toLowerCase();
    const contentDiv = document.getElementById("content");
    if (!query) {
      loadSection("introduction");
      return;
    }

    let results = [];
    Object.keys(docsData).forEach((section) => {
      if (typeof docsData[section] === "object" && docsData[section].title) {
        // Introduction
        if (docsData[section].title.toLowerCase().includes(query)) {
          results.push({ section, page: null, data: docsData[section] });
        }
      } else {
        Object.keys(docsData[section]).forEach((page) => {
          const item = docsData[section][page];
          if (item.title.toLowerCase().includes(query)) {
            results.push({ section, page, data: item });
          }
        });
      }
    });

    if (results.length > 0) {
      contentDiv.innerHTML = `<h1>Search Results for "${query}"</h1>`;
      results.forEach((result) => {
        // Generate preview from text-type content only
        const previewText = result.data.content
          .filter((c) => c.type === "text")
          .map((c) => c.content)
          .join(" ");
        const preview =
          previewText.substring(0, 200) +
          (previewText.length > 200 ? "..." : "");
        contentDiv.innerHTML += `<h2><a href="#" data-section="${
          result.section
        }" data-page="${result.page || ""}">${
          result.data.title
        }</a></h2><p>${preview}</p>`;
      });
      contentDiv.querySelectorAll("a[data-section]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          loadSection(e.target.dataset.section, e.target.dataset.page || null);
        });
      });
    } else {
      contentDiv.innerHTML = `<h1>No results for "${query}"</h1>`;
    }
  }

  searchInput.addEventListener("input", performSearch);
  searchBtn.addEventListener("click", performSearch);

  // Mobile sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
});
