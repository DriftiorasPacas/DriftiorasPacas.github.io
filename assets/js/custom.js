"use strict";

/* LD11 – kontaktų forma, validacija ir rezultatų atvaizdavimas */
const form = document.getElementById("contact-form");
const submitButton = document.getElementById("submit-btn");
const result = document.getElementById("form-result");
const resultData = document.getElementById("result-data");
const averageText = document.getElementById("rating-average");
const fields = Array.from(form.querySelectorAll("input"));
const phone = document.getElementById("phone");
const touched = new Set();

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (
    digits.startsWith("370") &&
    (value.startsWith("+") || digits.length > 8)
  ) {
    digits = digits.slice(3);
  } else if (
    digits.length === 9 &&
    (digits.startsWith("8") || digits.startsWith("0"))
  ) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 8);
  if (!digits) return "";
  return (
    "+370 " +
    digits.slice(0, 3) +
    (digits.length > 3 ? " " + digits.slice(3) : "")
  );
}

function fieldError(field) {
  const value = field.value.trim();
  if (!value) return "Šis laukas privalomas.";
  if (field.id === "firstName" || field.id === "lastName") {
    if (!/^\p{L}+$/u.test(value)) return "Įveskite tik raides.";
  } else if (field.id === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || !field.validity.valid)
      return "Įveskite tinkamą el. pašto adresą.";
  } else if (field.id === "phone") {
    if (!/^\+370 6\d{2} \d{5}$/.test(value))
      return "Numeris turi atitikti +370 6xx xxxxx.";
  } else if (field.type === "number") {
    if (
      !Number.isInteger(Number(value)) ||
      Number(value) < 1 ||
      Number(value) > 10
    ) {
      return "Įveskite sveiką skaičių nuo 1 iki 10.";
    }
  }
  return "";
}

function validateForm() {
  let valid = true;
  fields.forEach((field) => {
    const error = fieldError(field);
    if (error) valid = false;
    const showError = touched.has(field.id) && Boolean(error);
    field.classList.toggle("invalid", showError);
    field.setAttribute("aria-invalid", String(showError));
    document.getElementById(field.id + "-error").textContent = showError
      ? error
      : "";
  });
  submitButton.disabled = !valid;
  return valid;
}

phone.addEventListener("keydown", (event) => {
  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !/\d/.test(event.key)
  ) {
    event.preventDefault();
  }
  // Backspace ištrina skaitmenį net tada, kai žymeklis yra po tarpo.
  if (
    event.key === "Backspace" &&
    phone.selectionStart === phone.selectionEnd &&
    phone.selectionStart > 5 &&
    phone.value[phone.selectionStart - 1] === " "
  ) {
    event.preventDefault();
    const pos = phone.selectionStart;
    phone.value = formatPhone(
      phone.value.slice(0, pos - 2) + phone.value.slice(pos),
    );
    phone.setSelectionRange(
      Math.min(pos - 1, phone.value.length),
      Math.min(pos - 1, phone.value.length),
    );
    touched.add(phone.id);
    validateForm();
  }
});

fields.forEach((field) => {
  field.addEventListener("input", () => {
    if (field === phone) field.value = formatPhone(field.value);
    touched.add(field.id);
    validateForm();
  });
  field.addEventListener("blur", () => {
    touched.add(field.id);
    validateForm();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  fields.forEach((field) => touched.add(field.id));
  if (!validateForm()) return;
  const data = {
    vardas: form.elements.firstName.value.trim(),
    pavarde: form.elements.lastName.value.trim(),
    elPastas: form.elements.email.value.trim(),
    telefonas: form.elements.phone.value,
    adresas: form.elements.address.value.trim(),
    dizainas: Number(form.elements.design.value),
    patogumas: Number(form.elements.usability.value),
    turinys: Number(form.elements.content.value),
  };
  console.log(data);
  const labels = {
    vardas: "Vardas",
    pavarde: "Pavardė",
    elPastas: "El. paštas",
    telefonas: "Tel. numeris",
    adresas: "Adresas",
    dizainas: "Dizainas",
    patogumas: "Patogumas",
    turinys: "Turinys",
  };
  resultData.replaceChildren();
  Object.entries(data).forEach(([key, value]) => {
    const line = document.createElement("p");
    line.textContent = labels[key] + ": " + value;
    resultData.append(line);
  });
  const average = (data.dizainas + data.patogumas + data.turinys) / 3;
  averageText.textContent =
    data.vardas + " " + data.pavarde + ": " + average.toFixed(2);
  result.hidden = false;
});

form.addEventListener("reset", () => {
  touched.clear();
  resultData.replaceChildren();
  averageText.textContent = "";
  result.hidden = true;
  // Reset įvykis įvyksta prieš išvalant laukus.
  setTimeout(validateForm, 0);
});

validateForm();

/* LD12 – įgūdžių masyvas, Kanban lenta, XP sistema ir pasiekimai */
const states = ["Planuojama", "Mokomasi", "Atlikta"];
const columns = ["planned-cards", "learning-cards", "completed-cards"];
const storageKey = "roko-cv-skills-v1";
const skills = [
  { name: "HTML", status: "Mokomasi", xp: 50 },
  { name: "CSS", status: "Mokomasi", xp: 50 },
  { name: "JavaScript", status: "Mokomasi", xp: 60 },
  { name: "Python", status: "Planuojama", xp: 55 },
  { name: "C++", status: "Planuojama", xp: 65 },
  { name: "MATLAB", status: "Atlikta", xp: 40 },
  { name: "SQL", status: "Planuojama", xp: 40 },
];

function loadSkills() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    skills.forEach((skill) => {
      if (saved && states.includes(saved[skill.name]))
        skill.status = saved[skill.name];
    });
  } catch (error) {
    console.warn("Įgūdžių duomenų nepavyko atkurti.", error);
  }
}

