function openCoins() {
  fetch(`/api/user`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showLoginModal("");
      } else {
        const coinHTML = `
        <h4>You have <strong>${data.coins} coins.</strong></h4>
        <h5>Recent Transactions</h5>

        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#3</td>
              <td>BLUE Avatar Background</td>
              <td>4th Oct 2025 | 12:39PM</td>
            </tr>
            <tr>
              <td>#2</td>
              <td>ORANGE Avatar Background</td>
              <td>4th Oct 2025 | 12:32PM</td>
            </tr>
            <tr>
              <td>#1</td>
              <td>+2 Sprites (Game ID: 2)</td>
              <td>4th Oct 2025 | 12:12PM</td>
            </tr>
          </tbody>
        </table>

        `;
        showModal("Coins", "", coinHTML, [], true);
      }
    })
    .catch((err) => {
      showError("There was an issue loading your profile.");
      console.log(`Profile loading error: ${err}`);
      console.log(err);
    });
}
