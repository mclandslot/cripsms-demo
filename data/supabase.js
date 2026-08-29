

// const { createClient } = supabase;

// window.supabaseClient = createClient(
//   "https://yvmuqqfdtkzyyeyesrlk.supabase.co",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bXVxcWZkdGt6eXlleWVzcmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTY5MjcsImV4cCI6MjA4NzU5MjkyN30.4JZqH_KzrsTtaP35aL0fW_wtvJl9-DlC84NzcQhtJto"
// );


const supabaseUrl = "https://yvmuqqfdtkzyyeyesrlk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bXVxcWZkdGt6eXlleWVzcmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTY5MjcsImV4cCI6MjA4NzU5MjkyN30.4JZqH_KzrsTtaP35aL0fW_wtvJl9-DlC84NzcQhtJto";

window.supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
);

console.log("Supabase client initialized:", window.supabaseClient);

/* Shared role tests. teachers.role holds the raw value typed into the Add
   Teacher form ("Administrator", "Head Teacher") while profiles.role holds
   the mapped one ("admin", "head_teacher"), so both spellings must match. */
function normalizeRoleValue(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/* administrators are not staff records: hidden from the teachers table */
window.isAdminRole = function (role) {
  const value = normalizeRoleValue(role);

  return (
    value === "admin" ||
    value === "administrator" ||
    value === "system_admin"
  );
};

/* head teachers are listed as staff, but like admins they do not take a
   class or a subject, so they are not offered for assignment */
window.isNonTeachingRole = function (role) {
  const value = normalizeRoleValue(role);

  return (
    window.isAdminRole(role) ||
    value === "head_teacher" ||
    value === "headteacher"
  );
};


















// const SUPABASE_URL = "https://yvmuqqfdtkzyyeyesrlk.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bXVxcWZkdGt6eXlleWVzcmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTY5MjcsImV4cCI6MjA4NzU5MjkyN30.4JZqH_KzrsTtaP35aL0fW_wtvJl9-DlC84NzcQhtJto";

// window.supabaseClient = supabase.createClient(
//   SUPABASE_URL,
//   SUPABASE_ANON_KEY
// );


// CRIGPSIS2026

