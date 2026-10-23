
const form = document.getElementById("login-form");
const message = document.getElementById("message");
const button = document.getElementById("login-button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "";
  button.disabled = true;

  try {
    const response = await fetch("https://doggy-doggy-api.onrender.com/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed.");
    }

    sessionStorage.setItem("doggyAdminToken", data.access_token);
    window.location.href = "admin.html";
  } catch (error) {
    message.textContent =
      error.message === "Failed to fetch"
        ? "Cannot connect to the server. Check that the backend is running."
        : error.message;
  } finally {
    button.disabled = false;
  }
});
