# 🚀 GitHub Pages Deployment — Schritt für Schritt

## Was du brauchst
- Ein kostenloses GitHub-Konto (github.com)
- Diese Projektdateien

---

## Schritt 1: GitHub Konto

1. Gehe auf https://github.com
2. Klicke auf "Sign up"
3. Erstelle ein kostenloses Konto

---

## Schritt 2: Repository erstellen

1. Nach dem Login, klicke oben rechts auf das **+** Symbol
2. Wähle "New repository"
3. Name: `mischa-denkspiel`
4. Stelle sicher: **Public** ist ausgewählt
5. Klicke "Create repository"

---

## Schritt 3: Dateien hochladen

**Option A: Einfach per Web-Browser (empfohlen für Anfänger)**

1. Im neuen Repository, klicke "uploading an existing file"
2. Ziehe ALLE Dateien und Ordner in das Upload-Fenster:
   - `index.html`
   - Ordner `css/` (mit main.css und game.css)
   - Ordner `js/` (mit app.js, state.js, worlds.js, und Unterordner `games/`)
3. Klicke "Commit changes"

**Option B: Mit Git (für Fortgeschrittene)**
```bash
git init
git add .
git commit -m "Mischa Denkspiel - erstes Upload"
git remote add origin https://github.com/DEIN-NAME/mischa-denkspiel.git
git push -u origin main
```

---

## Schritt 4: GitHub Pages aktivieren

1. Im Repository, klicke auf **Settings** (oben in der Tab-Leiste)
2. Links im Menü: scrolle zu **Pages**
3. Unter "Source": wähle **"Deploy from a branch"**
4. Branch: **main**, Ordner: **/ (root)**
5. Klicke **Save**

---

## Schritt 5: Link teilen!

Nach 1-2 Minuten ist dein Spiel online unter:
```
https://DEIN-GITHUB-NAME.github.io/mischa-denkspiel/
```

Diesen Link kannst du per WhatsApp, Email etc. teilen!

---

## Neue Aufgaben/Welten hinzufügen

### Neue Aufgaben in einer Welt anpassen:
Bearbeite `js/worlds.js` → finde die gewünschte Welt → ändere die `tasks` oder `memoryEmojis`

### Neue Memory-Emojis für eine Welt:
```javascript
memoryEmojis: ['⛷️','🏔️','❄️','🎿','🧤','🌨️','🦌','⛄','🏔️','🎯'],
```

### Neue Zugspiel-Fragen:
Bearbeite `js/games/train.js` → finde das `puzzles` Array

---

## Spielstand

Alle Spielstände werden im Browser (localStorage) gespeichert.
Das bedeutet: Jeder Spieler braucht seinen eigenen Browser/Gerät.
Der Fortschritt bleibt erhalten auch wenn der Browser geschlossen wird!

---

## Hilfe

Bei Fragen wende dich an den Entwickler oder schreibe ein Issue auf GitHub.
