# Firestore Rules für Multiplayer

## Problem
Firebase zeigt "permission-denied" → Multiplayer funktioniert nicht.

## Fix (einmalig in Firebase Console)

1. Gehe zu: https://console.firebase.google.com
2. Wähle Projekt: mischa-denkspiel
3. Klicke: Firestore Database → Rules
4. Ersetze alles mit:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Klicke "Publish"

## Collections die freigegeben werden müssen
- zoo_players (Spielerpositionen)
- zoo_events (Tier-Käufe für alle sichtbar)
- zoo_broadcast (Admin-Events wie Glücksrad-Wechsel)
- zoo_instances (Zoo-Instanzen mit bis zu 20 Spieler-Slots — dynamisch erstellt)
- zoo_news (Live-Neuigkeiten-Banner)
- zoos (Gespeicherte Zoos)
- players (Denkspiel-Spielerdaten)
- zoo_quests (NEU: Deko-Quests, vom Admin erstellt — Firestore-Collection)
- zoo_battles (NEU: Battle-System, Herausforderungen/Lobbys — Firestore-Collection)

---

# Realtime Database Rules (separat von Firestore oben!)

## Problem
`permission_denied at /zoo_device_diag` — die Diagnose-Seite zeigt "(keine Geräte-Snapshots)",
obwohl Geräte längst versuchen, dorthin zu schreiben (siehe Crash-Log: `FIREBASE WARNING: set at
/zoo_device_diag/... failed: permission_denied`). Das ist eine ANDERE Firebase-Rules-Seite als
oben — Realtime Database hat eigene Regeln, getrennt von Firestore.

## Fix (einmalig in Firebase Console)

1. Gehe zu: https://console.firebase.google.com
2. Wähle Projekt: mischa-denkspiel
3. Klicke: Realtime Database → Regeln (Rules) — NICHT "Firestore Database"!
4. Ersetze alles mit:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

5. Klicke "Veröffentlichen" (Publish)

Das gibt allen bestehenden Pfaden (zoo_hot, zoo_broadcast, zoo_admin_cmd, zoo_device_diag, usw.)
und jedem zukünftigen Pfad automatisch Zugriff — kein erneuter Rules-Fix nötig, wenn später mal
ein neuer Pfad dazukommt.
