
const SUPABASE_URL = "https://emgidrggkrqekztfqrqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_xiI4drD-EMZKsoQf8HQoPQ_KuO41-6V";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.getElementById("reset-form");
const passwordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const button = document.getElementById("reset-button");
const message = document.getElementById("message");

let recoveryReady = false;

async function initializeRecovery() {
  button.disabled = true;
  message.textContent = "Verifying your reset link...";

  try {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (type === "recovery" && tokenHash) {
      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery"
      });

      if (error) throw error;

      // Remove the one-time token from the visible URL.
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session) {
      throw new Error(
        "The reset link could not be verified. Please request a new one."
      );
    }

    recoveryReady = true;
    message.textContent = "Link verified. Enter your new password.";
  } catch (error) {
    message.textContent =
      error.message || "Could not verify the reset link.";
  } finally {
    button.disabled = !recoveryReady;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  if (!recoveryReady) {
    message.textContent = "Please verify your reset link first.";
    return;
  }

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (password.length < 6) {
    message.textContent =
      "Password must be at least 6 characters long.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "The passwords do not match.";
    return;
  }

  button.disabled = true;

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password
    });

    if (error) throw error;

    message.textContent =
      "Password changed successfully. You can now log in.";

    form.reset();
    recoveryReady = false;
    button.textContent = "Password Updated";
  } catch (error) {
    message.textContent =
      error.message || "Could not update the password.";
  } finally {
    button.disabled = !recoveryReady;
  }
});

initializeRecovery();
