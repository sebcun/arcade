function showProfile(userid = null) {
  showModal(
    "Loading",
    "If you see this dm me on slack for an extra free badge :) https://hackclub.slack.com/team/U0971C3C44D"
  );
  if (userid) {
    // Fetch Other Profile
    fetch(`/api/profile/${userid}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          // Profile Not Found
          showToast("Profile not found!", { color: "error" });
          console.log(`Profile loading error: ${data.error}`);
        } else {
          // Profile Found

          // Level Image
          const starNumber = Math.min(5, Math.floor(data.level / 10) + 1);
          const starNames = ["One", "Two", "Three", "Four", "Five"];
          let levelImage = `/static/images/levels/Star${
            starNames[starNumber - 1]
          }.png`;

          // Badges HTML
          let badgesHTML = "";
          try {
            // Parse badges to proper array
            const badges = JSON.parse(data.badges);
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
                const date = new Date(badgeCreationDate);
                const day = date.getDate();
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                const ordinal =
                  day > 3 && day < 21
                    ? "th"
                    : ["th", "st", "nd", "rd"][day % 10] || "th";
                const formattedDate = `${day}${ordinal} ${month} ${year}`;

                badgesHTML += `<img src="/static/images/badges/${imageName}" alt="${badgeName}" title="${badgeDescription} | ${formattedDate}" class="badge-image">`;
              });
            }
          } catch (err) {
            // Error while loading a badge
            showToast("There was an issue loading a badge.", {
              color: "error",
            });
            console.log(`Badge loading error: ${err}`);
          }

          // Avatar
          let avatar = { face: "white", eyes: "blue", hair: "one_brown" };
          if (data.avatar) {
            try {
              avatar = JSON.parse(data.avatar);
            } catch (e) {
              console.log("Invalid avatar data");
            }
          }

          // Creation date of user
          let creationDate = "";
          const date = new Date(data.created_at);
          const month = date.toLocaleString("en-US", { month: "long" });
          const year = date.getFullYear();
          creationDate = `${month} ${year}`;

          // Share profile
          function shareProfile() {
            // Copy to clipboard
            navigator.clipboard
              .writeText(`${WEBSITE_URL}/?profile=${data.id}`)
              .then(() => {
                showToast("Link copied to clipboard.");
              })
              .catch((err) => {
                // Error while sharing
                showToast(
                  "There was an issue while creating a link for the profile.",
                  {
                    color: "error",
                  }
                );
                console.log(`Profile sharing error: ${err}`);
              });
          }
          window.shareProfile = shareProfile;

          // Report profile
          function reportProfile() {
            showToast("Coming soon.");
          }
          window.reportProfile = reportProfile;

          showModal(
            "Profile",
            `
            <div class="profile-modal-content">
                <div class="profile-scrollable">
                    <div class="profile-avatar"> 
                      <img src="/static/images/avatars/face/${avatar.face}.png">
                      <img src="/static/images/avatars/eyes/${avatar.eyes}.png">
                      <img src="/static/images/avatars/hair/${avatar.hair}.png">
                      <img src=${levelImage} class="level-image">
                    </div>
                    <div class="profile-details">
                        <h2>@${
                          data.username
                        } <span class="profile-badges">${badgesHTML}</span> </h2>
                        <p><strong>Level:</strong> ${data.level}</p>
                        <p><strong>Joined:</strong> ${creationDate}</p>
                        <p><strong>Bio:</strong> ${data.bio || "Not Set"}</p>
                    </div>
                </div>
                <div class="profile-buttons">
                    <a onclick="shareProfile()">
                        <img src="/static/images/ShareBtn.png" alt="Share Profile">
                    </a>
                    <a href="#" onclick="reportProfile()">
                        <img src="/static/images/ReportBtn.png" alt="Report Profile">
                    </a>
                </div>
            </div>
            `
          );
        }
      })
      // Error loading profile
      .catch((err) => {
        showToast("There was an issue loading the profile.", {
          color: "error",
        });
        console.log(`Profile loading error: ${err}`);
        console.log(err);
      });
  } else {
    // Fetch Own Profile
    fetch("/api/me", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          // Profile Not Found (not logged in)
          showLoginModal();
          showToast("You are not logged in!", { color: "error" });
          console.log(`Profile loading error: ${data.error}`);
        } else {
          // Profile Found

          // Level Image
          const starNumber = Math.min(5, Math.floor(data.level / 10) + 1);
          const starNames = ["One", "Two", "Three", "Four", "Five"];
          let levelImage = `/static/images/levels/Star${
            starNames[starNumber - 1]
          }.png`;

          // Badges HTML
          let badgesHTML = "";
          try {
            // Parse badges to proper array
            const badges = JSON.parse(data.badges);
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
                const date = new Date(badgeCreationDate);
                const day = date.getDate();
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                const ordinal =
                  day > 3 && day < 21
                    ? "th"
                    : ["th", "st", "nd", "rd"][day % 10] || "th";
                const formattedDate = `${day}${ordinal} ${month} ${year}`;

                badgesHTML += `<img src="/static/images/badges/${imageName}" alt="${badgeName}" title="${badgeDescription} | ${formattedDate}" class="badge-image">`;
              });
            }
          } catch (err) {
            // Error while loading a badge
            showToast("There was an issue loading a badge.", {
              color: "error",
            });
            console.log(`Badge loading error: ${err}`);
          }

          // Avatar
          let avatar = { face: "white", eyes: "blue", hair: "one_brown" };
          if (data.avatar) {
            try {
              avatar = JSON.parse(data.avatar);
            } catch (e) {
              console.log("Invalid avatar data");
            }
          }

          // Creation Date of user
          let creationDate = "";
          const date = new Date(data.created_at);
          const month = date.toLocaleString("en-US", { month: "long" });
          const year = date.getFullYear();
          creationDate = `${month} ${year}`;

          // Share profile
          function shareProfile() {
            // Copy to clipboard
            navigator.clipboard
              .writeText(`${WEBSITE_URL}/?profile=${data.id}`)
              .then(() => {
                showToast("Link copied to clipboard.");
              })
              .catch((err) => {
                // Error while sharing
                showToast(
                  "There was an issue while creating a link for your profile.",
                  {
                    color: "error",
                  }
                );
                console.log(`Profile sharing error: ${err}`);
              });
          }
          window.shareProfile = shareProfile;

          showModal(
            "Your Profile",
            `
            <div class="profile-modal-content">
                <div class="profile-scrollable">
                  <div class="profile-avatar"> 
                      <img src="/static/images/avatars/face/${avatar.face}.png">
                      <img src="/static/images/avatars/eyes/${avatar.eyes}.png">
                      <img src="/static/images/avatars/hair/${avatar.hair}.png">
                      <div class="avatar-bottom">
                        <img src="/static/images/Pencil.png" alt="Edit Avatar" onclick="showEditAvatar()" class="edit-avatar-btn">
                        <img src=${levelImage} class="level-image">
                      </div>
                  </div>
                  <div class="profile-details">
                        <h2>@${
                          data.username
                        } <span class="profile-badges">${badgesHTML}</span> </h2>
                        <p><strong>Level:</strong> ${data.level}</p>
                        <p><strong>Joined:</strong> ${creationDate}</p>
                        <p><strong>Bio:</strong> ${data.bio || "Not Set"}</p>
                  </div>
                </div>
                <div class="profile-buttons">
                    <a onclick="shareProfile()">
                      <img src="/static/images/ShareBtn.png" alt="Share Profile">
                    </a>
                </div>
            </div>
            `
          );
        }
      })
      // Error loading profile
      .catch((err) => {
        showToast("There was an issue loading your profile.", {
          color: "error",
        });
        console.log(`Profile loading error: ${err}`);
      });
  }
}
