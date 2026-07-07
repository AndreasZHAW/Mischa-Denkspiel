// FRANZÖSISCH - Age-based difficulty
const FrenchGame = {
  start({ ageGroup='schwer', onComplete }) {  // default: adult level
    const el = document.getElementById('game-area');
    if (!el) return;

    // Questions by age group
    const QUESTIONS = {
      sehr_einfach: [
        { q:{de:'Wie sagt man \'Hallo\' auf Französisch?',en:'How do you say \'Hello\' in French?',fr:'Comment dit-on « Bonjour » en allemand ?'}, a:{de:'bonjour',en:'bonjour',fr:'Hallo'}, choices:{de:['bonjour','merci','oui','chat'],en:['bonjour','merci','oui','chat'],fr:['Hallo','Danke','Ja','Katze']} },
        { q:{de:'Was bedeutet \'chat\'?',en:'What does \'chat\' mean?',fr:'Que signifie « Katze » ?'}, a:{de:'Katze',en:'Cat',fr:'chat'}, choices:{de:['Hund','Katze','Maus','Vogel'],en:['Dog','Cat','Mouse','Bird'],fr:['chien','chat','souris','oiseau']} },
        { q:{de:'Wie sagt man \'Danke\'?',en:'How do you say \'Thank you\'?',fr:'Comment dit-on « Merci » en allemand ?'}, a:{de:'merci',en:'merci',fr:'Danke'}, choices:{de:['bonjour','merci','non','oui'],en:['bonjour','merci','non','oui'],fr:['Hallo','Danke','Nein','Ja']} },
        { q:{de:'Was bedeutet \'maison\'?',en:'What does \'maison\' mean?',fr:'Que signifie « Haus » ?'}, a:{de:'Haus',en:'House',fr:'maison'}, choices:{de:['Auto','Haus','Schule','Buch'],en:['Car','House','School','Book'],fr:['voiture','maison','école','livre']} },
        { q:{de:'Wie sagt man \'Ja\'?',en:'How do you say \'Yes\'?',fr:'Comment dit-on « Oui » en allemand ?'}, a:{de:'oui',en:'oui',fr:'Ja'}, choices:{de:['non','si','oui','bien'],en:['non','si','oui','bien'],fr:['Nein','doch','Ja','gut']} },
        { q:{de:'Was bedeutet \'école\'?',en:'What does \'école\' mean?',fr:'Que signifie « Schule » ?'}, a:{de:'Schule',en:'School',fr:'école'}, choices:{de:['Schule','Park','Wald','See'],en:['School','Park','Forest','Lake'],fr:['école','parc','forêt','lac']} },
        { q:{de:'Wie sagt man \'Nein\'?',en:'How do you say \'No\'?',fr:'Comment dit-on « Non » en allemand ?'}, a:{de:'non',en:'non',fr:'Nein'}, choices:{de:['oui','non','peut-être','jamais'],en:['oui','non','peut-être','jamais'],fr:['Ja','Nein','vielleicht','nie']} },
        { q:{de:'Was bedeutet \'soleil\'?',en:'What does \'soleil\' mean?',fr:'Que signifie « Sonne » ?'}, a:{de:'Sonne',en:'Sun',fr:'soleil'}, choices:{de:['Mond','Stern','Sonne','Regen'],en:['Moon','Star','Sun','Rain'],fr:['lune','étoile','soleil','pluie']} },
        { q:{de:'Wie sagt man \'Gute Nacht\'?',en:'How do you say \'Good night\'?',fr:'Comment dit-on « Bonne nuit » en allemand ?'}, a:{de:'bonne nuit',en:'bonne nuit',fr:'Gute Nacht'}, choices:{de:['bonjour','bonne nuit','au revoir','merci'],en:['bonjour','bonne nuit','au revoir','merci'],fr:['Hallo','Gute Nacht','Auf Wiedersehen','Danke']} },
        { q:{de:'Was bedeutet \'chien\'?',en:'What does \'chien\' mean?',fr:'Que signifie « Hund » ?'}, a:{de:'Hund',en:'Dog',fr:'chien'}, choices:{de:['Katze','Vogel','Hund','Fisch'],en:['Cat','Bird','Dog','Fish'],fr:['chat','oiseau','chien','poisson']} },
      ],
      einfach: [
        { q:{de:'Konjugiere \'être\' – Ich bin:',en:'Conjugate \'être\' – I am:',fr:'Conjugue « être » – Je suis :'}, a:{de:'je suis',en:'je suis',fr:'je suis'}, choices:{de:['je suis','je es','j\'ai','je est'],en:['je suis','je es','j\'ai','je est'],fr:['je suis','je es','j\'ai','je est']} },
        { q:{de:'Was bedeutet \'Je m\'appelle Marie\'?',en:'What does \'Je m\'appelle Marie\' mean?',fr:'Que signifie « Ich heiße Marie » ?'}, a:{de:'Ich heiße Marie',en:'My name is Marie',fr:'je m\'appelle Marie'}, choices:{de:['Ich heiße Marie','Ich bin Marie','Ich sehe Marie','Ich liebe Marie'],en:['My name is Marie','I am Marie','I see Marie','I love Marie'],fr:['je m\'appelle Marie','je suis Marie','je vois Marie','j\'aime Marie']} },
        { q:{de:'Welcher Artikel hat \'livre\' (Buch)?',en:'Which article goes with \'livre\' (book)?',fr:'Quel article accompagne « livre » ?'}, a:{de:'le',en:'le',fr:'le'}, choices:{de:['le','la','les','un'],en:['le','la','les','un'],fr:['le','la','les','un']} },
        { q:{de:'Was ist die Verneinung von \'Je parle\'?',en:'What is the negation of \'Je parle\'?',fr:'Quelle est la négation de « Je parle » ?'}, a:{de:'Je ne parle pas',en:'Je ne parle pas',fr:'Je ne parle pas'}, choices:{de:['Je ne parle pas','Je parle ne','Pas je parle','Ne je parle'],en:['Je ne parle pas','Je parle ne','Pas je parle','Ne je parle'],fr:['Je ne parle pas','Je parle ne','Pas je parle','Ne je parle']} },
        { q:{de:'\'avoir\' bedeutet:',en:'\'avoir\' means:',fr:'Que signifie « haben » ?'}, a:{de:'haben',en:'to have',fr:'avoir'}, choices:{de:['sein','haben','kommen','gehen'],en:['to be','to have','to come','to go'],fr:['être','avoir','venir','aller']} },
        { q:{de:'Wie heißt \'wir spielen\'?',en:'How do you say \'we play\'?',fr:'Comment dit-on « nous jouons » en allemand ?'}, a:{de:'nous jouons',en:'nous jouons',fr:'wir spielen'}, choices:{de:['nous jouons','vous jouez','ils jouent','je joue'],en:['nous jouons','vous jouez','ils jouent','je joue'],fr:['wir spielen','ihr spielt','sie spielen','ich spiele']} },
        { q:{de:'Was bedeutet \'Quel âge as-tu?\'',en:'What does \'Quel âge as-tu?\' mean?',fr:'Que signifie « Wie alt bist du? » ?'}, a:{de:'Wie alt bist du?',en:'How old are you?',fr:'quel âge as-tu'}, choices:{de:['Wie heißt du?','Wie alt bist du?','Wo wohnst du?','Was machst du?'],en:['What\'s your name?','How old are you?','Where do you live?','What are you doing?'],fr:['comment tu t\'appelles','quel âge as-tu','où habites-tu','que fais-tu']} },
        { q:{de:'\'La famille\' bedeutet:',en:'\'La famille\' means:',fr:'Que signifie « die Familie » ?'}, a:{de:'die Familie',en:'the family',fr:'la famille'}, choices:{de:['die Freunde','die Familie','die Schule','das Haus'],en:['the friends','the family','the school','the house'],fr:['les amis','la famille','l\'école','la maison']} },
        { q:{de:'Wie sagt man \'Ich gehe in die Schule\'?',en:'How do you say \'I am going to school\'?',fr:'Comment dit-on « Je vais à l\'école » en allemand ?'}, a:{de:'Je vais à l\'école',en:'Je vais à l\'école',fr:'Ich gehe in die Schule'}, choices:{de:['Je vais à l\'école','Je suis à l\'école','J\'ai l\'école','Je fais l\'école'],en:['Je vais à l\'école','Je suis à l\'école','J\'ai l\'école','Je fais l\'école'],fr:['Ich gehe in die Schule','Ich bin in der Schule','Ich habe die Schule','Ich mache die Schule']} },
        { q:{de:'Was ist der Plural von \'un chien\'?',en:'What is the plural of \'un chien\'?',fr:'Quel est le pluriel de « un chien » ?'}, a:{de:'des chiens',en:'des chiens',fr:'des chiens'}, choices:{de:['des chiens','les chien','un chiens','des chien'],en:['des chiens','les chien','un chiens','des chien'],fr:['des chiens','les chien','un chiens','des chien']} },
      ],
      mittel: [
        { q:{de:'Was ist der Subjonctif présent von \'aller\' (que je)?',en:'What is the present subjunctive of \'aller\' (que je)?',fr:'Quel est le subjonctif présent de « aller » (que je) ?'}, a:{de:'que j\'aille',en:'que j\'aille',fr:'que j\'aille'}, choices:{de:['que j\'aille','que je vais','que j\'ai allé','que je soit'],en:['que j\'aille','que je vais','que j\'ai allé','que je soit'],fr:['que j\'aille','que je vais','que j\'ai allé','que je soit']} },
        { q:{de:'Das Imparfait von \'je suis\' ist:',en:'The imperfect of \'je suis\' is:',fr:'L\'imparfait de « je suis » est :'}, a:{de:'j\'étais',en:'j\'étais',fr:'j\'étais'}, choices:{de:['j\'étais','j\'ai été','je serai','je serais'],en:['j\'étais','j\'ai été','je serai','je serais'],fr:['j\'étais','j\'ai été','je serai','je serais']} },
        { q:{de:'Wähle den richtigen Konditionalis: \'Wenn ich Zeit hätte, ... ich reisen\'',en:'Choose the correct conditional: \'If I had time, I ... travel\'',fr:'Choisis le bon conditionnel : « Si j\'avais le temps, je ... voyager »'}, a:{de:'je voyagerais',en:'je voyagerais',fr:'je voyagerais'}, choices:{de:['je voyagerais','je voyagerai','j\'ai voyagé','je voyageais'],en:['je voyagerais','je voyagerai','j\'ai voyagé','je voyageais'],fr:['je voyagerais','je voyagerai','j\'ai voyagé','je voyageais']} },
        { q:{de:'\'Bien que\' verlangt:',en:'\'Bien que\' requires:',fr:'« Bien que » demande :'}, a:{de:'Subjonctif',en:'Subjunctive',fr:'le subjonctif'}, choices:{de:['Subjonctif','Indicatif','Infinitif','Conditionnel'],en:['Subjunctive','Indicative','Infinitive','Conditional'],fr:['le subjonctif','l\'indicatif','l\'infinitif','le conditionnel']} },
        { q:{de:'Das Passé composé von \'partir\' ist:',en:'The passé composé of \'partir\' is:',fr:'Le passé composé de « partir » est :'}, a:{de:'je suis parti(e)',en:'je suis parti(e)',fr:'je suis parti(e)'}, choices:{de:['je suis parti(e)','j\'ai parti','j\'étais parti','je partis'],en:['je suis parti(e)','j\'ai parti','j\'étais parti','je partis'],fr:['je suis parti(e)','j\'ai parti','j\'étais parti','je partis']} },
        { q:{de:'\'Le développement durable\' bedeutet:',en:'\'Le développement durable\' means:',fr:'Que signifie « nachhaltige Entwicklung » ?'}, a:{de:'nachhaltige Entwicklung',en:'sustainable development',fr:'le développement durable'}, choices:{de:['nachhaltige Entwicklung','digitale Entwicklung','wirtschaftliche Entwicklung','soziale Entwicklung'],en:['sustainable development','digital development','economic development','social development'],fr:['le développement durable','le développement numérique','le développement économique','le développement social']} },
        { q:{de:'Was bedeutet \'néanmoins\'?',en:'What does \'néanmoins\' mean?',fr:'Que signifie « dennoch » ?'}, a:{de:'dennoch',en:'nevertheless',fr:'néanmoins'}, choices:{de:['dennoch','außerdem','deshalb','obwohl'],en:['nevertheless','besides','therefore','although'],fr:['néanmoins','d\'ailleurs','donc','bien que']} },
        { q:{de:'\'Y\' ersetzt:',en:'\'Y\' replaces:',fr:'« Y » remplace :'}, a:{de:'einen Ort oder \'à + Sache\'',en:'a place or \'à + thing\'',fr:'un lieu ou « à + chose »'}, choices:{de:['einen Ort oder \'à + Sache\'','eine Person','ein Subjekt','einen Besitz'],en:['a place or \'à + thing\'','a person','a subject','a possession'],fr:['un lieu ou « à + chose »','une personne','un sujet','une possession']} },
        { q:{de:'Das Futur simple von \'avoir\' (nous)?',en:'The futur simple of \'avoir\' (nous)?',fr:'Le futur simple de « avoir » (nous) ?'}, a:{de:'nous aurons',en:'nous aurons',fr:'nous aurons'}, choices:{de:['nous aurons','nous avons','nous aurions','nous ayons'],en:['nous aurons','nous avons','nous aurions','nous ayons'],fr:['nous aurons','nous avons','nous aurions','nous ayons']} },
        { q:{de:'\'Se rendre compte\' bedeutet:',en:'\'Se rendre compte\' means:',fr:'Que signifie « sich bewusst werden » ?'}, a:{de:'sich bewusst werden',en:'to realize',fr:'se rendre compte'}, choices:{de:['sich bewusst werden','zurückkommen','sich hinsetzen','Auskunft geben'],en:['to realize','to come back','to sit down','to give information'],fr:['se rendre compte','revenir','s\'asseoir','donner des informations']} },
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
              { q:"'Certes' bedeutet:", a:"gewiss / zwar", choices:["gewiss / zwar","sicher nicht","vielleicht","trotzdem"] },
        { q:"'Pourtant' bedeutet:", a:"jedoch / dennoch", choices:["jedoch / dennoch","weil","obwohl","deshalb"] },
        { q:"'D'ailleurs' bedeutet:", a:"außerdem / übrigens", choices:["außerdem / übrigens","dahinter","danach","darüber"] },
        { q:"Subjonctif von 'avoir' (que tu)?", a:"que tu aies", choices:["que tu aies","que tu as","que tu avais","que tu aurais"] },
        { q:"Subjonctif von 'savoir' (que je)?", a:"que je sache", choices:["que je sache","que je sais","que je savais","que je saurai"] },
        { q:"'Afin que' + welcher Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Futur"] },
        { q:"'À moins que' + welcher Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"Conditionnel passé von 'avoir' (j')?", a:"j'aurais eu", choices:["j'aurais eu","j'avais eu","j'aurai eu","j'ai eu"] },
        { q:"'Se plaindre de' bedeutet:", a:"sich beklagen über", choices:["sich beklagen über","sich freuen über","verzichten auf","bestehen auf"] },
        { q:"'Il est probable que' + Modus?", a:"Indicatif", choices:["Indicatif","Subjonctif","Conditionnel","Infinitif"] },
        { q:"'Il est possible que' + Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"Futur antérieur von 'finir' (nous)?", a:"nous aurons fini", choices:["nous aurons fini","nous avons fini","nous aurions fini","nous finissons"] },
        { q:"'En tant que' bedeutet:", a:"als / in der Eigenschaft als", choices:["als / in der Eigenschaft als","während","obwohl","weil"] },
        { q:"'Sans que' + welcher Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"'Contrairement à' bedeutet:", a:"im Gegensatz zu", choices:["im Gegensatz zu","ähnlich wie","gemäß","dank"] },
        { q:"'La mise en œuvre' bedeutet:", a:"die Umsetzung", choices:["die Umsetzung","die Ausstellung","die Einführung","die Abschaffung"] },
        { q:"Subjonctif von 'faire' (que nous)?", a:"que nous fassions", choices:["que nous fassions","que nous faisons","que nous ferions","que nous ferons"] },
        { q:"'Désormais' bedeutet:", a:"von nun an / fortan", choices:["von nun an / fortan","früher","manchmal","überall"] },
        { q:"'En dépit de' bedeutet:", a:"trotz", choices:["trotz","wegen","durch","ohne"] },
        { q:"Participe présent von 'recevoir':", a:"recevant", choices:["recevant","reçoivant","recevont","recevant"] },
        { q:"'À condition que' + Modus?", a:"Subjonctif", choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"] },
        { q:"'Il convient de' bedeutet:", a:"es empfiehlt sich", choices:["es empfiehlt sich","es passt nicht","es schadet","es genügt nicht"] },
        { q:"'Quant à' bedeutet:", a:"was ... betrifft", choices:["was ... betrifft","wenn ... dann","damit","obwohl"] },
        { q:"Conditionnel présent von 'être' (vous)?", a:"vous seriez", choices:["vous seriez","vous êtes","vous serez","vous étiez"] },
        { q:"'Par ailleurs' bedeutet:", a:"darüber hinaus / im Übrigen", choices:["darüber hinaus / im Übrigen","daneben","deshalb","trotzdem"] },
        { q:"'Malgré' + was folgt danach?", a:"Nomen (kein Verb)", choices:["Nomen (kein Verb)","Subjonctif","Indicatif","Infinitif"] },
        { q:"'Bien que' vs 'malgré': Unterschied?", a:"bien que + Subjonctif, malgré + Nomen", choices:["bien que + Subjonctif, malgré + Nomen","beide + Subjonctif","beide + Nomen","kein Unterschied"] },
        { q:"'La vraisemblance' bedeutet:", a:"die Wahrscheinlichkeit", choices:["die Wahrscheinlichkeit","die Unmöglichkeit","die Sicherheit","die Unsicherheit"] },
        { q:"'Force est de constater que' = ?", a:"man muss feststellen, dass", choices:["man muss feststellen, dass","es ist wichtig, dass","man hofft, dass","man weiß, dass"] },
        { q:"'À titre d'exemple' bedeutet:", a:"zum Beispiel / als Beispiel", choices:["zum Beispiel / als Beispiel","als Ausnahme","als Regel","als Gegenbeispiel"] },
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
    const grpLabel = {
      'sehr_einfach': typeof t!=='undefined'?t('french.level_beginner'):'Stufe: Anfänger',
      'einfach':      typeof t!=='undefined'?t('french.level_basic'):'Stufe: Grundkenntnisse',
      'mittel':       typeof t!=='undefined'?t('french.level_intermediate'):'Stufe: Mittelstufe',
      'schwer':       typeof t!=='undefined'?t('french.level_advanced'):'Stufe: Fortgeschritten',
    };

    // Pick the right language variant of a question field. Older/not-yet-translated
    // tiers still use plain strings — those are returned unchanged for every language.
    const _pick = (v) => {
      if (v && typeof v === 'object') {
        const cur = (typeof LANG!=='undefined' && LANG._cur) ? LANG._cur : 'de';
        const lang = (cur==='de_simple') ? 'de' : cur;
        return v[lang] || v.de;
      }
      return v;
    };

    const show = () => {
      if(qi >= questions.length){ finish(); return; }
      const q = questions[qi];
      const qText = _pick(q.q), aText = _pick(q.a);
      const choicesArr = (q.choices && typeof q.choices === 'object' && !Array.isArray(q.choices)) ? _pick(q.choices) : q.choices;
      const shuffled = [...choicesArr].sort(()=>Math.random()-0.5);
      el.innerHTML = `
        <div style="padding:10px 8px;max-width:min(520px,100vw);margin:0 auto;overflow-x:hidden">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:.82rem;color:rgba(255,255,255,.5)">
            <span>🇫🇷 ${typeof t!=='undefined'?t('tf.question_n'):'Frage'} ${qi+1}/${questions.length}</span>
            <span style="font-size:0.78rem;color:rgba(255,255,255,.4);background:rgba(255,255,255,.08);padding:2px 8px;border-radius:10px">${grpLabel[grp]||grp}</span>
            <span>✅ ${correct} ❌ ${wrong}</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:12px;font-size:clamp(.9rem,3vw,1.05rem);font-weight:600;line-height:1.4">${qText}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${shuffled.map(c=>`<button onclick="FrenchGame._answer('${c.replace(/'/g,"\\'")}','${aText.replace(/'/g,"\\'")}',this)"
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
// Expose for admin question panel
FrenchGame._getQuestions = function(level){
  const Q=window.FrenchGame._allQ||(()=>{
    const q={sehr_einfach:[
      {q:"Wie sagt man 'Hallo' auf Französisch?",a:"bonjour",choices:["bonjour","bonsoir","merci","au revoir"]},
      {q:"Was bedeutet 'chat'?",a:"Katze",choices:["Katze","Hund","Haus","Schule"]},
      {q:"Wie sagt man 'Danke'?",a:"merci",choices:["merci","oui","non","bonjour"]},
      {q:"Was bedeutet 'maison'?",a:"Haus",choices:["Haus","Auto","Schule","Katze"]},
      {q:"Wie sagt man 'Ja'?",a:"oui",choices:["oui","non","merci","si"]},
      {q:"Was bedeutet 'école'?",a:"Schule",choices:["Schule","Haus","Auto","Park"]},
      {q:"Wie sagt man 'Nein'?",a:"non",choices:["non","oui","peut-être","jamais"]},
      {q:"Was bedeutet 'soleil'?",a:"Sonne",choices:["Sonne","Mond","Regen","Wind"]},
      {q:"Wie sagt man 'Gute Nacht'?",a:"bonne nuit",choices:["bonne nuit","bonsoir","bonjour","bonne journée"]},
      {q:"Was bedeutet 'chien'?",a:"Hund",choices:["Hund","Katze","Vogel","Fisch"]},
    ],einfach:[
      {q:"Konjugiere 'être' – Ich bin:",a:"je suis",choices:["je suis","je ai","je est","je être"]},
      {q:"Was bedeutet 'Je m'appelle Marie'?",a:"Ich heiße Marie",choices:["Ich heiße Marie","Ich bin Marie","Ich kenne Marie","Ich sehe Marie"]},
      {q:"Welcher Artikel hat 'livre' (Buch)?",a:"le",choices:["le","la","les","un"]},
      {q:"Was ist die Verneinung von 'Je parle'?",a:"Je ne parle pas",choices:["Je ne parle pas","Je parle non","Je pas parle","Je parle jamais"]},
      {q:"'avoir' bedeutet:",a:"haben",choices:["haben","sein","gehen","kommen"]},
      {q:"Wie heißt 'wir spielen'?",a:"nous jouons",choices:["nous jouons","nous jouez","vous jouons","ils jouons"]},
      {q:"Was bedeutet 'Quel âge as-tu?'",a:"Wie alt bist du?",choices:["Wie alt bist du?","Wie heißt du?","Woher kommst du?","Was machst du?"]},
      {q:"'La famille' bedeutet:",a:"die Familie",choices:["die Familie","der Vater","die Mutter","das Kind"]},
      {q:"Wie sagt man 'Ich gehe in die Schule'?",a:"Je vais à l'école",choices:["Je vais à l'école","Je suis à l'école","J'ai l'école","Je faire l'école"]},
      {q:"Was ist der Plural von 'un chien'?",a:"des chiens",choices:["des chiens","les chien","un chiens","des chien"]},
    ],mittel:[
      {q:"Was ist der Subjonctif von 'aller' (que je)?",a:"que j'aille",choices:["que j'aille","que je vais","que j'ai allé","que je soit"]},
      {q:"Imparfait von 'je suis'?",a:"j'étais",choices:["j'étais","je fus","j'ai été","je serais"]},
      {q:"Konditionalis: 'si j'avais le temps, je ... réfléchir'",a:"voudrais",choices:["voudrais","veux","voulais","voudrai"]},
      {q:"'Bien que' + welcher Modus?",a:"Subjonctif",choices:["Subjonctif","Indicatif","Conditionnel","Infinitif"]},
      {q:"Passé composé von 'partir' (je)?",a:"je suis parti(e)",choices:["je suis parti(e)","j'ai parti","je partais","je partirai"]},
      {q:"Was bedeutet 'néanmoins'?",a:"dennoch",choices:["dennoch","niemals","immerhin","sowieso"]},
      {q:"'Y' ersetzt in 'J'y pense':",a:"à cela / an diesen Ort",choices:["à cela / an diesen Ort","ihn / sie","davon","damit"]},
      {q:"Futur simple 'avoir' (nous)?",a:"nous aurons",choices:["nous aurons","nous avons","nous aurions","nous avions"]},
      {q:"'Se rendre compte de qch':",a:"sich etw. bewusst werden",choices:["sich etw. bewusst werden","zurückgehen","sich beeilen","abrechnen"]},
      {q:"'Le développement durable' bedeutet:",a:"nachhaltige Entwicklung",choices:["nachhaltige Entwicklung","dauerhafte Planung","wirtschaftliches Wachstum","technischer Fortschritt"]},
    ]};
    window.FrenchGame._allQ=q; return q;
  })();
  return Q[level]||[];
};
