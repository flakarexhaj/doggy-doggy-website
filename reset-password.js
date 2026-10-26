const SUPABASE_URL = "https://emgidrggkrqekztfqrqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xiI4drD-EMZKsoQf8HQoPQ_KuO41-6V";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.getElementById("reset-form");
const passwordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const button = document.getElementById("reset-button");
const message = document.getElementById("message");

const params = new URLSearchParams(window.location.search);
const tokenHash = params.get("token_hash");

let verified = false;

if (!tokenHash) {
  message.textContent =
    "This reset link is invalid or expired. Please request a new one.";
  button.disabled = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (password.length < 6) {
    message.textContent = "Password must be at least 6 characters long.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "The passwords do not match.";
    return;
  }

  button.disabled = true;

  try {
    // Tokeni verifikohet vetëm tani, kur përdoruesi shtyp butonin
    if (!verified) {
      const { error: verifyError } = await supabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery"
      });

        if (verifyError) {
        console.error("verifyOtp error:", verifyError);
        throw new Error(verifyError.message);
      }
      verified = true;
    }

    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;

    message.textContent =
      "Your password has been changed successfully. You can now log in.";
    form.reset();
    button.textContent = "Password Updated";
  } catch (error) {
    message.textContent = error.message || "Could not update the password.";
    button.disabled = false;
  }
});