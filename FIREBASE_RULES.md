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


---

# 🔒 Sicherere Regeln (Stufe 1, v903) – optional, NICHT automatisch aktiv

**Ehrlich vorweg:** Das Spiel hat keine Firebase-Anmeldung. Darum kann keine Regel sicher
unterscheiden, ob jemand Admin ist oder nicht. Diese Stufe schützt aber vor dem Häufigsten:
fremde/zufällige Pfade und Sammlungen werden gesperrt (Müll, Fremdnutzung, Tippfehler-Bots).
Sie wurde aus dem Code abgeleitet, aber **nicht an echtem Firebase getestet**.

**So gehst du sicher vor:** Alte Regeln vorher kopieren und aufheben. Nach dem Veröffentlichen
Spiel öffnen (Chat, Zoo, Admin-Panel, Glücksrad). Geht etwas nicht mehr → alte Regeln wieder einfügen.

## Realtime Database (Regeln)
Das Spiel nutzt dort nur Pfade, die mit `zoo_` beginnen.

```json
{
  "rules": {
    "$top": {
      ".read": "$top.matches(/^zoo_/)",
      ".write": "$top.matches(/^zoo_/)"
    }
  }
}
```

## Firestore (Regeln)
Nur die Sammlungen, die das Spiel wirklich benutzt, bleiben offen.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{col}/{document=**} {
      allow read, write: if col in [
        'banned_devices','banned_players','calibration','calibration_overrides',
        'calibration_records','config','mischa_admin','mischa_players','player_bans',
        'player_device_fonts','player_messages','player_reports','reaction_times',
        'report_images','score_records','zoo_broadcast','zoo_chat','zoo_config',
        'zoo_events','zoo_news','zoo_polls','zoo_quests','zoo_reports','zoo_users',
        'zoo_voice_signal','zoos','zoo_players','zoo_instances','players'
      ];
    }
  }
}
```

## Was Stufe 2 bräuchte (später, grösserer Umbau)
Anonyme Firebase-Anmeldung im Spiel + Admin-Rechte über eine Admin-Liste in der Datenbank.
Erst dann kann man z. B. `zoo_admin_cmd`, Sperren und `zoo_config` nur für Admins schreibbar machen.
