const API_URL = "http://localhost/5notatek25/api.php"; // Twój endpoint API

const token = localStorage.getItem("token");


// ==================== 1. Pobieranie i wyświetlanie notatek ====================
async function loadNotes() {
    try {
        const res = await fetch(API_URL, {
            method: "GET", // albo POST, PUT, DELETE, PATCH
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            }
          });
          
        const notes = await res.json();

        const container = document.getElementById("accordionNotes");
        container.innerHTML = ""; // wyczyść

        notes.forEach((note, index) => {
            const item = document.createElement("div");
            item.classList.add("accordion-item");

            item.innerHTML = `
                <h2 class="accordion-header d-flex justify-content-between align-items-center" id="heading${note.id}">
                    <button class="accordion-button ${index === 0 ? "" : "collapsed"}"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse${note.id}">
                        Notatka ${note.id}
                    </button>
                </h2>
                <div id="collapse${note.id}"
                     class="accordion-collapse collapse ${index === 0 ? "show" : ""}"
                     data-bs-parent="#accordionNotes">
                    <div class="accordion-body">
                        <textarea data-id="${note.id}" class="form-control">${note.content}</textarea>
                        <div class="status mt-1" id="status-${note.id}"></div>
                </div>
            `;

            // Autozapis po zamknięciu notatki
            item.querySelector(`#collapse${note.id}`).addEventListener("hide.bs.collapse", async () => {
                const textarea = item.querySelector("textarea");
                const newContent = textarea.value;
                const statusDiv = document.getElementById(`status-${note.id}`);

                try {
                    statusDiv.innerText = "Zapisywanie...";

                    const res = await fetch(`${API_URL}?id=${note.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token  },
                        body: JSON.stringify({ content: newContent })
                    });

                    const result = await res.json();
                    if (res.ok) {
                        statusDiv.innerText = "✔ Zapisano";
                    } else {
                        statusDiv.innerText = "❌ Błąd: " + (result.error || "Nieznany");
                    }
                } catch (err) {
                    console.error("Błąd zapisu:", err);
                    statusDiv.innerText = "❌ Błąd sieci";
                }

                setTimeout(() => { statusDiv.innerText = ""; }, 2000);
            });

            container.appendChild(item);
        });

    } catch (err) {
        console.error("Błąd pobierania notatek:", err);
    }
}

// ==================== 2. Potwierdzenia modali ====================
const resetNotesBtn = document.getElementById("resetNotes");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const confirmResetModal = new bootstrap.Modal(document.getElementById('confirmResetModal'));

const clearNotesBtn = document.getElementById("clearNotes");
const confirmClearBtn = document.getElementById("confirmClearBtn");
const confirmClearModal = new bootstrap.Modal(document.getElementById('confirmClearModal'));

// ==================== 3. Reset notatek (usuń wszystkie) ====================
resetNotesBtn.addEventListener("click", () => {
    confirmResetModal.show();
});

confirmResetBtn.addEventListener("click", async () => {
    confirmResetModal.hide();

    try {
        const res = await fetch(API_URL, {headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token  }});
        const notes = await res.json();

        // usuń tylko notatki z id > 5
        for (const note of notes) {
            if (Number(note.id) > 5) {
                await fetch(`${API_URL}?id=${note.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token  },
                });
            }
        }

        await loadNotes();
        alert(" Usunięto notatki o ID > 5.");
    } catch (err) {
        console.error("Błąd:", err);
        alert("❌ Błąd sieci przy czyszczeniu notatek.");
    }
});


// ==================== 4. Czyszczenie zawartości notatek (puste, nie usuwa) ====================
clearNotesBtn.addEventListener("click", () => {
    confirmClearModal.show();
});

