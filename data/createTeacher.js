if (!window.__teachersAdminModuleLoaded) {
  window.__teachersAdminModuleLoaded = true;

  const supabaseTeachersAdmin = window.supabaseClient;
  window.editingTeacherId = window.editingTeacherId || null;

  const teacherFeeds = document.getElementById("form-feedback");

  /* =====================================
     LOAD TEACHERS FOR ADMIN TABLE
  ===================================== */
  /* showLoading is off for realtime redraws: a live refresh should not
     blink "Loading teachers..." over a table the admin is reading */
  async function loadTeachersForAdminTable({ showLoading = true } = {}) {
    const tableBody = document.getElementById("teachers-table-body-show");
    if (!tableBody) return;

    if (showLoading) {
      tableBody.innerHTML = `<tr><td colspan="7">Loading teachers...</td></tr>`;
    }

    try {
      const { data, error } = await supabaseTeachersAdmin
        .from("teachers")
        .select(`
          id,
          surname,
          first_name,
          gender,
          qualification,
          role,
          status
        `)
        .order("surname", { ascending: true })
        .order("first_name", { ascending: true });

      if (error) throw error;

      /* administrator accounts are not staff records, so they stay out of
         this table - head teachers are staff and are listed */
      const teachers = (data || []).filter(
        (teacher) => !window.isAdminRole(teacher.role)
      );

      if (teachers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">No teachers found</td></tr>`;
        return;
      }

      /* a teacher shares its id with the auth user, so the blocked state
         lives on profiles.is_active - that is what login already checks */
      const { data: profiles } = await supabaseTeachersAdmin
        .from("profiles")
        .select("id, is_active")
        .in("id", teachers.map((teacher) => teacher.id));

      const blockedIds = new Set(
        (profiles || [])
          .filter((profile) => profile.is_active === false)
          .map((profile) => profile.id)
      );

      tableBody.innerHTML = "";

      teachers.forEach((teacher, index) => {
        const fullName =
          `${teacher.surname || ""} ${teacher.first_name || ""}`.trim() || "-";

        const isBlocked = blockedIds.has(teacher.id);

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${fullName}</td>
          <td>${teacher.gender || "-"}</td>
          <td>${teacher.qualification || "-"}</td>
          <td>${teacher.role || "-"}</td>
          <td>
            ${teacher.status || "-"}
            ${isBlocked ? `<span class="blocked-tag">Blocked</span>` : ""}
          </td>
          <td>
            <button
              type="button"
              class="view-btn action-btn"
              onclick="window.viewTeacher('${teacher.id}')"
            >
              <i class="fa-solid fa-eye"></i>
            </button>

            <button
              type="button"
              class="edit-btn action-btn"
              onclick="window.editTeacher('${teacher.id}')"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>

            <button
              type="button"
              class="${isBlocked ? "unblock-btn" : "block-btn"} action-btn"
              title="${isBlocked ? "Unblock staff" : "Block staff"}"
              onclick="window.toggleTeacherBlock('${teacher.id}', ${isBlocked ? "false" : "true"})"
            >
              <i class="fa-solid ${isBlocked ? "fa-unlock" : "fa-ban"}"></i>
            </button>

            <button
              type="button"
              class="delete-btn action-btn"
              onclick="window.deleteTeacher('${teacher.id}')"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading teachers:", err.message);
      tableBody.innerHTML = `<tr><td colspan="7">Error loading teachers</td></tr>`;
    }
  }

  /* =====================================
     VIEW TEACHER DETAILS
  ===================================== */
  async function viewTeacher(id) {
    const overlay = document.getElementById("teachers-details-overlay");
    if (!overlay || !id) return;

    try {
      const { data, error } = await supabaseTeachersAdmin
        .from("teachers")
        .select(`
          id,
          surname,
          first_name,
          dob,
          gender,
          employed_date,
          qualification,
          status,
          marital_status,
          phone,
          email,
          address,
          role,
          picture_url
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        // alert("Teacher not found");
        teacherFeeds.classList.add("show-message", "error");
        teacherFeeds.innerHTML = "Teacher not found";
        setTimeout(()=>{
          teacherFeeds.classList.remove("show-message", "error");
        }, 4000);
        return;
      }

      const fullName =
        `${data.surname || ""} ${data.first_name || ""}`.trim() || "-";

      const profileBox = document.querySelector(
        "#teachers-details-overlay .profile-box-img"
      );

      document.getElementById("detail-techer-full-name").textContent = fullName;
      document.getElementById("detail-role-teacher").textContent = data.role || "-";
      document.getElementById("detail-teacher-status").textContent = data.status || "-";

      document.getElementById("detail-fullname-teacher").textContent = fullName;
      document.getElementById("detail-dob-teacher").textContent = data.dob || "-";
      document.getElementById("detail-gender-teacher").textContent = data.gender || "-";
      document.getElementById("detail-employed-date").textContent = data.employed_date || "-";
      document.getElementById("detail-qualification-teacher").textContent = data.qualification || "-";
      document.getElementById("detail-status-teacher").textContent = data.status || "-";
      document.getElementById("detail-marital-status-teacher").textContent = data.marital_status || "-";

      document.getElementById("detail-teacher-phone").textContent = data.phone || "-";
      document.getElementById("detail-teacher-email").textContent = data.email || "-";
      document.getElementById("detail-address-teacher").textContent = data.address || "-";

      if (profileBox) {
        if (data.picture_url) {
          profileBox.innerHTML = `
            <img
              src="${data.picture_url}"
              alt="${fullName}"
              style="width:100%; height:100%; object-fit:cover; border-radius:50%;"
            >
          `;
        } else {
          profileBox.innerHTML = `
            <div style="
              width:100%;
              height:100%;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              background:#e5e7eb;
              font-weight:700;
              font-size:20px;
            ">
              ${fullName.charAt(0).toUpperCase()}
            </div>
          `;
        }
      }

      overlay.style.display = "flex";
    } catch (err) {
      console.error("Error loading teacher details:", err.message);
      // alert("Failed to load teacher details");
          teacherFeeds.classList.add("show-message", "error");
        teacherFeeds.innerHTML = "Failed to load teacher details";
        setTimeout(()=>{
          teacherFeeds.classList.remove("show-message", "error");
        }, 4000);
    }
  }

  /* =====================================
     CLOSE TEACHER DETAILS OVERLAY
  ===================================== */
  function closeOverlayTeacherDetails() {
    const overlay = document.getElementById("teachers-details-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  /* =====================================
     EDIT TEACHER
  ===================================== */
  async function editTeacher(id) {
    try {
      const { data, error } = await supabaseTeachersAdmin
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return;

      window.editingTeacherId = id;

      document.getElementById("teacher-surname").value = data.surname || "";
      document.getElementById("teacher-firstname").value = data.first_name || "";
      document.getElementById("datePicker-dob").value = data.dob || "";
      document.getElementById("teacher-gender").value = data.gender || "";
      document.getElementById("marital-status").value = data.marital_status || "";
      document.getElementById("Qualification").value = data.qualification || "";
      document.getElementById("teacher-Phone").value = data.phone || "";
      document.getElementById("teacher-Email").value = data.email || "";
      document.getElementById("teacher-Address").value = data.address || "";
      document.getElementById("role").value = data.role || "";
      document.getElementById("employed-date").value = data.employed_date || "";

      const statusRadio = document.querySelector(
        `[name="teacher-Active-Status"][value="${data.status}"]`
      );
      if (statusRadio) statusRadio.checked = true;

      const emailInput = document.getElementById("teacher-Email");
      if (emailInput) emailInput.disabled = true;

      const saveBtn = document.getElementById("addTeachersBtn");
      if (saveBtn) saveBtn.textContent = "Update Teacher";

      const overlay =
        document.getElementById("add-teacher");

      if (overlay) {
        overlay.classList.add("active");
        overlay.style.display = "flex";
      }
    } catch (err) {
      console.error("Edit error:", err.message);
      // alert("Failed to load teacher");
          teacherFeeds.classList.add("show-message", "error");
        teacherFeeds.innerHTML = "Failed to load teacher";
        setTimeout(()=>{
          teacherFeeds.classList.remove("show-message", "error");
        }, 4000);
    }
  }

  /* =====================================
     SAVE UPDATED TEACHER
  ===================================== */
  async function saveTeacher() {
    try {
      if (!window.editingTeacherId) {
        // alert("No teacher selected for update");
            teacherFeeds.classList.add("show-message", "error");
        teacherFeeds.innerHTML = "No teacher selected for update";
        setTimeout(()=>{
          teacherFeeds.classList.remove("show-message", "error");
        }, 4000);
        return;
      }

      const surname = document.getElementById("teacher-surname")?.value.trim() || "";
      const firstname = document.getElementById("teacher-firstname")?.value.trim() || "";
      const dob = document.getElementById("datePicker-dob")?.value || null;
      const gender = document.getElementById("teacher-gender")?.value || "";
      const marital = document.getElementById("marital-status")?.value || "";
      const qualification = document.getElementById("Qualification")?.value || "";
      const phone = document.getElementById("teacher-Phone")?.value.trim() || "";
      const address = document.getElementById("teacher-Address")?.value.trim() || "";
      const role = document.getElementById("role")?.value || "";
      const employedDate = document.getElementById("employed-date")?.value || null;

      const status =
        document.getElementById("teacher-Active-Status").value ||
        "";

      if (!surname || !firstname || !gender || !phone || !role) {
        // alert("Please fill all required fields");
        return;
      }

      const payload = {
        surname,
        first_name: firstname,
        dob: dob || null,
        gender,
        marital_status: marital,
        qualification,
        status,
        phone,
        address,
        role,
        employed_date: employedDate || null
      };

      const { error } = await supabaseTeachersAdmin
        .from("teachers")
        .update(payload)
        .eq("id", window.editingTeacherId);

      if (error) throw error;

      /* teachers.role is only a label; profiles.role is what the guards
         route on, and changing it is a permission change, so it is applied
         server side. The name syncs itself through a database trigger. */
      const { data: roleResult, error: roleError } =
        await supabaseTeachersAdmin.functions.invoke("set-staff-role", {
          body: { staffId: window.editingTeacherId, role }
        });

      if (roleError) throw await readFunctionError(roleError);

      if (roleResult?.warning) {
        console.warn(roleResult.warning);
      }

      // alert("✅ Teacher updated successfully");
          teacherFeeds.classList.add("show-message", "success");
        teacherFeeds.innerHTML = roleResult?.changed
          ? "Teacher updated - they must sign in again for the new role"
          : "Teacher updated successfully";
        setTimeout(()=>{
          teacherFeeds.classList.remove("show-message", "success");
        }, 4000);

      window.editingTeacherId = null;

      const saveBtn = document.getElementById("addTeachersBtn");
      if (saveBtn) saveBtn.textContent = "Add Teacher";

      const emailInput = document.getElementById("teacher-Email");
      if (emailInput) emailInput.disabled = false;

      document.getElementById("teacher-form")?.reset();

      const overlay =
        document.getElementById("add-teacher");

      if (overlay) {
        overlay.classList.remove("active");
        overlay.style.display = "none";
      }

      await loadTeachersForAdminTable({ showLoading: false });
    } catch (err) {
      console.error("Save error:", err.message);

      teacherFeeds.classList.add("show-message", "error");
      teacherFeeds.innerHTML = err.message || "Failed to update teacher";
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "error");
      }, 5000);
    }
  }

  /* =====================================
     BLOCK / UNBLOCK STAFF
  ===================================== */
  async function toggleTeacherBlock(id, block) {
    if (!id) return;

    const label = block ? "Block" : "Unblock";

    const proceed = await confirmAction({
      title: `${label} this staff member?`,
      message: block
        ? "They will not be able to sign in until you unblock them. Their records are kept."
        : "They will be able to sign in again.",
      confirmText: label,
      tone: block ? "warning" : "primary"
    });

    if (!proceed) return;

    try {
      /* is_active false is what protectPage() and redirectUser() reject, so
         the staff member can no longer sign in. The flip runs server side:
         a direct table update would be only as strong as the RLS policy on
         profiles, which typically lets a user edit their own row. */
      const { data, error } = await supabaseTeachersAdmin.functions.invoke(
        "set-staff-active",
        {
          body: { staffId: id, isActive: !block }
        }
      );

      if (error) throw await readFunctionError(error);

      if (data?.warning) {
        console.warn(data.warning);
      }

      teacherFeeds.classList.add("show-message", "success");
      teacherFeeds.innerHTML = block
        ? "Staff blocked successfully"
        : "Staff unblocked successfully";
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "success");
      }, 4000);

      await loadTeachersForAdminTable({ showLoading: false });
    } catch (err) {
      console.error("Block error:", err.message);
      teacherFeeds.classList.add("show-message", "error");
      teacherFeeds.innerHTML =
        err.message || `Failed to ${label.toLowerCase()} staff`;
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "error");
      }, 5000);
    }
  }

  /* =====================================
     DELETE TEACHER
  ===================================== */
  async function deleteTeacher(id) {
    const proceed = await confirmAction({
      title: "Delete this teacher permanently?",
      message:
        "To suspend someone who is still on staff, use the block button instead.",
      details: [
        "Their staff record is removed",
        "Their login is removed - they can no longer sign in",
        "Their class and subject assignments are removed",
        "Marks they have already entered are kept"
      ],
      confirmText: "Delete teacher",
      tone: "danger"
    });

    if (!proceed) return;

    try {
      /* Deleting only the teachers row leaves the login in auth.users and the
         row in profiles, so the person can still sign in and their email stays
         taken. Removing those needs the service role, hence the edge function. */
      const { error } = await supabaseTeachersAdmin.functions.invoke(
        "delete-staff-by-id",
        {
          body: { staffId: id }
        }
      );

      if (error) {
        let details = error.message;

        try {
          if (error.context) {
            const body = await error.context.json();
            details = body.error || body.message || details;
          }
        } catch (parseErr) {
          console.error("Could not parse function error body:", parseErr);
        }

        throw new Error(details);
      }

      teacherFeeds.classList.add("show-message", "success");
      teacherFeeds.innerHTML = "Teacher deleted successfully";
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "success");
      }, 4000);

      await loadTeachersForAdminTable({ showLoading: false });
    } catch (err) {
      console.error("Delete error:", err.message);

      teacherFeeds.classList.add("show-message", "error");
      teacherFeeds.innerHTML = err.message || "Failed to delete teacher";
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "error");
      }, 5000);
    }
  }

  /* =====================================
     CLEAN UP ORPHANED LOGINS

     One-off repair for staff removed by the old delete, which dropped the
     teachers row but left the profile and the auth login behind - so they
     stayed in the users list and could still sign in.
  ===================================== */
  async function cleanupOrphanedStaff() {
    try {
      /* first pass lists what would go; nothing is deleted yet */
      const { data: preview, error: previewError } =
        await supabaseTeachersAdmin.functions.invoke("cleanup-orphaned-staff", {
          body: { confirm: false }
        });

      if (previewError) throw await readFunctionError(previewError);

      const orphans = preview?.orphans || [];

      if (!orphans.length) {
        teacherFeeds.classList.add("show-message", "success");
        teacherFeeds.innerHTML = "No orphaned logins found";
        setTimeout(() => {
          teacherFeeds.classList.remove("show-message", "success");
        }, 4000);
        return;
      }

      /* one line per orphan: the dialog scrolls the list, so a long one
         no longer overflows the way the native confirm() did */
      const list = orphans.map(
        (o) =>
          `${o.full_name || "(no name)"} - ${o.email || "no email"} [${o.kind}]`
      );

      const proceed = await confirmAction({
        title: "Delete orphaned logins?",
        message: `${orphans.length} login(s) have no staff record. Deleting them is permanent.`,
        details: list,
        confirmText: `Delete ${orphans.length} login(s)`,
        tone: "danger"
      });

      if (!proceed) return;

      const { data: result, error: deleteError } =
        await supabaseTeachersAdmin.functions.invoke("cleanup-orphaned-staff", {
          body: { confirm: true }
        });

      if (deleteError) throw await readFunctionError(deleteError);

      const failures = result?.failures || [];

      if (failures.length) {
        console.error("Cleanup failures:", failures);
        teacherFeeds.classList.add("show-message", "error");
        teacherFeeds.innerHTML = `Removed ${result?.deleted || 0}, failed ${failures.length}`;
        setTimeout(() => {
          teacherFeeds.classList.remove("show-message", "error");
        }, 5000);
        return;
      }

      teacherFeeds.classList.add("show-message", "success");
      teacherFeeds.innerHTML = `Removed ${result?.deleted || 0} orphaned login(s)`;
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "success");
      }, 4000);
    } catch (err) {
      console.error("Cleanup error:", err.message);
      teacherFeeds.classList.add("show-message", "error");
      teacherFeeds.innerHTML = err.message || "Cleanup failed";
      setTimeout(() => {
        teacherFeeds.classList.remove("show-message", "error");
      }, 5000);
    }
  }

  /* edge functions put the real message in the response body, not error.message */
  async function readFunctionError(error) {
    let details = error.message;

    try {
      if (error.context) {
        const body = await error.context.json();
        details = body.error || body.message || details;
      }
    } catch (parseErr) {
      console.error("Could not parse function error body:", parseErr);
    }

    return new Error(details);
  }

  /* =====================================
     EXPOSE GLOBAL FUNCTIONS
  ===================================== */
  window.viewTeacher = viewTeacher;
  window.editTeacher = editTeacher;
  window.deleteTeacher = deleteTeacher;
  window.toggleTeacherBlock = toggleTeacherBlock;
  window.cleanupOrphanedStaff = cleanupOrphanedStaff;
  window.loadTeachersForAdminTable = loadTeachersForAdminTable;
  window.closeOverlayTeacherDetails = closeOverlayTeacherDetails;
  window.saveTeacher = saveTeacher;

  /* =====================================
     DOM READY
  ===================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    const detailsOverlay = document.getElementById("teachers-details-overlay");

    detailsOverlay?.addEventListener("click", (e) => {
      if (e.target === detailsOverlay) {
        closeOverlayTeacherDetails();
      }
    });

    const saveBtn = document.getElementById("addTeachersBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async (e) => {
        if (window.editingTeacherId) {
          e.preventDefault();
          await saveTeacher();
        }
      });
    }

    await loadTeachersForAdminTable();
    subscribeToTeacherChanges();
  });

  /* =====================================
     REALTIME
     Staff added, edited, blocked or deleted from any tab redraws this
     table without a page refresh. profiles is watched alongside teachers
     because the Blocked badge is read from profiles.is_active.
  ===================================== */
  function subscribeToTeacherChanges() {
    window.subscribeRealtime?.({
      name: "admin-teachers-live",
      tables: ["teachers", "profiles"],
      delay: 350,
      onChange: async () => {
        await loadTeachersForAdminTable({ showLoading: false });

        /* the dashboard staff count is drawn by teachersManagement.js */
        if (typeof window.loadTotalTeachers === "function") {
          await window.loadTotalTeachers();
        }
      }
    });
  }
}