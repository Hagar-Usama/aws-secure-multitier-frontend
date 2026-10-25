const apiBaseUrl = window.NOTES_API_BASE_URL || "/api";
const noteForm = document.querySelector("#note-form");
const noteContent = document.querySelector("#note-content");
const characterCount = document.querySelector("#character-count");
const notesList = document.querySelector("#notes-list");
const statusMessage = document.querySelector("#status");
const submitButton = noteForm.querySelector("button[type='submit']");

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function noteUrl(noteId = "") {
  return `${apiBaseUrl}/notes${noteId ? `/${noteId}` : ""}`;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function renderNotes(notes) {
  notesList.replaceChildren();
  if (notes.length === 0) {
    setStatus("No notes yet. Add your first note.");
    return;
  }

  setStatus(`${notes.length} saved note${notes.length === 1 ? "" : "s"}.`);
  for (const note of notes) {
    const listItem = document.createElement("li");
    listItem.className = "note";
    const noteText = document.createElement("div");
    const content = document.createElement("p");
    content.textContent = note.content;
    const createdAt = document.createElement("time");
    createdAt.dateTime = note.created_at;
    createdAt.textContent = `Created ${formatTimestamp(note.created_at)}`;
    noteText.append(content, createdAt);
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteNote(note.id));
    listItem.append(noteText, deleteButton);
    notesList.append(listItem);
  }
}

async function readError(response) {
  const payload = await response.json().catch(() => ({}));
  return payload.detail || "The request could not be completed.";
}

async function loadNotes() {
  setStatus("Loading notes…");
  try {
    const response = await fetch(noteUrl());
    if (!response.ok) throw new Error(await readError(response));
    renderNotes(await response.json());
  } catch (error) {
    notesList.replaceChildren();
    setStatus(`Could not load notes: ${error.message}`, true);
  }
}

async function deleteNote(noteId) {
  try {
    const response = await fetch(noteUrl(noteId), { method: "DELETE" });
    if (!response.ok) throw new Error(await readError(response));
    await loadNotes();
  } catch (error) {
    setStatus(`Could not delete note: ${error.message}`, true);
  }
}

noteContent.addEventListener("input", () => {
  characterCount.textContent = `${noteContent.value.length} / 500`;
});

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = noteContent.value.trim();
  if (!content) {
    setStatus("Enter a note before saving.", true);
    return;
  }

  submitButton.disabled = true;
  try {
    const response = await fetch(noteUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error(await readError(response));
    noteForm.reset();
    characterCount.textContent = "0 / 500";
    await loadNotes();
  } catch (error) {
    setStatus(`Could not save note: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
  }
});

loadNotes();

