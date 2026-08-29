async function protectTeacherPage() {

  const { data } = await supabaseTeacherDashboard.auth.getSession();

  if (!data.session) {
    window.location.href = "/index.html";
  }

}

protectTeacherPage();


const supabaseTeachers = window.supabaseClient;
const logFeedBack = document.getElementById("form-feedback");

async function logout() {
  const singOutBnt = document.getElementById('btn-yes-logout');
  singOutBnt.innerHTML = 'signing out..';
  await supabaseClient.auth.signOut();
  window.location.replace("/index.html"); // prevents back-button access
  logFeedBack.classList.add("show-message", "error");
  logFeedBack.innerHTML = "Logout successfully";
  setTimeout(()=>{
      logFeedBack.classList.remove("show-message", "error");
  }, 5000);
}


async function loadTeacherInfo() {

  const { data } = await supabaseClient.auth.getUser();

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .single();

  document.getElementById("teacher-name").textContent = profile.full_name;
}