function saveSkills() {
  const saved = {};
  skills.forEach((skill) => {
    saved[skill.name] = skill.status;
  });
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch (error) {
    console.warn("Įgūdžių duomenų nepavyko išsaugoti.", error);
  }
}

function renderSkills() {
  columns.forEach((id) => document.getElementById(id).replaceChildren());
  skills.forEach((skill, index) => {
    const card = document.createElement("article");
    card.className = "skill-card";
    const title = document.createElement("h4");
    title.textContent = skill.name;
    const points = document.createElement("span");
    points.className = "xp-badge";
    points.textContent = skill.xp + " XP";
    const select = document.createElement("select");
    select.id = "skill-select-" + index;
    select.setAttribute("aria-label", skill.name + " būsena");
    states.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      select.append(option);
    });
    select.value = skill.status;
    select.addEventListener("change", () => {
      skill.status = select.value;
      saveSkills();
      renderSkills();
      updateProgress();
      document.getElementById("skill-select-" + index).focus();
    });
    card.append(title, points, select);
    document.getElementById(columns[states.indexOf(skill.status)]).append(card);
  });
}

function getLevel(xp) {
  if (xp >= 300)
    return { level: 4, rank: "Profesionalas", start: 300, end: 300 };
  else if (xp >= 150)
    return { level: 3, rank: "Specialistas", start: 150, end: 300 };
  else if (xp >= 50)
    return { level: 2, rank: "Praktikantas", start: 50, end: 150 };
  else return { level: 1, rank: "Pradedantysis", start: 0, end: 50 };
}

function updateAvatar(level) {
  const avatar = document.getElementById("level-avatar");
  if (level === 4) avatar.src = "assets/img/level-4.svg";
  else if (level === 3) avatar.src = "assets/img/level-3.svg";
  else if (level === 2) avatar.src = "assets/img/level-2.svg";
  else avatar.src = "assets/img/level-1.svg";
  avatar.alt = level + " lygio personažas";
}

function updateAchievements(completed, level) {
  const achievements = [
    {
      name: "Įgūdžių atradėjas",
      description: "Atlik bent 1 įgūdį.",
      icon: "bi-compass",
      unlocked: completed >= 1,
    },
    {
      name: "Įgūdžių meistras",
      description: "Atlik bent 4 įgūdžius.",
      icon: "bi-award",
      unlocked: completed >= 4,
    },
    {
      name: "Įgūdžių ekspertas",
      description: "Pasiek 4 lygį.",
      icon: "bi-trophy",
      unlocked: level === 4,
    },
  ];
  const container = document.getElementById("achievements");
  container.replaceChildren();
  achievements.forEach((item) => {
    const card = document.createElement("article");
    card.className = "achievement" + (item.unlocked ? " unlocked" : "");
    const icon = document.createElement("i");
    icon.className = "bi " + item.icon;
    icon.setAttribute("aria-hidden", "true");
    const title = document.createElement("h4");
    title.textContent = item.name;
    const description = document.createElement("p");
    description.textContent = item.description;
    const status = document.createElement("span");
    status.className = "achievement-state";
    status.textContent = item.unlocked ? "✓ Atrakintas" : "🔒 Neatrakintas";
    card.append(icon, title, description, status);
    container.append(card);
  });
}

function updateProgress() {
  const completed = skills.filter((skill) => skill.status === "Atlikta");
  const xp = completed.reduce((sum, skill) => sum + skill.xp, 0);
  const level = getLevel(xp);
  const progress =
    level.level === 4
      ? 100
      : ((xp - level.start) / (level.end - level.start)) * 100;
  document.getElementById("xp-total").textContent = xp + " XP";
  document.getElementById("level").textContent = level.level + " lygis";
  document.getElementById("rank").textContent = level.rank;
  document.getElementById("xp-fill").style.width = progress + "%";
  document
    .getElementById("xp-track")
    .setAttribute("aria-valuenow", String(Math.round(progress)));
  document.getElementById("xp-progress").textContent =
    level.level === 4
      ? "100% – pasiektas aukščiausias lygis!"
      : Math.round(progress) +
        "% iki kito lygio (" +
        xp +
        " / " +
        level.end +
        " XP)";
  document.getElementById("skill-count").textContent = skills.length;
  document.getElementById("done-count").textContent = completed.length;
  document.getElementById("done-percent").textContent =
    Math.round((completed.length / skills.length) * 100) + "%";
  updateAvatar(level.level);
  updateAchievements(completed.length, level.level);
}

loadSkills();
renderSkills();
updateProgress();
