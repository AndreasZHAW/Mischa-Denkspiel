========================================================================
  SDAA auf einem neuen Rechner starten
========================================================================

SCHNELLSTART (3 Schritte):

  1. Diesen ganzen Ordner auf den neuen Rechner kopieren.

  2. Doppelklick auf  "SDAA starten.bat"

  3. Beim allerersten Start installiert sich alles automatisch
     (dauert 2-5 Minuten). Danach startet SDAA von selbst.

Das war's. Du musst nichts manuell installieren.


------------------------------------------------------------------------
  Was passiert beim ersten Start?
------------------------------------------------------------------------

Das Startskript "SDAA starten.bat" macht automatisch:

  - Sucht ein passendes Python (3.10, 3.11, 3.12 oder 3.13)
  - Installiert alle benoetigten Pakete (PyYAML, PyQt6, astropy, ...)
  - Startet die Anwendung

Wenn KEIN Python gefunden wird, zeigt das Skript einen Link zum
Download. Wichtig bei der Python-Installation: das Haekchen
"Add Python to PATH" anklicken!


------------------------------------------------------------------------
  Wo sucht SDAA nach deinen Sonnenbildern?
------------------------------------------------------------------------

Beim ersten Start sucht SDAA automatisch nach typischen
Aufnahme-Ordnern, u.a.:

  - Dokumente\Imaging for the Life Sciences\SDAA\Calibration_Data_Sun
  - Dokumente\SharpCap Captures
  - Dokumente\N.I.N.A  /  NINA
  - Dokumente\FireCapture

Falls dein Ordner woanders liegt:
  In SDAA oben auf  "Setup"  ->  Tab "Paths"  ->  Watch-Folder waehlen.
  Die Einstellung wird gespeichert.


------------------------------------------------------------------------
  Einstellungen werden gespeichert
------------------------------------------------------------------------

Alle Einstellungen (Pfade, Kamera, Invert-Richtungen, Pfeil an/aus,
usw.) landen in:

  Dokumente\SDAA\sessions\sdaa_config.yaml

Diese Datei kannst du zwischen Rechnern kopieren, wenn du dieselben
Einstellungen willst. Aber Achtung: die Pfade darin sind dann die
des alten Rechners - am besten Pfade auf dem neuen Rechner neu in
Setup waehlen.


------------------------------------------------------------------------
  Aufraeumen (optional)
------------------------------------------------------------------------

Falls du im sdaa-Ordner einen seltsamen Ordner namens

  {config,core,ascom,gui}

siehst: der ist Muell von einem fehlerhaften Entpacken und kann
geloescht werden. Die echten Ordner config, core, ascom, gui sind
separat vorhanden.

========================================================================