confirmClearBtn.addEventListener("click", async () => {
    confirmClearModal.hide();

    try {
        const res = await fetch(API_URL);
        const notes = await res.json();

        for (const note of notes) {
            await fetch(`${API_URL}?id=${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json",
                 "Authorization": "Bearer " + token}, 
                body: JSON.stringify({ content: "" })
            });

            const textarea = document.querySelector(`textarea[data-id='${note.id}']`);
            if (textarea) textarea.value = "";
        }

        alert("🧹 Zawartość notatek wyczyszczona.");
    } catch (err) {
        console.error("Błąd:", err);
        alert("❌ Błąd sieci przy czyszczeniu notatek.");
    }
});

// ==================== 5. Eksport notatek ====================
document.getElementById("exportAllNotes").addEventListener("click", () => {
    const textareas = document.querySelectorAll("#accordionNotes textarea");
    if (textareas.length === 0) {
        alert("Brak notatek do eksportu.");
        return;
    }

    const format = document.getElementById("exportFormat").value;
    let notes = [];
    let textContent = "";

    textareas.forEach((ta) => {
        const noteId = ta.getAttribute("data-id");
        const value = ta.value;

        notes.push({ id: noteId, content: value });
        textContent += `=== Notatka ${noteId} ===\n${value}\n\n`;
    });

    if (format === "txt") {
        const blobTxt = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        downloadBlob(blobTxt, "all_notes.txt");
    } else if (format === "json") {
        const blobJson = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
        downloadBlob(blobJson, "all_notes.json");
    } else if (format === "pdf") {
        exportToPDF(notes);
    }
});

// ==================== 6. Import notatek ====================
document.getElementById("importNotes").addEventListener("click", () => {
    const fileInput = document.getElementById("importFile");
    const format = document.getElementById("importFormat").value;

    if (!fileInput.files.length) {
        alert("Wybierz plik do importu.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const content = e.target.result;
        let notes = [];

        if (format === "txt") {
            const parts = content.split(/=== Notatka \d+ ===/).filter(p => p.trim() !== "");
            notes = parts.map((note, idx) => ({
                id: idx + 1,
                content: note.trim()
            }));
        } else if (format === "json") {
            try {
                notes = JSON.parse(content);
            } catch (err) {
                alert("Błąd podczas parsowania JSON.");
                return;
            }
        }

        // Zapis do backendu
        for (const n of notes) {
            await fetch(`${API_URL}?id=${n.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token  },
                body: JSON.stringify({ content: n.content })
            });
        }

        await loadNotes();
        alert("📥 Notatki zaimportowane.");
    };

    reader.readAsText(file);
});

// ==================== 7. Pomocnicze funkcje ====================
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Eksport PDF
function exportToPDF(notes) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;
    notes.forEach((note, index) => {
        doc.setFontSize(14);
        doc.text(`Notatka ${note.id}`, 10, y);
        y += 10;

        doc.setFontSize(12);
        let splitText = doc.splitTextToSize(note.content, 180);
        doc.text(splitText, 10, y);
        y += splitText.length * 7 + 10;

        if (y > 270 && index !== notes.length - 1) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save("all_notes.pdf");
}

async function login(username, password) {
    try {
        const res = await fetch("auth.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            alert("Zalogowano! Token zapisany w localStorage.");
            document.getElementById("loginMessage").textContent = "";

            // Odśwież stronę po zalogowaniu
            location.reload();

        } else {
            document.getElementById("loginMessage").textContent = data.error;
        }
    } catch (err) {
        document.getElementById("loginMessage").textContent = "Błąd połączenia z serwerem";
    }
}

function logout() {
    localStorage.removeItem("token");
    alert("Wylogowano! Token usunięty z localStorage.");

    // Odśwież stronę po wylogowaniu
    location.reload();
}

// Obsługa formularza logowania
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    login(username, password);
});

// Obsługa przycisku wylogowania
document.getElementById("logoutBtn").addEventListener("click", logout);

// ==================== 8. Start ====================
document.addEventListener("DOMContentLoaded", loadNotes);
 