const supabaseHeadTeacherDashboard = window.supabaseClient;
// const supabaseHeadTeacherlogs = window.supabaseClient;

const logMessage = document.getElementById("form-feedback");

/* =====================================
   PROTECT HEAD TEACHER PAGE
===================================== */
async function protectTeacherPage() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseHeadTeacherDashboard.auth.getSession();

    if (sessionError || !session) {
      window.location.replace("../index.html");
      return;
    }

    const user = session.user;

    if (!user) {
      window.location.replace("../index.html");
      return;
    }

    const { data: profile, error: profileError } =
      await supabaseHeadTeacherDashboard
        .from("profiles")
        .select("id, full_name, role, is_active, must_change_password")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      await supabaseHeadTeacherDashboard.auth.signOut();
      window.location.replace("../index.html");
      return;
    }

    /*  BLOCKED USER */
    if (!profile.is_active) {
      alert("Your account has been blocked. Contact administrator.");

      await supabaseHeadTeacherDashboard.auth.signOut();

      window.location.replace("../index.html");
      return;
    }

    /*  ADMIN-SET PASSWORD MUST BE REPLACED FIRST */
    if (profile.must_change_password) {
      window.location.replace("../change-password.html");
      return;
    }

    /*  ROLE PROTECTION */
    if (profile.role !== "head_teacher") {
      alert("Access denied.");

      await supabaseHeadTeacherDashboard.auth.signOut();

      window.location.replace("../index.html");
      return;
    }

    /*  LOAD USER INFO */
    const nameEl = document.getElementById("head-teacher-name");

    if (nameEl) {
      nameEl.textContent = profile.full_name || "Head Teacher";
    }

  } catch (err) {
    console.error("Protect page error:", err.message);

    await supabaseHeadTeacherDashboard.auth.signOut();

    window.location.replace("../index.html");
  }
}

/* =====================================
   LOGOUT
===================================== */
// async function logout() {
//   try {
//     const signOutBtn = document.getElementById("btn-yes-logout");

//     if (signOutBtn) {
//       signOutBtn.innerHTML = "Signing out...";
//       signOutBtn.disabled = true;
//     }

//     logMessage.classList.add("show-message", "success");
//     logMessage.innerHTML = "Logout successfully";
//     setTimeout(()=>{
//       logMessage.classList.remove("show-message", "success");
//     })


//     await supabaseHeadTeacherlogs.auth.signOut();

//     window.location.replace("../index.html");

//   } catch (err) {
//     console.error("Logout error:", err.message);
//   }
// }

/* =====================================
   LOAD HEAD TEACHER INFO
===================================== */
// async function loadTeacherInfo() {
//   try {
//     const {
//       data: { user }
//     } = await supabaseHeadTeacherlogs.auth.getUser();

//     if (!user) return;

//     const { data: profile, error } =
//       await supabaseHeadTeacherlogs
//         .from("profiles")
//         .select("full_name, email")
//         .eq("id", user.id)
//         .single();

//     if (error || !profile) return;

//     const nameEl = document.getElementById("head-teacher-name");

//     if (nameEl) {
//       nameEl.textContent = profile.full_name || "Head Teacher";
//     }

//   } catch (err) {
//     console.error("Load teacher info error:", err.message);
//   }
// }

/* =====================================
   INIT
===================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await protectTeacherPage();
  // await loadTeacherInfo();
});