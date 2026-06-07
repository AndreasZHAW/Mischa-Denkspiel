// ZUG / TRAIN - Age-based math word problems
const TrainGame = {
  start({ ageGroup='einfach', worldId, onComplete }) {
    const el = document.getElementById('game-area');
    if (!el) return;

    const genQ = (ag) => {
      const r = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
      const qs = [];
      if(ag==='sehr_einfach') {
        // Simple counting/addition, trains for kids
        const speeds = [[20,30,40,50],[10,15,20,25]];
        for(let i=0;i<6;i++){
          const v = r(10,30)*5; const t = r(1,3);
          const dist = v*t;
          qs.push({ q:`Ein Zug fährt ${v} km/h. Wie weit kommt er in ${t} Stunde${t>1?'n':''}?`, a:dist, unit:'km', hint:`${v} × ${t}` });
        }
        for(let i=0;i<4;i++){
          const d=r(2,9)*10; const t=r(1,4);
          qs.push({ q:`Ein Zug braucht ${t} Stunden für ${d*t} km. Wie schnell fährt er?`, a:d*10, unit:'km/h', hint:`${d*t} ÷ ${t}` });
        }
      } else if(ag==='einfach') {
        for(let i=0;i<5;i++){
          const v=r(5,15)*10; const t=r(2,5); const dist=v*t;
          qs.push({ q:`Zug A fährt ${v} km/h über ${t} Stunden. Gesamtweg?`, a:dist, unit:'km' });
        }
        for(let i=0;i<5;i++){
          const d=r(2,8)*50; const t=r(2,5);
          qs.push({ q:`Strecke: ${d} km, Zeit: ${t} Stunden. Ø Geschwindigkeit?`, a:Math.round(d/t), unit:'km/h' });
        }
      } else if(ag==='mittel') {
        // Relative speeds, meeting problems
        for(let i=0;i<4;i++){
          const v1=r(6,15)*10, v2=r(6,12)*10, dist=r(3,8)*100;
          const t=dist/(v1+v2);
          qs.push({ q:`Zwei Züge fahren aufeinander zu. A: ${v1}km/h, B: ${v2}km/h, Abstand: ${dist}km. Wann treffen sie sich (Std.)?`, a:parseFloat(t.toFixed(2)), unit:'h', tolerance:0.1 });
        }
        for(let i=0;i<4;i++){
          const v1=r(8,16)*10, v2=r(4,10)*10, dist=r(2,6)*100;
          const t=dist/(v1-v2);
          qs.push({ q:`Zug A (${v1}km/h) überholt Zug B (${v2}km/h). Anfangsabstand: ${dist}km. Überholzeit (h)?`, a:parseFloat(t.toFixed(2)), unit:'h', tolerance:0.1 });
        }
        for(let i=0;i<2;i++){
          const vkm=r(5,15)*10, len=r(100,500)*2, tsec=(len/vkm)*3.6;
          qs.push({ q:`Zug (${vkm}km/h) ist ${len}m lang. Wie lange braucht er um einen Bahnhof zu passieren (Sek.)?`, a:Math.round(tsec), unit:'s', tolerance:2 });
        }
      } else { // schwer - Abi level
        for(let i=0;i<4;i++){
          const v1=r(80,150), v2=r(60,130), d=r(200,800);
          const t=d/(v1+v2);
          const mt=Math.floor(t*60);
          qs.push({ q:`Zug A (${v1}km/h) und B (${v2}km/h) starten gleichzeitig gegeneinander, Abstand ${d}km. Nach wieviel Minuten treffen sie sich?`, a:mt, unit:'min', tolerance:2 });
        }
        for(let i=0;i<3;i++){
          const v=r(100,200), lt=r(200,600), ls=r(100,400);
          const t=((lt+ls)/v)*3.6;
          qs.push({ q:`Zug (${v}km/h, ${lt}m lang) durchfährt Tunnel (${ls}m). Zeit bis Zug komplett durch (s)?`, a:parseFloat(t.toFixed(1)), unit:'s', tolerance:1 });
        }
        for(let i=0;i<3;i++){
          const v1=r(100,160), v2=r(60,100), ahead=r(2,10)*10;
          const t=ahead/(v1-v2)*60;
          qs.push({ q:`Schnellzug (${v1}km/h) holt Güterzug (${v2}km/h) ein, Vorsprung ${ahead}km. Nach wieviel Minuten?`, a:Math.round(t), unit:'min', tolerance:2 });
        }
      }
      return qs.sort(()=>Math.random()-0.5).slice(0,8);
    };

    const questions = genQ(ageGroup);
    let qi=0, correct=0, wrong=0;

    const show = () => {
      if(qi>=questions.length){ finish(); return; }
      const q=questions[qi];
      el.innerHTML=`
        <div style="padding:10px 8px;max-width:min(520px,100vw);margin:0 auto;overflow-x:hidden">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:.82rem;color:rgba(255,255,255,.5)">
            <span>🚂 Frage ${qi+1}/${questions.length}</span>
            <span>✅ ${correct} ❌ ${wrong}</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:10px;font-size:clamp(.88rem,2.8vw,1rem);line-height:1.5">${q.q}</div>
          ${q.hint?`<div style="font-size:.75rem;color:rgba(255,215,0,.6);margin-bottom:8px">💡 Hinweis: ${q.hint}</div>`:''}
          <div style="display:flex;gap:8px;align-items:center">
            <input id="train-ans" type="number" step="0.01" placeholder="Antwort in ${q.unit}"
              style="flex:1;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3);color:#fff;padding:10px 12px;border-radius:10px;font-size:1rem;font-family:inherit"
              onkeydown="if(event.key==='Enter')TrainGame._check()">
            <button onclick="TrainGame._check()" style="background:#27AE60;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer">✓</button>
          </div>
          <div id="train-feedback" style="margin-top:8px;font-size:.9rem;min-height:24px"></div>
        </div>`;
      document.getElementById('train-ans')?.focus();
    };

    TrainGame._check = () => {
      const inp = document.getElementById('train-ans');
      const fb = document.getElementById('train-feedback');
      if(!inp) return;
      const val = parseFloat(inp.value.replace(',','.'));
      if(isNaN(val)){ fb.textContent='Bitte eine Zahl eingeben'; fb.style.color='#FFD700'; return; }
      const q = questions[qi];
      const tol = q.tolerance||0;
      const ok = Math.abs(val-q.a) <= tol;
      if(ok){
        correct++;
        fb.textContent='✅ Richtig!';
        fb.style.color='#27AE60';
      } else {
        wrong++;
        fb.textContent=`❌ Falsch. Antwort: ${q.a} ${q.unit}`;
        fb.style.color='#E74C3C';
      }
      inp.disabled=true;
      qi++;
      setTimeout(show, 1200);
    };

    const finish = () => {
      const raw = Math.round((correct/questions.length)*100);
      onComplete({ rawScore:raw, passed: correct>=Math.ceil(questions.length*0.5), errors:wrong, timeMs:0 });
    };

    show();
  }
};
window.TrainGame = TrainGame;
