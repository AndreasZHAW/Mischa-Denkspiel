/* ═══ ZCine (v814): Kurzfilm-Animationen – Ei-Schlüpfen, Welt-Einführung, Admin-Ankündigung, Achterbahn-Premiere, Tutorial-Clips ═══ */
(function(){
  if(window.ZCine) return;
  const W=1280,H=720;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>clamp((t-a)/(b-a),0,1), ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  const rnd=n=>{ const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); };
  const fade=(t,a,b,fi,fo)=>Math.min(seg(t,a,a+fi),1-seg(t,b-fo,b));
  let ctx;
  const sky=(c1,c2)=>{ const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,c1); g.addColorStop(1,c2); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); };
  const stars=(t,n)=>{ for(let i=0;i<n;i++){ ctx.fillStyle='rgba(255,255,255,'+(.4+.6*Math.abs(Math.sin(t*1.2+i)))+')'; ctx.fillRect(rnd(i)*W,rnd(i+99)*H*.8,2+rnd(i+5)*2,2+rnd(i+5)*2); } };
  const txt=(s,x,y,size,col,a,opt)=>{ opt=opt||{}; if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font='900 '+size+'px Arial Black, Arial, sans-serif'; ctx.textAlign=opt.al||'center'; ctx.textBaseline='middle'; ctx.lineWidth=size/6; ctx.strokeStyle='rgba(0,0,0,.75)'; ctx.lineJoin='round'; ctx.strokeText(s,x,y); ctx.fillStyle=col; ctx.fillText(s,x,y); ctx.restore(); };
  const emo=(e,x,y,s,a,rot)=>{ ctx.save(); ctx.globalAlpha=a==null?1:a; ctx.translate(x,y); if(rot) ctx.rotate(rot); ctx.font=s+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e,0,0); ctx.restore(); };
  const wrap=(s,x,y,w,size,col,a)=>{ ctx.save(); ctx.globalAlpha=a; ctx.font='700 '+size+'px Arial'; ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='top'; const words=String(s).split(' '); let line='',yy=y; words.forEach(wd=>{ if(ctx.measureText(line+wd).width>w){ ctx.fillText(line,x,yy); yy+=size*1.3; line=''; } line+=wd+' '; }); ctx.fillText(line,x,yy); ctx.restore(); };
  const flash=(a)=>{ if(a>0){ ctx.fillStyle='rgba(255,255,255,'+a+')'; ctx.fillRect(0,0,W,H); } };
  const confetti=(t,n)=>{ for(let i=0;i<n;i++){ const x=rnd(i)*W, y=((rnd(i+9)*H*.6+t*(120+rnd(i+3)*180))%(H+40))-20; ctx.fillStyle=['#ffd54f','#69f0ae','#ff80ab','#80d8ff','#fff'][i%5]; ctx.save(); ctx.translate(x,y); ctx.rotate(t*3+i); ctx.fillRect(-6,-3,12,6); ctx.restore(); } };
  const glow=(x,y,r,col,a)=>{ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); ctx.restore(); };
  const RC={rare:'#42a5f5',epic:'#ab47bc',legendary:'#ffb300',ultralegendary:'#ff5252',god:'#ffffff',mythic:'#ff4081'};

  // ── Ei-Schlüpfen (6,5 s) ──
  function egg(t,o){ const col=RC[o.r]||'#ffd54f'; sky('#0b1020','#1a2748'); stars(t,60); glow(W/2,380,260+Math.sin(t*3)*20,col,.25+.25*seg(t,0,3.5));
    const cx=W/2, cy=400; const wob=t<3.6?Math.sin(t*(8+t*6))*(.04+.14*seg(t,0,3.5)):0;
    if(t<3.6){ ctx.save(); ctx.translate(cx,cy+170); ctx.rotate(wob); ctx.translate(0,-170); ctx.fillStyle='#fffdf5'; ctx.beginPath(); ctx.ellipse(0,0,120,160,0,0,7); ctx.fill(); ctx.strokeStyle='#d7ccc8'; ctx.lineWidth=6; ctx.stroke(); ctx.fillStyle=col; [[-40,-60,18],[50,-20,22],[-20,50,16],[40,80,14],[-60,10,12]].forEach(p=>{ ctx.globalAlpha=.55; ctx.beginPath(); ctx.arc(p[0],p[1],p[2],0,7); ctx.fill(); }); ctx.globalAlpha=1;
      const cr=seg(t,1.2,3.4); if(cr>0){ ctx.strokeStyle='#3e2723'; ctx.lineWidth=5; ctx.beginPath(); const pts=[[-80,-20],[-40,-50],[-10,-10],[20,-55],[50,-15],[85,-45]]; const n=Math.ceil(pts.length*cr); pts.slice(0,n).forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); if(cr>.5){ ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-20,40); ctx.lineTo(10,80); ctx.stroke(); } }
      if(cr>.6){ glow(0,-10,150,'#fff',.8*(cr-.6)); } ctx.restore(); }
    txt('Da tut sich was …',W/2,110,56,'#fff',fade(t,.3,3.2,.5,.4));
    if(t>=3.5){ const k=seg(t,3.5,4.1); emo('🐣',cx,cy-20-Math.sin(k*3.14)*90,200*ease(k)+20,1); for(let i=0;i<24;i++){ const a=i/24*6.283, d=(t-3.5)*420; emo('✨',cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8,40,Math.max(0,1-(t-3.5)/1.2)); } confetti(t-3.5,50);
      txt('ES IST GESCHLÜPFT!',W/2,110,74,'#ffd54f',fade(t,3.7,6.5,.4,.4)); txt(String(o.label||'Ein neues Tier'),W/2,560,58,'#fff',fade(t,4.2,6.5,.4,.4)); if(o.rar) txt(o.rar,W/2,640,44,col,fade(t,4.6,6.5,.4,.4)); }
    flash(Math.max(0,1-Math.abs(t-3.5)*3)); }

  // ── Welt-Einführung (6 s) ──
  function world(t,o){ const pirate=o.w==='pirate', k=seg(t,0,6);
    if(pirate){ sky('#7fd6ff','#bfeaff'); ctx.fillStyle='#ffe082'; ctx.beginPath(); ctx.arc(1050-k*60,150,70,0,7); ctx.fill(); ctx.fillStyle='#0277bd'; ctx.fillRect(0,400,W,320); ctx.strokeStyle='rgba(255,255,255,.65)'; ctx.lineWidth=4; for(let r=0;r<6;r++){ ctx.beginPath(); for(let x=0;x<=W;x+=20){ const y=430+r*50+Math.sin(x/60+t*2+r)*10; x?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke(); }
      emo('🏝️',200-k*120,400,150); emo('⛵',150+k*900,430+Math.sin(t*2)*10,220,1,Math.sin(t*2)*.06); emo('🐙',1100-k*80,520,110,seg(t,3,4)); emo('🦜',300+k*500,200+Math.sin(t*4)*20,60);
      txt('PIRATEN-WELT',W/2,230,100,'#fff',fade(t,.6,6,.6,.5)); txt('Willkommen, Kapitän! ⚓',W/2,330,48,'#ffd54f',fade(t,1.4,6,.6,.5)); }
    else { sky('#ff8a65','#ffe0b2'); ctx.fillStyle='#7cb342'; ctx.fillRect(0,560,W,160); ctx.strokeStyle='#d32f2f'; ctx.lineWidth=12; ctx.beginPath(); for(let x=-40;x<=W+40;x+=10){ const y=470-Math.abs(Math.sin((x+k*200)/170))*250; x<=-40?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke();
      const cx=((t*220)%1300)-20; emo('🚃',cx,470-Math.abs(Math.sin((cx+k*200)/170))*250-22,80); emo('🎡',1000-k*120,430,240); emo('🎪',160-k*60,500,130); emo('🎈',640+Math.sin(t)*30,230,70); emo('🌭',520,600,60);
      txt('FREIZEITPARK',W/2,150,100,'#fff',fade(t,.6,6,.6,.5)); txt('Willkommen, Parkdirektor! 🎟️',W/2,250,48,'#fff',fade(t,1.4,6,.6,.5)); }
    confetti(t,30); }

  // ── Admin-Ankündigung (7 s) ──
  function announce(t,o){ sky('#1a0033','#4a148c'); stars(t,100); glow(W/2,300,420,'#ffd54f',.18+.08*Math.sin(t*3)); const s=ease(seg(t,.2,1.4)); emo(o.icon||'📣',W/2,230,170*s+10,fade(t,.1,7,.4,.6),Math.sin(t*2)*.08);
    for(let i=0;i<14;i++){ const a=i/14*6.283+t*.4; emo('✨',W/2+Math.cos(a)*(250+Math.sin(t*2+i)*20),270+Math.sin(a)*140,36,.7*fade(t,1,7,.5,.6)); }
    const full=String(o.title||'Ankündigung'); const n=Math.floor(clamp((t-1.2)/1.6,0,1)*full.length); txt(full.slice(0,n),W/2,400,Math.min(80,1500/Math.max(8,full.length)),'#ffd54f',fade(t,1.2,7,.2,.6));
    wrap(o.text||'',W/2,455,900,36,'#fff',fade(t,2.6,7,.6,.6)); txt('— Das Admin-Team 🛡️',W/2,650,34,'#9ad',fade(t,3.6,7,.6,.6),{}); confetti(t,t>2?30:0); }

  // ── Achterbahn-Premiere (6,5 s) ──
  function coaster(t,o){ sky('#4fc3f7','#e1f5fe'); ctx.fillStyle='#7cb342'; ctx.fillRect(0,580,W,140); const pr=seg(t,.3,3.5);
    ctx.strokeStyle='#d32f2f'; ctx.lineWidth=12; ctx.beginPath(); const f=x=>470-Math.abs(Math.sin(x/150))*230-Math.sin(x/47)*20; for(let x=60;x<=60+pr*1160;x+=8){ x===60?ctx.moveTo(x,f(x)):ctx.lineTo(x,f(x)); } ctx.stroke();
    ctx.lineWidth=3; for(let x=80;x<60+pr*1160;x+=70){ ctx.beginPath(); ctx.moveTo(x,f(x)); ctx.lineTo(x,580); ctx.stroke(); }
    const cx=60+pr*1160; if(t>3.4){ const k=((t-3.4)*300)%1160; emo('🚃',60+k,f(60+k)-24,90); } else emo('🏗️',cx,f(cx)-30,80);
    emo('🎡',1130,470,200); emo('🎪',90,520,110);
    txt('NEUE ACHTERBAHN!',W/2,110,84,'#fff',fade(t,.2,6.5,.5,.5)); txt('„'+(o.n||'Achterbahn')+'“',W/2,215,64,'#ffd54f',fade(t,1.4,6.5,.5,.5)); txt('gebaut von '+(o.by||'?'),W/2,300,44,'#263238',fade(t,2.2,6.5,.5,.5),{}); if(t>3.4) confetti(t,40); }

  // ── Tutorial-Clips (je 9 s) ──
  function clip(t,o){ const k=o.key;
    if(k==='breed'){ sky('#2e7d32','#a5d6a7'); ctx.fillStyle='#795548'; ctx.fillRect(0,560,W,160); const m=seg(t,0,3); emo('🐱',150+ease(m)*370,520,130); emo('🐶',1130-ease(m)*370,520,130,1,0); ctx.fillStyle='#37474f'; ctx.fillRect(540,350,200,230); ctx.fillStyle='#b0bec5'; ctx.fillRect(560,370,160,100); emo('🧬',640,420,90,1,Math.sin(t*6)*.2*seg(t,3,5.5));
      if(t>3&&t<5.5){ glow(640,420,200,'#69f0ae',.6); emo('✨',640+Math.sin(t*9)*100,330,60); }
      if(t>5.5){ const e=ease(seg(t,5.5,6.5)); emo('🦊',640,640-e*160-Math.sin(e*3.14)*60,150*e+10); flash(Math.max(0,1-(t-5.5)*4)); confetti(t-5.5,35); }
      txt('Zwei Tiere in die Zucht-Maschine …',W/2,90,52,'#fff',fade(t,.2,5.5,.5,.4)); txt('… und ein NEUES Tier kommt heraus!',W/2,90,52,'#ffd54f',fade(t,5.6,9,.5,.5)); }
    else if(k==='gold'){ sky('#4a148c','#1a237e'); stars(t,60); ctx.fillStyle='#37474f'; ctx.fillRect(500,330,280,300); ctx.fillStyle='#ffd54f'; ctx.fillRect(520,350,240,90); emo('⚗️',640,400,100,1,Math.sin(t*5)*.1);
      const m=seg(t,.5,3); emo('🐱',150+ease(m)*370,600,130,1-seg(t,3,3.6)); if(t<3.4) emo('🪙',250+ease(m)*300,430-Math.sin(m*3.14)*160,60);
      if(t>3){ glow(640,500,260,'#ffd54f',.7*seg(t,3,4.5)); } if(t>4.5){ const e=ease(seg(t,4.5,5.5)); glow(640,560,160,'#ffd54f',.9); emo('🐱',640+(1-e)*0,560-e*40,150+e*30); emo('✨',520,480+Math.sin(t*6)*10,60); emo('✨',770,500+Math.cos(t*6)*10,60); flash(Math.max(0,1-(t-4.5)*4)); }
      txt('Ein Tier + Mischtaler in die Gold-Maschine …',W/2,90,48,'#fff',fade(t,.2,4.5,.5,.4)); txt('… und es wird VERGOLDET: mehr Geld! 💰',W/2,90,52,'#ffd54f',fade(t,4.6,9,.5,.5)); }
    else if(k==='egg'){ sky('#26c6da','#b2ebf2'); ctx.fillStyle='#546e7a'; ctx.fillRect(500,500,280,90); ctx.fillStyle='rgba(187,228,255,.45)'; ctx.beginPath(); ctx.arc(640,500,160,Math.PI,0); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.stroke();
      const inE=ease(seg(t,.3,1.8)); if(t<5.6) emo('🥚',640,430+(1-inE)*-200,110,1,Math.sin(t*10)*.1*seg(t,4,5.6)); const hrs=Math.floor(24*seg(t,2,5)); emo('⏰',1020,200,120,fade(t,1.8,5.8,.3,.3)); txt(hrs+' Std.',1020,300,46,'#fff',fade(t,1.8,5.8,.3,.3));
      if(t>=5.6){ const e=ease(seg(t,5.6,6.6)); emo('🦄',640,470-e*60,140*e+10); flash(Math.max(0,1-(t-5.6)*4)); confetti(t-5.6,40); }
      txt('Ei in die Brut-Kuppel legen …',W/2,90,52,'#263238',fade(t,.2,2.5,.4,.3),{}); txt('Warten (1–24 Std.) …',W/2,90,52,'#263238',fade(t,2.5,5.6,.4,.3),{}); txt('… ein seltenes Tier schlüpft!',W/2,90,52,'#c2185b',fade(t,5.7,9,.5,.5),{}); }
    else if(k==='coaster'){ sky('#e3f2fd','#bbdefb'); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=2; for(let x=0;x<=W;x+=60){ ctx.beginPath(); ctx.moveTo(x,160); ctx.lineTo(x,620); ctx.stroke(); } for(let y=160;y<=620;y+=60){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      const P=[[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],[18,7],[18,6],[18,5],[17,5],[16,5],[15,5],[14,5],[13,5],[12,5],[11,5],[10,5],[9,5],[8,5],[7,5],[6,5],[5,5],[4,5],[3,5],[3,6],[3,7]]; const n=Math.floor(P.length*seg(t,.5,6)); P.slice(0,n).forEach((p,i)=>{ ctx.fillStyle=i%9===0?'#ffb300':'#e53935'; ctx.fillRect(p[0]*60+4,p[1]*60+4,52,52); }); if(n>=P.length){ emo("✅",640,230,110); emo("🎢",640+Math.sin(t*3)*20,590,100); }
      txt('Teil für Teil bauen: Gerade, Kurve, Hoch, Looping …',W/2,90,40,'#263238',fade(t,.2,6.2,.5,.4),{}); txt('Am Ende muss die Bahn wieder am Start ankommen!',W/2,90,40,'#2e7d32',fade(t,6.3,9,.5,.5),{}); }
    else if(k==='skill'){ sky('#0d3b2a','#1b5e20'); stars(t,40); emo('🌳',640,380,280); const br=[['🏪',300,300],['🍀',980,300],['🧭',300,520],['⏰',980,520]]; br.forEach((b,i)=>{ const a=seg(t,1+i*1.4,2+i*1.4); ctx.strokeStyle='rgba(125,255,176,'+a+')'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(640,400); ctx.lineTo(b[1],b[2]); ctx.stroke(); glow(b[1],b[2],130,'#7dffb0',.5*a); emo(b[0],b[1],b[2],110*a+10,.3+.7*a); });
      txt('5 Fähigkeitspunkte pro Rebirth',W/2,90,52,'#fff',fade(t,.2,9,.5,.5)); txt('Vier Äste – du entscheidest!',W/2,660,46,'#ffd54f',fade(t,5.5,9,.5,.5)); }
    else { sky('#222','#444'); txt('…',W/2,H/2,80,'#fff',1); } }

  const SC={egg:[6.5,egg],world:[6,world],announce:[7,announce],coaster:[6.5,coaster],clip:[9,clip]};
  function play(name,o){ o=o||{}; const sc=SC[name]; if(!sc||document.getElementById('zcine-ov')){ try{ o.done&&o.done(); }catch(e){} return; }
    const ov=document.createElement('div'); ov.id='zcine-ov'; ov.style.cssText='position:fixed;inset:0;z-index:100001;background:#000;display:flex;align-items:center;justify-content:center';
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H; cv.style.cssText='max-width:100vw;max-height:100vh;aspect-ratio:16/9;width:100%;object-fit:contain'; ov.appendChild(cv);
    const sk=document.createElement('button'); sk.textContent='Überspringen ⏭'; sk.style.cssText='position:absolute;top:12px;right:12px;padding:8px 14px;border:none;border-radius:20px;background:rgba(255,255,255,.2);color:#fff;font:700 .8rem Arial;cursor:pointer'; ov.appendChild(sk); document.body.appendChild(ov);
    ctx=cv.getContext('2d'); const t0=performance.now(); let on=true;
    const fin=()=>{ if(!on) return; on=false; try{ ov.remove(); }catch(e){} try{ o.done&&o.done(); }catch(e){ console.warn(e); } };
    sk.onclick=fin;
    const loop=()=>{ if(!on) return; const t=(performance.now()-t0)/1000; if(t>=sc[0]){ fin(); return; } try{ ctx=cv.getContext('2d'); ctx.clearRect(0,0,W,H); ctx.save(); sc[1](t,o); ctx.restore(); const a=Math.min(seg(t,0,.4),1-seg(t,sc[0]-.4,sc[0])); ctx.fillStyle='rgba(0,0,0,'+(1-a)+')'; ctx.fillRect(0,0,W,H); }catch(e){ console.warn('[cine]',e); fin(); return; } requestAnimationFrame(loop); };
    requestAnimationFrame(loop); }

  // ── Admin-Ankündigung senden + Empfang, Achterbahn-Premiere Empfang ──
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const me=()=>{ try{ return String(ZS.player||''); }catch(e){ return ''; } };
  const seen=(k,v)=>{ try{ const key='zcine_'+k+'_'+me(); if(v===undefined) return localStorage.getItem(key); localStorage.setItem(key,v); }catch(e){} };
  const isAdm=()=>{ try{ return !!(ZS.isAdmin||['bu:)','bu:3'].includes(me().toLowerCase())||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)); }catch(e){ return false; } };
  const queue=[]; let busy=false; const run=()=>{ if(busy||!queue.length||document.getElementById('zcine-ov')) return; busy=true; const q=queue.shift(); play(q[0],Object.assign({},q[1],{done:()=>{ busy=false; setTimeout(run,600); }})); };
  const enq=(n,o)=>{ queue.push([n,o]); run(); };
  const Z=window.ZCine={ play, enq,
    admin(){ if(!isAdm()) return; const old=document.getElementById('zcine-adm'); if(old) old.remove(); const o=document.createElement('div'); o.id='zcine-adm'; o.style.cssText='position:fixed;inset:0;z-index:10040;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:12px';
      o.innerHTML='<div style="background:#1b1030;border:2px solid #8e24aa;border-radius:16px;padding:14px;max-width:400px;width:100%;color:#fff;font-family:Arial"><div style="font:900 1.1rem Arial;color:#ffd54f;margin-bottom:8px">📣 Film-Ankündigung an alle</div><input id="zca-i" value="📣" maxlength="4" style="width:60px;padding:8px;border-radius:8px;border:none;font-size:1.2rem;text-align:center"> <input id="zca-t" placeholder="Titel (z.B. Neues Update!)" maxlength="40" style="width:calc(100% - 80px);padding:8px;border-radius:8px;border:none;box-sizing:border-box"><textarea id="zca-x" placeholder="Text (max. 160 Zeichen)" maxlength="160" style="width:100%;height:80px;margin-top:6px;padding:8px;border-radius:8px;border:none;box-sizing:border-box"></textarea><div style="display:flex;gap:6px;margin-top:8px"><button id="zca-p" style="flex:1;padding:9px;border:none;border-radius:10px;background:#455a64;color:#fff;font-weight:900">▶ Vorschau</button><button id="zca-s" style="flex:1;padding:9px;border:none;border-radius:10px;background:#2e7d32;color:#fff;font-weight:900">📤 An alle senden</button><button id="zca-x2" style="padding:9px 12px;border:none;border-radius:10px;background:#b71c1c;color:#fff;font-weight:900">✕</button></div></div>'; document.body.appendChild(o);
      const g=()=>({icon:o.querySelector('#zca-i').value||'📣',title:o.querySelector('#zca-t').value||'Ankündigung',text:o.querySelector('#zca-x').value});
      o.querySelector('#zca-p').onclick=()=>play('announce',g()); o.querySelector('#zca-x2').onclick=()=>o.remove();
      o.querySelector('#zca-s').onclick=()=>{ const r=RT(); if(!r) return alert('Keine Cloud-Verbindung.'); const v=g(); v.at=Date.now(); v.by=me(); v.id='a'+v.at; r.ref('zoo_announce/cur').set(v).then(()=>{ o.remove(); try{ ZP.toast('📤 Gesendet!',2500); }catch(e){} }).catch(()=>alert('Senden fehlgeschlagen.')); }; } };
  let hk=0; const init=()=>{ try{ const r=RT(); if(!r||typeof ZS==='undefined'||!ZS.player){ if(++hk<120) setTimeout(init,2000); return; }
    if(!Z._ls){ Z._ls=1;
    r.ref('zoo_announce/cur').on('value',s=>{ const v=s.val(); if(!v||!v.id||seen('ann')===v.id) return; seen('ann',v.id); if(Date.now()-v.at<15*60000) enq('announce',v); });
    r.ref('zoo_park/premiere').on('value',s=>{ const v=s.val(); if(!v||!v.id||seen('prem')===v.id) return; seen('prem',v.id); if(Date.now()-v.at<10*60000&&window.ZPark&&ZPark.has&&ZPark.has()&&String(v.by).toLowerCase()!==me().toLowerCase()) enq('coaster',v); });
    }
    if(window.ZMenu&&!Z._me){ Z._me=1; const E=ZMenu.entries; E.push({id:'announce',ic:'📣',n:'Film-Ankündigung',d:'Nur Admin: Animation an alle senden',since:'n814',show:()=>isAdm(),go:()=>Z.admin()}); }
    // Welt-Einführung beim ersten Betreten
    [['ZPirate','pirate'],['ZPark','park']].forEach(a=>{ const M=window[a[0]]; if(M&&M.openWorld&&!M._cw){ M._cw=1; const o=M.openWorld; M.openWorld=function(){ const args=arguments, self=this; if(seen('w_'+a[1])||!(M.has&&M.has())){ return o.apply(self,args); } seen('w_'+a[1],'1'); play('world',{w:a[1],done:()=>{ o.apply(self,args); }}); }; } });
    if(!(window.ZPirate&&ZPirate.openWorld&&ZPirate._cw&&window.ZPark&&ZPark.openWorld&&ZPark._cw)&&++hk<120) setTimeout(init,2000);
  }catch(e){ if(++hk<120) setTimeout(init,2000); } };
  setTimeout(init,3000);
})();
