/* =========================
   TEACHER PAGE GUARD

   Self-contained on purpose: the teacher portal does not load
   data/authenticPage.js, and pulling it in would collide with the
   globals the other teacher scripts already declare.
========================= */

(async function protectTeacherPortal() {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client not initialized");
    return;
  }

  async function guard() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        window.location.replace("../index.html");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, must_change_password")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        window.location.replace("../index.html");
        return;
      }

      /* blocked from the admin Manage Teachers screen */
      if (!profile.is_active) {
        await supabase.auth.signOut();
        window.location.replace("../index.html");
        return;
      }

      /* an admin-set password is known to the admin, so it must be
         replaced before the portal opens */
      if (profile.must_change_password) {
        window.location.replace("../change-password.html");
        return;
      }

      if (profile.role !== "teacher") {
        await supabase.auth.signOut();
        window.location.replace("../index.html");
      }
    } catch (err) {
      console.error("Teacher guard error:", err);
      window.location.replace("../index.html");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guard);
  } else {
    await guard();
  }
})();
