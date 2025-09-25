document.addEventListener("DOMContentLoaded", () => {
  let docsData = {};

  // Load docs.json
  fetch("/static/docs.json")
    .then((response) => response.json())
    .then((data) => {
      docsData = data;
      populateSidebar();
      loadSection("introduction");

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

    let html = `<h1>${data.title}</h1>`;
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
