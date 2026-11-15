// Spielregeln (Startseite Denkspiel)
window.RULES_LIST=[
    {n:1,ic:'🔁',t:'Kein Tier-Trick beim Rebirth',d:'Tiere nicht kurz in den Tausch legen, um sie nach dem Rebirth zurückzuholen.'},
    {n:2,ic:'🤬',t:'Respekt im Chat',d:'Keine Beleidigungen, Schimpfwörter oder Mobbing.'},
    {n:3,ic:'📢',t:'Kein Spam',d:'Nicht dieselbe Nachricht immer wieder schicken und nicht nur GROSS schreiben.'},
    {n:4,ic:'🔗',t:'Keine Werbung oder Links',d:'Keine Links zu fremden Seiten und keine Werbung im Chat.'},
    {n:5,ic:'🔑',t:'Passwörter bleiben geheim',d:'Gib dein Passwort nie weiter, auch nicht an Freunde. Frage auch nie nach dem Passwort von anderen.'},
    {n:7,ic:'🐛',t:'Fehler nicht ausnutzen',d:'Wenn du einen Fehler (Bug) findest, melde ihn mit dem 🛠️-Knopf, statt ihn auszunutzen.'},
    {n:8,ic:'🚫',t:'Keine Cheats',d:'Keine Skripte, Auto-Klicker oder andere Tricks, die das Spiel verändern.'},
    {n:10,ic:'🏷️',t:'Anständige Namen',d:'Dein Name darf niemanden beleidigen und keine echte Person oder einen Admin nachahmen.'},
    {n:14,ic:'👑',t:'Respekt vor Admins',d:'Entscheidungen der Admins werden respektiert.'},
    {n:15,ic:'🚩',t:'Nur echte Meldungen',d:'Melde nur echte Probleme. Falsche Meldungen sind nicht erlaubt.'},
    {n:17,ic:'🖼️',t:'Anständige Bilder',d:'Im Chat nur Bilder und Screenshots, die niemandem schaden und für alle passen.'},
    {n:18,ic:'💶',t:'Kein Handel mit echtem Geld',d:'Spielgeld, Tiere oder Konten dürfen nicht gegen echtes Geld verkauft oder gekauft werden.'},
    {n:19,ic:'🏆',t:'Fair spielen',d:'Arena, Ranglisten und Wettbewerbe fair spielen, ohne Absprachen oder Tricks.'},
    {n:20,ic:'🆕',t:'Strafen nicht umgehen',d:'Wer gesperrt ist, darf keine neuen Konten anlegen, um weiterzuspielen.'}
  ];
window.rulesStartHTML=function(){var h=window.RULES_LIST.map(function(r){return '<div style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;border-top:1px solid rgba(255,255,255,.12);text-align:left"><span style="font-size:1.25rem;min-width:26px;text-align:center">'+r.ic+'</span><span style="flex:1"><b>'+r.t+'</b><br><span style="opacity:.85;font-size:.82em">'+r.d+'</span></span></div>';}).join('');return '<div id="rules-start" style="margin-top:14px;padding:12px 14px;background:rgba(255,255,255,.08);border:2px solid rgba(255,213,79,.5);border-radius:16px;color:#fff;font-size:.85rem"><div style="text-align:center;font-weight:900;font-size:1.05rem;color:#ffd54f;margin-bottom:4px">📜 Spielregeln</div>'+h+'<div style="text-align:center;font-size:.72rem;opacity:.75;margin-top:6px">Mit dem Anmelden stimmst du den Regeln zu.</div></div>';};
