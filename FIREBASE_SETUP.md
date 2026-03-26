# 🔥 Firebase Setup — Globaler Multiplayer

Damit alle Spieler weltweit in derselben Rangliste erscheinen,
braucht das Spiel eine kostenlose Firebase-Datenbank.

---

## Schritt 1: Firebase-Konto erstellen

1. Gehe auf https://firebase.google.com
2. Klicke "Kostenlos starten"
3. Melde dich mit deinem Google-Konto an

---

## Schritt 2: Neues Projekt erstellen

1. Klicke "Projekt hinzufügen"
2. Name: `mischa-denkspiel`
3. Google Analytics: kann deaktiviert werden
4. Klicke "Projekt erstellen"

---

## Schritt 3: Firestore-Datenbank erstellen

1. Im linken Menü: "Firestore Database"
2. Klicke "Datenbank erstellen"
3. Wähle "Im Testmodus starten" (für den Anfang)
4. Region: `europe-west3 (Frankfurt)` → Fertig

---

## Schritt 4: Web-App registrieren

1. Im Firebase-Projekt, klicke das `</>` Symbol (Web)
2. App-Name: `mischa-web`
3. **Kein** Firebase Hosting nötig
4. Klicke "App registrieren"
5. Du siehst jetzt einen Code-Block mit `firebaseConfig` — kopiere ihn!

Beispiel:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mischa-denkspiel.firebaseapp.com",
  projectId: "mischa-denkspiel",
  storageBucket: "mischa-denkspiel.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## Schritt 5: Config in das Spiel eintragen

Öffne `js/firebase-state.js` und ersetze die Zeilen oben:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",          // ← dein Wert
  authDomain:        "mischa-denkspiel.firebaseapp.com",
  projectId:         "mischa-denkspiel",
  storageBucket:     "mischa-denkspiel.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

---

## Schritt 6: Sicherheitsregeln (wichtig!)

In Firebase Console → Firestore → Regeln, ersetze mit:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

Klicke "Veröffentlichen".

---

## Fertig! 🎉

Nach dem Hochladen auf GitHub Pages sind alle Spieler
weltweit in derselben Datenbank und Rangliste.

---

## Ohne Firebase (Testmodus)

Das Spiel funktioniert auch ohne Firebase — dann werden
Spielstände nur lokal gespeichert (wie vorher).
