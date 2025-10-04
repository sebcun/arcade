function openCoins() {
  fetch(`/api/user`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showLoginModal("");
      } else {
        fetch(`/api/purchases`, {
          method: "GET",
        })
          .then((response) => response.json())
          .then((purchasesData) => {
            let transactionRows = "";

            if (Array.isArray(purchasesData) && purchasesData.length > 0) {
              const recentPurchases = purchasesData.slice(0, 10);
              transactionRows = recentPurchases
                .map((purchase, index) => {
                  const date = new Date(purchase.created_at * 1000);
                  const formattedDate =
                    date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) +
                    " | " +
                    date.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                  return `
                  <tr>
                    <td>#${purchase.id}</td>
                    <td>${purchase.description}</td>
                    <td>${formattedDate}</td>
                  </tr>
                `;
                })
                .join("");
            } else {
              transactionRows = `
                <tr>
                  <td colspan="3" class="text-center text-muted">No transactions yet</td>
                </tr>
              `;
            }

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
                  ${transactionRows}
                </tbody>
              </table>
            `;

            showModal("Coins", "", coinHTML, [], true);
          })
          .catch((err) => {
            console.log(`Purchases loading error: ${err}`);
            const coinHTML = `
              <h4>You have <strong>${data.coins} coins.</strong></h4>
              <h5>Recent Transactions</h5>
              <p class="text-muted">Unable to load transaction history.</p>
            `;
            showModal("Coins", "", coinHTML, [], true);
          });
      }
    })
    .catch((err) => {
      showError("There was an issue loading your profile.");
      console.log(`Profile loading error: ${err}`);
      console.log(err);
    });
}
