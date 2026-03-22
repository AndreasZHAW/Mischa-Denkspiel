# 🏔️ Das Mischa Denkspiel

Ein Lernspiel für Kinder – eine Wanderung durch die Schweizer Berge!

## Projektstruktur

```
mischa-denkspiel/
├── index.html              # Willkommensseite + Charakterauswahl
├── game.html               # Hauptspiel-Shell (Welten & Aufgaben)
├── css/
│   ├── main.css            # Globale Styles, Schweizer Berg-Thema
│   └── game.css            # Spielspezifische Styles
├── js/
│   ├── app.js              # Navigation, Charakterauswahl, Login
│   ├── state.js            # Spielstand & localStorage
│   ├── worlds.js           # Welt-Konfiguration & Freischaltlogik
│   └── games/
│       ├── math.js         # Rechenspiel
│       ├── reaction.js     # Reaktionsspiel (Grün/Rot)
│       ├── train.js        # Zugweichen-Spiel
│       ├── memory.js       # Memory-Spiel
│       ├── search.js       # VfB-Logo Suchspiel
│       └── differences.js  # Unterschiede-finden Spiel
├── assets/
│   ├── characters/         # Charakter-Bilder (SVG)
│   └── worlds/             # Weltspezifische Bilder
└── worlds/
    ├── world1.json         # Welt 1: Wanderweg im Wald
    ├── world2.json         # Welt 2: Skilift
    ├── world3.json         # Welt 3: Restaurant
    ├── world4.json         # Welt 4: Schneeschuh
    └── world5.json         # Welt 5: Skifahren
```

## Auf GitHub Pages hosten

1. Repository erstellen auf GitHub
2. Alle Dateien hochladen
3. Settings → Pages → Branch: main → / (root)
4. Link teilen: `https://[dein-name].github.io/mischa-denkspiel/`

## Neue Spiele hinzufügen

Jede Welt wird in ihrer eigenen JSON-Datei konfiguriert.
Neue Spieltypen können als eigene `.js` Datei im `js/games/` Ordner ergänzt werden.
