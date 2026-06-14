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
- zoos (Gespeicherte Zoos)
- players (Denkspiel-Spielerdaten)
