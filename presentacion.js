
"use strict";

const presenters = ["Jharod Acevedo", "Anthony Cabrera", "Ronaldo Huaman", "Johnny Tipismana", "Manuel Jara"];
const slides = [...document.querySelectorAll(".slide")];
const partLinks = [...document.querySelectorAll("[data-part-link]")];
const next = document.querySelector("#next");
const previous = document.querySelector("#previous");
const notesDialog = document.querySelector("#notes-dialog");
const tableDialog = document.querySelector("#table-dialog");
const sourceDialog = document.querySelector("#source-dialog");
const fullScreen = document.querySelector("#fullscreen");
let cursor = 0;
let focusStep = 0;

function partOf(slide) {
  return Number(slide.dataset.part);
}

function presenterOf(slide) {
  return presenters[partOf(slide) - 1];
}

function render() {
  const slide = slides[cursor];
  const upcoming = slides[cursor + 1];
  const stepCount = Number(slide.dataset.steps);
  const part = partOf(slide);
  slides.forEach((item, index) => { item.hidden = index !== cursor; });
  partLinks.forEach((button) => {
    if (Number(button.dataset.partLink) === part) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  slide.querySelectorAll("[data-focus]").forEach((row) => {
    row.classList.toggle("is-focused", Number(row.dataset.focus) === focusStep);
  });
  const stepText = slide.querySelector(".step-text");
  if (stepText) {
    const note = slide.querySelector(".steps").content.children[focusStep - 1];
    stepText.textContent = note?.textContent ?? "";
    stepText.hidden = !note;
  }
  document.querySelector("#presenter").textContent = "Expone " + presenterOf(slide);
  document.querySelector("#count").textContent = (cursor + 1) + " / " + slides.length;
  previous.disabled = cursor === 0 && focusStep === 0;
  next.disabled = !upcoming && focusStep >= stepCount;
  if (focusStep < stepCount) {
    next.textContent = slide.querySelector(".steps").content.children[focusStep].dataset.action;
  } else if (!upcoming) {
    next.textContent = "Fin de la exposición";
  } else if (partOf(upcoming) !== part) {
    next.textContent = "Dar pase a " + presenterOf(upcoming).split(" ")[0];
  } else {
    next.textContent = "Siguiente";
  }
}

function goTo(index, step = 0, focus = true) {
  cursor = Math.max(0, Math.min(index, slides.length - 1));
  focusStep = Math.min(step, Number(slides[cursor].dataset.steps));
  const slide = slides[cursor];
  if (location.hash !== "#" + slide.id) {
    history.replaceState(null, "", "#" + slide.id);
  }
  render();
  if (focus) {
    slide.querySelector("h2").focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
}

function move(direction) {
  const step = focusStep + direction;
  if (step >= 0 && step <= Number(slides[cursor].dataset.steps)) {
    focusStep = step;
    render();
    return;
  }
  const index = cursor + direction;
  if (slides[index]) {
    goTo(index, direction < 0 ? Number(slides[index].dataset.steps) : 0);
  }
}

function readHash() {
  const index = slides.findIndex((slide) => "#" + slide.id === location.hash);
  goTo(Math.max(index, 0), 0, false);
}

function showNotes() {
  document.querySelector("#notes-who").textContent = presenterOf(slides[cursor]);
  const speech = slides[cursor].querySelector(".notes").content.cloneNode(true);
  speech.querySelector('[data-speech-step="' + focusStep + '"]').setAttribute("aria-current", "step");
  document.querySelector("#notes-body").replaceChildren(speech);
  notesDialog.showModal();
}

function showTable() {
  const template = slides[cursor].querySelector(".detail-table");
  if (!template) return;
  document.querySelector("#detail-body").replaceChildren(template.content.cloneNode(true));
  tableDialog.showModal();
}

async function changeFullscreen() {
  if (!document.fullscreenEnabled) return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    fullScreen.textContent = "Pantalla completa no disponible";
  }
}

slides.forEach((slide) => {
  const name = document.createElement("span");
  name.className = "slide-speaker";
  name.textContent = presenterOf(slide);
  slide.querySelector(".slide-label").append(name);
  if (Number(slide.dataset.steps) > 0) {
    const summary = document.createElement("p");
    summary.className = "step-text";
    summary.hidden = true;
    summary.setAttribute("role", "status");
    slide.querySelector(".slide-meta").before(summary);
  }
});
document.querySelectorAll("[data-speaker]").forEach((label) => {
  label.textContent = presenters[Number(label.dataset.speaker) - 1];
});
document.querySelectorAll("[data-part-link], [data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const part = Number(button.dataset.partLink ?? button.dataset.jump);
    goTo(slides.findIndex((slide) => partOf(slide) === part));
  });
});
document.querySelectorAll("[data-open-table]").forEach((button) => button.addEventListener("click", showTable));
document.querySelectorAll("[data-open-sources]").forEach((button) => button.addEventListener("click", () => sourceDialog.showModal()));
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
document.querySelector("#home").addEventListener("click", () => goTo(0));
document.querySelector("#begin").addEventListener("click", () => goTo(1));
document.querySelector("#notes-open").addEventListener("click", showNotes);
next.addEventListener("click", () => move(1));
previous.addEventListener("click", () => move(-1));
fullScreen.hidden = !document.fullscreenEnabled;
fullScreen.addEventListener("click", changeFullscreen);
document.addEventListener("fullscreenchange", () => {
  fullScreen.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
});
window.addEventListener("hashchange", readHash);
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector("dialog[open]")) return;
  const key = event.key.toLowerCase();
  if (key === " " && event.target instanceof Element && event.target.closest("button, a")) return;
  switch (key) {
    case "arrowright":
    case "pagedown":
    case " ":
      event.preventDefault();
      move(1);
      break;
    case "arrowleft":
    case "pageup":
      event.preventDefault();
      move(-1);
      break;
    case "home":
      event.preventDefault();
      goTo(0);
      break;
    case "end":
      event.preventDefault();
      goTo(slides.length - 1);
      break;
    case "n":
      showNotes();
      break;
    case "t":
      showTable();
      break;
    case "f":
      changeFullscreen();
      break;
  }
});
readHash();