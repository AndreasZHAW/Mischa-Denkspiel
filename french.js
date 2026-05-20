// FRANZÖSISCH - Age-based difficulty
const FrenchGame = {
  start({ ageGroup='schwer', onComplete }) {  // default: adult level
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
        // Grammatik
        { q:"Welcher Modus steht nach 'pour que'?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"'Bien que' + __ (korrekte Form)?", a:"il soit fatigué", choices:["il soit fatigué","il est fatigué","il serait fatigué","il sera fatigué"] },
        { q:"Das Passé composé von 'venir' (je) ist:", a:"je suis venu(e)", choices:["je suis venu(e)","j'ai venu","j'étais venu","je venais"] },
        { q:"'Dont' ersetzt:", a:"de + nom / pronom", choices:["de + nom / pronom","à + nom","avec + nom","en + nom"] },
        { q:"Gérondif von 'parler' ist:", a:"en parlant", choices:["en parlant","en parlé","en parler","parlant"] },
        { q:"Das Futur antérieur von 'finir' (j') ist:", a:"j'aurai fini", choices:["j'aurai fini","j'aurais fini","j'ai fini","j'avais fini"] },
        { q:"'Quoique' verlangt welchen Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"Conditionnel passé von 'avoir' (vous) ist:", a:"vous auriez eu", choices:["vous auriez eu","vous aurez eu","vous aviez eu","vous avez eu"] },
        // Vokabular / Übersetzung (schwer)
        { q:"'Malgré' bedeutet auf Deutsch:", a:"trotz", choices:["trotz","wegen","während","ohne"] },
        { q:"'Néanmoins' bedeutet:", a:"dennoch / trotzdem", choices:["dennoch / trotzdem","außerdem","deshalb","obwohl"] },
        { q:"'Se rendre compte de qch' bedeutet:", a:"sich etw. bewusst werden", choices:["sich etw. bewusst werden","etw. zurückgeben","ankommen","sich bedanken"] },
        { q:"'Mettre en lumière' bedeutet im akademischen Kontext:", a:"hervorheben / beleuchten", choices:["hervorheben / beleuchten","im Dunkeln lassen","kritisieren","ausschalten"] },
        { q:"'Voire' als Adverb bedeutet:", a:"ja sogar / und sogar", choices:["ja sogar / und sogar","vielleicht","obwohl","jedoch"] },
        { q:"'Davantage' bedeutet:", a:"mehr / stärker", choices:["mehr / stärker","heute","davor","meistens"] },
        { q:"Übersetzung von 'Il s'agit de':", a:"Es handelt sich um", choices:["Es handelt sich um","Er kommt aus","Es gibt","Es scheint"] },
        { q:"'En revanche' bedeutet:", a:"dagegen / im Gegensatz dazu", choices:["dagegen / im Gegensatz dazu","als Rache","in der Rückkehr","einerseits"] },
        // Diskurs / Stil
        { q:"'Le discours indirect' – wie ändert sich 'Présent' bei Vergangenheitsform?", a:"Présent → Imparfait", choices:["Présent → Imparfait","Présent → PC","Présent → Futur","Présent → Subjonctif"] },
        { q:"Ein 'connecteur logique' zur Einräumung ist:", a:"certes / il est vrai que", choices:["certes / il est vrai que","donc / alors","car / puisque","ainsi / c'est pourquoi"] },
        { q:"'Par conséquent' leitet ein:", a:"eine Schlussfolgerung ein", choices:["eine Schlussfolgerung ein","einen Gegensatz ein","eine Bedingung ein","eine Erklärung ein"] },
        { q:"'En effet' bedeutet im argumentativen Text:", a:"tatsächlich / nämlich (Begründung)", choices:["tatsächlich / nämlich (Begründung)","trotzdem","außerdem","im Gegenteil"] },
      ]
    };

    // Adults (mittel/schwer) get harder questions
    let grp = QUESTIONS[ageGroup] ? ageGroup : 'schwer';
    if(!QUESTIONS[grp]) grp = 'schwer'; // ultimate fallback
    // Debug: log age group
    console.log('[French] ageGroup='+ageGroup+' -> grp='+grp);
    const questions = QUESTIONS[grp].sort(()=>Math.random()-0.5).slice(0,8);
    let qi=0, correct=0, wrong=0;

    // Show which difficulty is active (helps debug)
    const grpLabel={'sehr_einfach':'Stufe: Anfänger','einfach':'Stufe: Grundkenntnisse','mittel':'Stufe: Mittelstufe','schwer':'Stufe: Fortgeschritten'};

    const show = () => {
      if(qi >= questions.length){ finish(); return; }
      const q = questions[qi];
      const shuffled = [...q.choices].sort(()=>Math.random()-0.5);
      el.innerHTML = `
        <div style="padding:10px 8px;max-width:min(520px,100vw);margin:0 auto;overflow-x:hidden">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:.82rem;color:rgba(255,255,255,.5)">
            <span>🇫🇷 Frage ${qi+1}/${questions.length}</span>
            <span style="font-size:0.78rem;color:rgba(255,255,255,.4);background:rgba(255,255,255,.08);padding:2px 8px;border-radius:10px">${grpLabel[grp]||grp}</span>
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
