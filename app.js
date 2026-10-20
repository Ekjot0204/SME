
"use strict";

const $ = id => document.getElementById(id);

function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Demo records are used only when no student data exists.
let students = read("studenthub_students", null);
let attendance = read("studenthub_attendance", null);

if (!Array.isArray(students)) {
  students = [
    { id: 1001, name: "Aarav Sharma", email: "aarav@example.com", phone: "9876543210", course: "B.Tech CSE", gender: "Male", dob: "2006-04-12", status: "Active" },
    { id: 1002, name: "Priya Verma", email: "priya@example.com", phone: "9876543211", course: "B.Tech CSE", gender: "Female", dob: "2005-11-23", status: "Active" },
    { id: 1003, name: "Rohan Singh", email: "rohan@example.com", phone: "9876543212", course: "B.Tech ECE", gender: "Male", dob: "2006-02-15", status: "Active" },
    { id: 1004, name: "Ananya Gupta", email: "ananya@example.com", phone: "9876543213", course: "BCA", gender: "Female", dob: "2005-08-08", status: "Active" },
    { id: 1005, name: "Kabir Mehta", email: "kabir@example.com", phone: "9876543214", course: "B.Sc CS", gender: "Male", dob: "2006-01-19", status: "Active" }
  ];

  write("studenthub_students", students);
}

if (!attendance || typeof attendance !== "object" || Array.isArray(attendance)) {
  attendance = {};
}

if (localStorage.getItem("studenthub_attendance") === null) {
  attendance[localDate()] = {
    "1001": "Present",
    "1002": "Present",
    "1003": "Absent",
    "1004": "Present"
  };
  attendance[localDate(-1)] = {
    "1001": "Present",
    "1002": "Absent",
    "1003": "Present",
    "1004": "Present",
    "1005": "Present"
  };
  attendance[localDate(-2)] = {
    "1001": "Present",
    "1002": "Present",
    "1003": "Present",
    "1004": "Absent",
    "1005": "Present"
  };
  write("studenthub_attendance", attendance);
}

let editingId = null;
let toastTimer;

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

function renderStudents() {
  const query = $("student-search").value.trim().toLowerCase();
  const date = $("attendance-date").value || localDate();
  const day = attendance[date] || {};

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.email.toLowerCase().includes(query) ||
    String(s.id).includes(query)
  );

  const present = students.filter(s => day[String(s.id)] === "Present").length;
  const marked = students.filter(s =>
    ["Present", "Absent"].includes(day[String(s.id)])
  ).length;

  $("total-students").textContent = students.length;
  $("active-students").textContent =
    students.filter(s => s.status === "Active").length;
  $("present-today").textContent = present;
  $("attendance-summary").textContent =
    `${present} present · ${marked} of ${students.length} marked`;

  $("student-list").innerHTML = filtered.length
    ? filtered.map(s => {
        const id = String(s.id);
        const current = day[id] || "";

        const records = Object.values(attendance)
          .map(d => d && d[id])
          .filter(v => v === "Present" || v === "Absent");

        const percentage = records.length
          ? Math.round(records.filter(v => v === "Present").length / records.length * 100)
          : null;

        return `
          <tr>
            <td>STU-${safe(id)}</td>
            <td><strong>${safe(s.name)}</strong><br><small>${safe(s.phone || "")}</small></td>
            <td>${safe(s.course)}</td>
            <td>${safe(s.email)}</td>
            <td><span class="status">${safe(s.status)}</span></td>
            <td>
              <select data-attendance="${safe(id)}" aria-label="Attendance for ${safe(s.name)}">
                <option value="" ${current === "" ? "selected" : ""}>Not marked</option>
                <option value="Present" ${current === "Present" ? "selected" : ""}>Present</option>
                <option value="Absent" ${current === "Absent" ? "selected" : ""}>Absent</option>
              </select>
              <small>${percentage === null ? "No records" : `${percentage}% attendance`}</small>
            </td>
            <td><button class="delete-btn" data-delete="${safe(id)}">Delete</button></td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="7" class="empty">No students found.</td></tr>`;
}

function openForm(student = null) {
  editingId = student ? student.id : null;
  $("student-form").reset();
  $("form-title").textContent = student ? "Edit student" : "Add new student";

  if (student) {
    $("student-name").value = student.name;
    $("student-email").value = student.email;
    $("student-phone").value = student.phone || "";
    $("student-course").value = student.course;
    $("student-gender").value = student.gender;
    $("student-dob").value = student.dob || "";
  }

  $("student-form").hidden = false;
  $("student-form").scrollIntoView({ behavior: "smooth", block: "start" });
  $("student-name").focus();
}

function closeForm() {
  $("student-form").hidden = true;
  $("student-form").reset();
  editingId = null;
}

$("add-student").addEventListener("click", () => openForm());
$("cancel-form").addEventListener("click", closeForm);
$("student-search").addEventListener("input", renderStudents);
$("attendance-date").value = localDate();
$("attendance-date").addEventListener("change", renderStudents);

$("student-form").addEventListener("submit", event => {
  event.preventDefault();

  const student = {
    id: editingId ?? Date.now(),
    name: $("student-name").value.trim(),
    email: $("student-email").value.trim(),
    phone: $("student-phone").value.trim(),
    course: $("student-course").value,
    gender: $("student-gender").value,
    dob: $("student-dob").value,
    status: "Active"
  };

  if (!student.name || !student.email || !student.course || !student.gender) {
    return toast("Please complete all required fields.");
  }

  const duplicate = students.some(s =>
    s.email.toLowerCase() === student.email.toLowerCase() &&
    s.id !== editingId
  );

  if (duplicate) return toast("This email is already registered.");

  if (editingId !== null) {
    students = students.map(s => s.id === editingId ? student : s);
  } else {
    students.push(student);
  }

  write("studenthub_students", students);
  closeForm();
  renderStudents();
  toast(editingId !== null ? "Student updated." : "Student added.");
});

$("student-list").addEventListener("change", event => {
  const select = event.target.closest("[data-attendance]");
  if (!select) return;

  const id = select.dataset.attendance;
  const date = $("attendance-date").value || localDate();

  if (!attendance[date]) attendance[date] = {};

  if (select.value) attendance[date][id] = select.value;
  else delete attendance[date][id];

  write("studenthub_attendance", attendance);
  renderStudents();
  toast("Attendance saved.");
});

$("student-list").addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;

  const id = deleteButton.dataset.delete;
  const student = students.find(s => String(s.id) === id);
  if (!student) return;

  const editButton = event.target.closest("[data-edit]");
  if (editButton) return openForm(student);

  if (!confirm(`Delete ${student.name} and their attendance records?`)) return;

  students = students.filter(s => String(s.id) !== id);

  Object.keys(attendance).forEach(date => {
    if (attendance[date]) delete attendance[date][id];
  });

  write("studenthub_students", students);
  write("studenthub_attendance", attendance);
  renderStudents();
  toast("Student deleted.");
});

renderStudents();
