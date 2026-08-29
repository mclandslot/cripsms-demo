const supabaseClientStudentDataPerClassList = window.supabaseClient;

let teacherClasses = [];
let allStudents = [];
const classDataFeedBack = document.getElementById("form-feedback");


/* =====================================
   LOAD TEACHER ASSIGNED CLASSES
===================================== */
async function loadAssignedClasses() {

  const { data: userData } =
    await supabaseClientStudentDataPerClassList.auth.getUser();

  if (!userData?.user) {
    console.error("No logged in user");
    return;
  }

  const teacherId = userData.user.id;

  // ✅ USE NEW TABLE
  const { data: assignments, error } =
    await supabaseClientStudentDataPerClassList
      .from("teacher_subject_assignments")
      .select("class_id, classes(class_name)")
      .eq("teacher_id", teacherId);

  if (error) {
    console.error(error);
    return;
  }

  // extract unique classes
  const uniqueClassesMap = {};

  assignments.forEach(a => {
    if (a.class_id && a.classes?.class_name) {
      uniqueClassesMap[a.class_id] = a.classes.class_name;
    }
  });

  teacherClasses = Object.entries(uniqueClassesMap).map(([id, name]) => ({
    id,
    name
  }));

  const select =
    document.getElementById("select-student-classes-assigned");

  select.innerHTML = `<option value="">Select class</option>`;

  teacherClasses.forEach(cls => {
    const option = document.createElement("option");
    option.value = cls.id; // store class_id
    option.textContent = cls.name; // display class_name
    select.appendChild(option);
  });

}


/* =====================================
   LOAD ALL STUDENTS
===================================== */
async function loadAllStudents() {

  const { data, error } =
    await supabaseClientStudentDataPerClassList
      .from("students")
      .select(`
        id,
        surname,
        first_name,
        class_id,
        classes(class_name)
      `);

  if (error) {
    console.error(error);
    return;
  }

  allStudents = data || [];
}


/* =====================================
   BUTTON EVENT
===================================== */
document
  .getElementById("btn-show-student-list-for-class")
  ?.addEventListener("click", showStudentsForSelectedClass);


/* =====================================
   MAIN FUNCTION
===================================== */
function showStudentsForSelectedClass() {

  const selectedClassId =
    document.getElementById("select-student-classes-assigned").value;

  if (!selectedClassId) {
    // alert("Please select a class");
    classDataFeedBack.classList.add("show-message", "error");
    classDataFeedBack.innerHTML = "Select a class";
    setTimeout(()=>{
      classDataFeedBack.classList.remove("show-message", "error");
    }, 3000);
    return;
  }

  const wrapper =
    document.getElementById("student-names-wrapper");

  const listContainer =
    document.querySelector(".student-selected-container");

  wrapper.style.display = "block";

  // ✅ filter using class_id
  const filteredStudents = allStudents
    .filter(s => s.class_id === selectedClassId)
    .sort((a, b) => {

      const surnameA = (a.surname || "").toLowerCase();
      const surnameB = (b.surname || "").toLowerCase();

      if (surnameA !== surnameB) {
        return surnameA.localeCompare(surnameB);
      }

      return (a.first_name || "").toLowerCase()
        .localeCompare((b.first_name || "").toLowerCase());
    });

  // clear UI
  listContainer.innerHTML = "";

  const className =
    filteredStudents[0]?.classes?.class_name || "Class";

  if (filteredStudents.length === 0) {
    listContainer.innerHTML = `
      <div class="student-list-header">
        <h4>${className}</h4>
      </div>
      <p class="student-list-empty">No students found in this class.</p>
    `;
    return;
  }

  // header with class name + student count
  listContainer.innerHTML = `
    <div class="student-list-header">
      <h4>${className}</h4>
      <span class="student-count-badge">
        <i class="fa-solid fa-users"></i> ${filteredStudents.length} student${filteredStudents.length > 1 ? "s" : ""}
      </span>
    </div>
    <div class="student-name-grid"></div>
  `;

  const grid = listContainer.querySelector(".student-name-grid");

  // display students
  filteredStudents.forEach((student, index) => {

    const fullName =
      `${student.surname || ""} ${student.first_name || ""}`.trim();

    const initials =
      `${(student.surname || " ")[0]}${(student.first_name || " ")[0]}`
        .trim()
        .toUpperCase();

    const div = document.createElement("div");
    div.className = "student-name-item";

    div.innerHTML = `
      <span class="student-index">${index + 1}</span>
      <span class="student-avatar">${initials}</span>
      <span class="student-fullname">${fullName}</span>
    `;

    grid.appendChild(div);

  });

}



