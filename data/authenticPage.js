const supabaseClient = window.supabaseClient;

/* =========================
   LOGIN FORM HANDLING
========================= */

const form = document.getElementById("login-form");

if (form) {
  form.addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("user_name")?.value.trim();
  const password = document.getElementById("user_password")?.value.trim();
  const error_Message = document.getElementById("error-show");
  const success_Message = document.getElementById("success-show");
  const btn_submit = document.getElementById("login-submit-btn");

  if (!email || !password) {
    error_Message.classList.add('show-message');
    error_Message.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Enter email and password';
    setTimeout(()=>{
       error_Message.classList.remove('show-message');
    }, 3000)
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
  email,
  password
});

if (error) {
  // alert(error.message);
      error_Message.classList.add('show-message');
    error_Message.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Invalid login credentials';
    setTimeout(()=>{
       error_Message.classList.remove('show-message');
    }, 3000)
    return;
}

//  GET USER + STORE ID
const { data: userData } = await supabaseClient.auth.getUser();

if (userData?.user) {
  localStorage.setItem("teacherId", userData.user.id);
}

btn_submit.innerHTML = 'Signing..';

success_Message.classList.add('show-message');
success_Message.innerHTML = '<i class="fa-solid fa-circle-check"></i> Login successfully!';

setTimeout(() => {
  success_Message.classList.remove('show-message');
}, 3000);

await redirectUser();

}


/* =========================
   ROLE REDIRECT
========================= */

async function redirectUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) return;

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role, is_active, must_change_password")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      await supabaseClient.auth.signOut();
      window.location.replace("/index.html");


      return;
    }

    /* an admin-set password is known to the admin, so it must be replaced
       before the account can be used */
    if (profile.must_change_password) {
      window.location.replace("/change-password.html");
      return;
    }

    switch (profile.role) {
      case "system_admin":
      case "admin":
        case "Administrator":
        window.location.replace("../admin_page/index.html");
        break;

      case "head_teacher":
        window.location.replace("../head_page/index.html");
        break;

      case "teacher":
        window.location.replace("../teacher_page/index.html");
        break;

      default:
        await supabaseClient.auth.signOut();
        window.location.replace("/index.html");
        break;
    }

  } catch (err) {
    console.error("Redirect error:", err);
  }
}


/* =========================
   PAGE PROTECTION
========================= */

async function protectPage(allowedRoles) {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) {
      window.location.replace("/index.html");
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role, is_active, must_change_password")
      .eq("id", data.user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active ||
      !allowedRoles.includes(profile.role)
    ) {
      await supabaseClient.auth.signOut();
      window.location.replace("/index.html");
      return;
    }

    /* the session is valid, but an admin knows this password - no portal
       until it has been replaced */
    if (profile.must_change_password) {
      window.location.replace("/change-password.html");
      return;
    }

  } catch (err) {
    console.error("Protection error:", err);
    window.location.replace("/index.html");
  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {
  const singOutBnt = document.getElementById('btn-yes-logout');
  singOutBnt.innerHTML = 'signing out..';
  await supabaseClient.auth.signOut();
  window.location.replace("/index.html"); // prevents back-button access
}




/* =========================
   AUTO REDIRECT (LOGIN PAGE ONLY)
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const isLoginPage = document.getElementById("login-form");

  if (!isLoginPage) return; // Only run on login page

  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) return;

    await redirectUser();

  } catch (err) {
    console.error("Auto-redirect error:", err);
  }
});