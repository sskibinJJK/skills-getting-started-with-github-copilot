document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const toastDiv = document.getElementById("toast");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants.map(email => `
                  <li>
                    <span class="participant-email">${email}</span>
                    <button class="delete-icon" title="Unregister" data-email="${email}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff" style="background:#d32f2f; border-radius:50%; padding:2px; box-shadow:0 0 2px #333;">
                        <path d="M3 6h18" stroke="#fff" stroke-width="2"/>
                        <path d="M8 6v12c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6" stroke="#fff" stroke-width="2"/>
                        <rect x="10" y="11" width="1.5" height="6" fill="#fff"/>
                        <rect x="12.5" y="11" width="1.5" height="6" fill="#fff"/>
                      </svg>
                    </button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);
        // Add delete event listeners for each delete icon
        activityCard.addEventListener("click", async (e) => {
          let deleteBtn = null;
          if (e.target.classList.contains("delete-icon")) {
            deleteBtn = e.target;
          } else if (e.target.closest && e.target.closest(".delete-icon")) {
            deleteBtn = e.target.closest(".delete-icon");
          }
          if (deleteBtn) {
            const email = deleteBtn.getAttribute("data-email");
            const activityName = name;
            if (confirm(`Unregister ${email} from ${activityName}?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: "POST"
                });
                const result = await response.json();
                if (response.ok) {
                  showToast(result.message, "success");
                  fetchActivities();
                } else {
                  showToast(result.detail || "Failed to unregister participant.", "error");
                }
                messageDiv.classList.remove("hidden");
                // Toast handles its own timeout
              } catch (err) {
                showToast("Error occurred while unregistering.", "error");
              }
            }
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        signupForm.reset();
      } else {
        showToast(result.detail || "An error occurred", "error");
      }
      // Toast handles its own timeout
    } catch (error) {
      showToast("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Toast notification function (global)
  function showToast(message, type = "success") {
    if (window._toastTimeout) {
      clearTimeout(window._toastTimeout);
    }
    toastDiv.textContent = message;
    toastDiv.className = `toast ${type}`;
    toastDiv.classList.remove("hidden");
    window._toastTimeout = setTimeout(() => {
      toastDiv.classList.add("hidden");
    }, 5000);
  }

  // Initialize app
  fetchActivities();
});
