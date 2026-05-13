// FRANZÖSISCH - Age-based difficulty
const FrenchGame = {
  start({ ageGroup='einfach', onComplete }) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // Questions by age group
    const QUESTIONS = {
      sehr_einfach: [
        { q:"Wie sagt man 'Hallo' auf Französisch?", a:"bonjour", choices:["bonjour","merci","oui","chat"] },
        { q:"Was bedeutet 'chat'?", a:"Katze", choices:["Hund","Katze","Maus","Vogel"] },
        { q:"Wie sagt man 'Danke'?", a:"merci", choices:["bonjour","merci","non","oui"] },
        { q:"Was bedeutet 'maison'?", a:"Haus", choices:["Auto","Haus","Schule","Buch"] },
        { q:"Wie sagt man 'Ja'?", a:"oui", choices:["non","si","oui","bien"] },
        { q:"Was bedeutet 'école'?", a:"Schule", choices:["Schule","Park","Wald","See"] },
        { q:"Wie sagt man 'Nein'?", a:"non", choices:["oui","non","peut-être","jamais"] },
        { q:"Was bedeutet 'soleil'?", a:"Sonne", choices:["Mond","Stern","Sonne","Regen"] },
        { q:"Wie sagt man 'Gute Nacht'?", a:"bonne nuit", choices:["bonjour","bonne nuit","au revoir","merci"] },
        { q:"Was bedeutet 'chien'?", a:"Hund", choices:["Katze","Vogel","Hund","Fisch"] },
      ],
      einfach: [
        { q:"Konjugiere 'être' – Ich bin:", a:"je suis", choices:["je suis","je es","j'ai","je est"] },
        { q:"Was bedeutet 'Je m'appelle Marie'?", a:"Ich heiße Marie", choices:["Ich heiße Marie","Ich bin Marie","Ich sehe Marie","Ich liebe Marie"] },
        { q:"Welcher Artikel hat 'livre' (Buch)?", a:"le", choices:["le","la","les","un"] },
        { q:"Was ist die Verneinung von 'Je parle'?", a:"Je ne parle pas", choices:["Je ne parle pas","Je parle ne","Pas je parle","Ne je parle"] },
        { q:"'avoir' bedeutet:", a:"haben", choices:["sein","haben","kommen","gehen"] },
        { q:"Wie heißt 'wir spielen'?", a:"nous jouons", choices:["nous jouons","vous jouez","ils jouent","je joue"] },
        { q:"Was bedeutet 'Quel âge as-tu?'", a:"Wie alt bist du?", choices:["Wie heißt du?","Wie alt bist du?","Wo wohnst du?","Was machst du?"] },
        { q:"'La famille' bedeutet:", a:"die Familie", choices:["die Freunde","die Familie","die Schule","das Haus"] },
        { q:"Wie sagt man 'Ich gehe in die Schule'?", a:"Je vais à l'école", choices:["Je vais à l'école","Je suis à l'école","J'ai l'école","Je fais l'école"] },
        { q:"Was ist der Plural von 'un chien'?", a:"des chiens", choices:["des chiens","les chien","un chiens","des chien"] },
      ],
      mittel: [
        { q:"Was ist der Subjonctif présent von 'aller' (que je)?", a:"que j'aille", choices:["que j'aille","que je vais","que j'ai allé","que je soit"] },
        { q:"Das Imparfait von 'je suis' ist:", a:"j'étais", choices:["j'étais","j'ai été","je serai","je serais"] },
        { q:"Wähle den richtigen Konditionalis: 'Wenn ich Zeit hätte, ... ich reisen'", a:"je voyagerais", choices:["je voyagerais","je voyagerai","j'ai voyagé","je voyageais"] },
        { q:"'Bien que' verlangt:", a:"Subjonctif", choices:["Subjonctif","Indicatif","Infinitif","Conditionnel"] },
        { q:"Das Passé composé von 'partir' ist:", a:"je suis parti(e)", choices:["je suis parti(e)","j'ai parti","j'étais parti","je partis"] },
        { q:"'Le développement durable' bedeutet:", a:"nachhaltige Entwicklung", choices:["nachhaltige Entwicklung","digitale Entwicklung","wirtschaftliche Entwicklung","soziale Entwicklung"] },
        { q:"Was bedeutet 'néanmoins'?", a:"dennoch", choices:["dennoch","außerdem","deshalb","obwohl"] },
        { q:"'Y' ersetzt:", a:"einen Ort oder 'à + Sache'", choices:["einen Ort oder 'à + Sache'","eine Person","ein Subjekt","einen Besitz"] },
        { q:"Das Futur simple von 'avoir' (nous)?", a:"nous aurons", choices:["nous aurons","nous avons","nous aurions","nous ayons"] },
        { q:"'Se rendre compte' bedeutet:", a:"sich bewusst werden", choices:["sich bewusst werden","zurückkommen","sich hinsetzen","Auskunft geben"] },
      ],
      schwer: [
        { q:"Erklären Sie den Unterschied zwischen 'Passé composé' und 'Imparfait':", a:"PC: abgeschlossene Handlung; Imparfait: Zustand/Wiederholung", choices:["PC: abgeschlossene Handlung; Imparfait: Zustand/Wiederholung","Beide beschreiben Vergangenheit identisch","PC ist höflicher","Imparfait nur für Literatur"] },
        { q:"'Le subjonctif' nach 'bien que' – Beispiel korrekt?", a:"Bien qu'il soit fatigué, il travaille", choices:["Bien qu'il soit fatigué, il travaille","Bien qu'il est fatigué, il travaille","Bien qu'il sera fatigué","Bien qu'il serait fatigué"] },
        { q:"'La mondialisation' im Argumentationskontext:", a:"Globalisierung – wirtschaftliche und kulturelle Vernetzung", choices:["Globalisierung – wirtschaftliche und kulturelle Vernetzung","Lokalisierung regionaler Märkte","Digitalisierung der Wirtschaft","Europäische Integration"] },
        { q:"Welche Aussage über den Relativsatz mit 'dont' ist korrekt?", a:"'dont' = de + qui/lequel (ersetzt Genitiv)", choices:["'dont' = de + qui/lequel (ersetzt Genitiv)","'dont' = à + qui","'dont' = pour + quoi","'dont' nur mit Personen"] },
        { q:"'Quoique' + ?", a:"Subjonctif (obwohl)", choices:["Subjonctif (obwohl)","Indicatif (weil)","Infinitif (um zu)","Conditionnel (wenn)"] },
        { q:"Das Gérondif 'en parlant' entspricht:", a:"indem man spricht / während man spricht", choices:["indem man spricht / während man spricht","nachdem man gesprochen hat","um zu sprechen","ohne zu sprechen"] },
        { q:"'Le discours indirect' – Zeitverschiebung von Présent ins Passé:", a:"Présent → Imparfait", choices:["Présent → Imparfait","Présent → Passé composé","Présent → Futur","Présent → Subjonctif"] },
        { q:"Übersetzung: 'Malgré les difficultés, il a réussi à s'imposer'", a:"Trotz der Schwierigkeiten gelang es ihm, sich durchzusetzen", choices:["Trotz der Schwierigkeiten gelang es ihm, sich durchzusetzen","Wegen der Schwierigkeiten scheiterte er","Ohne Schwierigkeiten hatte er Erfolg","Er kämpfte gegen die Schwierigkeiten"] },
        { q:"'Mettre en lumière' bedeutet im akademischen Kontext:", a:"hervorheben / beleuchten", choices:["hervorheben / beleuchten","im Dunkeln lassen","kritisieren","vereinfachen"] },
        { q:"Welcher Modus nach 'pour que'?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
      ]
    };

    const questions = (QUESTIONS[ageGroup] || QUESTIONS['einfach']).sort(()=>Math.random()-0.5).slice(0,8);
    let qi=0, correct=0, wrong=0;

    const show = () => {
      if(qi >= questions.length){ finish(); return; }
      const q = questions[qi];
      const shuffled = [...q.choices].sort(()=>Math.random()-0.5);
      el.innerHTML = `
        <div style="padding:12px;max-width:520px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:.82rem;color:rgba(255,255,255,.5)">
            <span>🇫🇷 Frage ${qi+1}/${questions.length}</span>
            <span>✅ ${correct} ❌ ${wrong}</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:12px;font-size:clamp(.9rem,3vw,1.05rem);font-weight:600;line-height:1.4">${q.q}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${shuffled.map(c=>`<button onclick="FrenchGame._answer('${c.replace(/'/g,"\\'")}','${q.a.replace(/'/g,"\\'")}',this)"
              style="background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);color:#fff;padding:10px 8px;border-radius:10px;cursor:pointer;font-size:clamp(.8rem,2.5vw,.95rem);font-family:inherit;line-height:1.3;text-align:center;touch-action:manipulation">${c}</button>`).join('')}
          </div>
        </div>`;
    };

    FrenchGame._answer = (chosen, correct_ans, btn) => {
      const btns = btn.parentElement.querySelectorAll('button');
      btns.forEach(b => { b.disabled=true; if(b.textContent.trim()===correct_ans) b.style.background='rgba(39,174,96,.6)'; });
      if(chosen===correct_ans){ correct++; btn.style.background='rgba(39,174,96,.8)'; }
      else { wrong++; btn.style.background='rgba(231,76,60,.8)'; }
      qi++;
      setTimeout(show, 900);
    };

    const finish = () => {
      const pct = correct/questions.length;
      const rawScore = Math.round(pct*100);
      onComplete({ rawScore, passed: correct >= Math.ceil(questions.length*0.5), errors: wrong, timeMs: 0 });
    };

    show();
  }
};
window.FrenchGame = FrenchGame;
