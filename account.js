
const SUPABASE_URL = "https://emgidrggkrqekztfqrqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xiI4drD-EMZKsoQf8HQoPQ_KuO41-6V";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.getElementById("account-form");
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const nameField = document.getElementById("name-field");
const fullName = document.getElementById("full-name");
const phoneInput = document.getElementById("account-phone");
const addressInput = document.getElementById("account-address");
const cityInput = document.getElementById("account-city");
const emailInput = document.getElementById("account-email");
const passwordInput = document.getElementById("account-password");
const submitButton = document.getElementById("submit-button");
const message = document.getElementById("message");


let mode = "login";

function setMode(newMode) {
  mode = newMode;

  const isSignup = mode === "signup";

  loginTab.classList.toggle("active", !isSignup);
  signupTab.classList.toggle("active", isSignup);

  nameField.hidden = !isSignup;
  fullName.required = isSignup;
  phoneInput.required = isSignup;
  addressInput.required = isSignup;
  cityInput.required = isSignup; 

  passwordInput.autocomplete = isSignup
    ? "new-password"
    : "current-password";

  submitButton.textContent = isSignup
    ? "Create Account"
    : "Log In";

  message.textContent = "";
}

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));
console.log("Signup button:", signupTab);
console.log("Current page:", window.location.pathname);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const name = fullName.value.trim();
  const phone = phoneInput.value.trim();
const address = addressInput.value.trim();
const city = cityInput.value.trim();

  message.textContent = "";
  submitButton.disabled = true;

  try {
    if (mode === "signup") {
 if (!name || !phone || !address || !city) {
  throw new Error("Please complete all required fields.");
}
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
         data: {
  full_name: name,
  phone: phone,
  address: address,
  city: city
}
        }
      });

      if (error) throw error;

      if (data.session) {
        message.textContent = "Account created successfully!";
        window.location.href = "index.html";
      } else {
        message.textContent =
          "Registration received. Check your email to confirm your account before logging in.";
      }
    } else {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      if (data.session) {
        message.textContent = "Login successful!";
        window.location.href = "index.html";
      }
    }
  } catch (error) {
    message.textContent = error.message || "Something went wrong.";
  } finally {
    submitButton.disabled = false;
  }
});

console.log("Customer account page initialized:", !!supabaseClient);