async function loadTeacherDashboardStats() {

  const { data: userData } =
    await supabaseClientStudentDataPerClassList.auth.getUser();

  if (!userData?.user) {
    console.error("No logged in user");
    return;
  }

  const teacherId = userData.user.id;

  try {

    const { data, error } = await supabaseClientStudentDataPerClassList
      .from("teacher_subject_assignments")
      .select(`
        class_id,
        subject,
        classes (class_name)
      `)
      .eq("teacher_id", teacherId);

    if (error) throw error;

    if (!data || data.length === 0) {
      document.getElementById("total-assigned-students").textContent = 0;
      document.getElementById("total-assigned-class").textContent = 0;
      document.getElementById("total-assigned-subjects").textContent = 0;
      return;
    }

    /* =========================
       TOTAL CLASSES (unique)
    ========================= */
    const uniqueClasses = new Set(data.map(item => item.class_id));
    const totalClasses = uniqueClasses.size;

    /* =========================
       TOTAL SUBJECTS (unique)
    ========================= */
    const uniqueSubjects = new Set(data.map(item => item.subject));
    const totalSubjects = uniqueSubjects.size;

    /* =========================
       TOTAL STUDENTS
       (count students in assigned classes)
    ========================= */

    const classIds = [...uniqueClasses];

    const { count, error: studentError } = await supabaseClientStudentDataPerClassList
      .from("students")
      .select("*", { count: "exact", head: true })
      .in("class_id", classIds);

    if (studentError) throw studentError;

    const totalStudents = count || 0;

    /* =========================
       UPDATE UI
    ========================= */
    document.getElementById("total-assigned-students").textContent = totalStudents;
    document.getElementById("total-assigned-class").textContent = totalClasses;
    document.getElementById("total-assigned-subjects").textContent = totalSubjects;

  } catch (err) {
    console.error("Dashboard error:", err.message);
  }
}


// show the assigned class and subjects
// Make sure Supabase client is defined

/* =========================================
   LOAD TEACHER ASSIGNED CLASSES AND SUBJECTS
========================================= */
async function loadTeacherAssignmentsDashboard() {

  const { data: userData } = await supabaseClientStudentDataPerClassList.auth.getUser();
  if (!userData?.user) return console.error("No logged in user");

  const teacherId = userData.user.id;

  try {
    // 1️⃣ Get assigned classes and subjects for this teacher
    const { data: assignments, error } = await supabaseClientStudentDataPerClassList
      .from("teacher_subject_assignments")
      .select(`
        class_id,
        subject,
        classes(class_name)
      `)
      .eq("teacher_id", teacherId);

    if (error) throw error;

    if (!assignments || assignments.length === 0) {
      console.log("No assignments found");
      return;
    }

    // 2️⃣ Prepare unique classes and subjects
    const classMap = {};   // class_id => class_name
    const subjectMap = {}; // subject => {class_id_list}

    assignments.forEach(a => {
      if (a.class_id && a.classes?.class_name) {
        classMap[a.class_id] = a.classes.class_name;
      }
      if (a.subject) {
        if (!subjectMap[a.subject]) subjectMap[a.subject] = new Set();
        subjectMap[a.subject].add(a.class_id);
      }
    });

    // 3️⃣ Build Class Cards
    const classContainer = document.querySelector(".assigned-container .assign-card-flex");
    classContainer.innerHTML = "";

    for (const [classId, className] of Object.entries(classMap)) {

      // Count students in this class
      const { count: studentCount } = await supabaseClientStudentDataPerClassList
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);

      const div = document.createElement("div");
      div.className = "assign-card";

      div.innerHTML = `
        <h4 class="assigned-name-here">${className}</h4>
        <p class="bold-p-assign"><i class="fa-solid fa-users"></i> ${studentCount || 0} Students</p>
      `;

      classContainer.appendChild(div);
    }

    // 4️⃣ Build Subject Cards
    const subjectContainer = document.querySelectorAll(".assigned-container")[1].querySelector(".assign-card-flex");
    subjectContainer.innerHTML = "";

    for (const [subject, classIdsSet] of Object.entries(subjectMap)) {

      // Count total students across all classes for this subject
      const classIds = [...classIdsSet];
      const { count: studentCount } = await supabaseClientStudentDataPerClassList
        .from("students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds);

      const div = document.createElement("div");
      div.className = "assign-card";

      div.innerHTML = `
        <h4>${subject}</h4>
        <p class="bold-p-assign"><i class="fa-solid fa-users"></i> ${studentCount || 0} Students</p>
      `;

      subjectContainer.appendChild(div);
    }

  } catch (err) {
    console.error("Error loading assignments dashboard:", err.message);
  }
}


/* =========================================
   INIT
========================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadTeacherAssignmentsDashboard();
});


/* =====================================
   INIT
===================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadAssignedClasses();
  await loadAllStudents();
   loadTeacherDashboardStats();
   loadTeacherAssignmentsDashboard();
});