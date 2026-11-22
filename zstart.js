/* ZStart (v878): einheitliches Start-Design (Intro-Look: Weltraum, Erde-Glanz, Gold) für Startseite, Charakter-Wahl, Profil, Login. */
(function(){
  'use strict';
  const css=`
  body.zstheme{background:#02040c !important;--text-dark:#f2f4ff;--text-mid:#b4bdd8;--mountain-dark:#e9c46a}
  body.zstheme .mountain-bg{display:none !important}
  #zs-bg{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:none}
  body.zstheme #zs-bg{display:block}
  body.zstheme #app,body.zstheme .page{position:relative;z-index:1}
  body.zstheme .game-logo .logo-emoji{display:none}
  body.zstheme .game-logo h1{font-family:"Trajan Pro","Cinzel",Georgia,"Times New Roman",serif !important;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:2.1rem;text-shadow:none;background:linear-gradient(180deg,#fff 0%,#e9c46a 45%,#b8860b 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 2px 8px rgba(233,196,106,.35))}
  body.zstheme .game-logo .subtitle{color:#e9c46a;letter-spacing:.28em;font-size:.72rem;text-transform:uppercase;font-weight:700}
  body.zstheme .game-logo p{color:rgba(233,196,106,.45) !important}
  body.zstheme .card{background:linear-gradient(160deg,rgba(14,22,46,.82),rgba(6,10,24,.88)) !important;border:1px solid rgba(233,196,106,.38) !important;border-radius:20px !important;box-shadow:0 10px 40px rgba(0,0,0,.6),0 0 30px rgba(233,196,106,.08) !important;backdrop-filter:blur(10px);color:#eef}
  body.zstheme .card-title{font-family:"Trajan Pro","Cinzel",Georgia,serif !important;color:#e9c46a !important;background:none !important;-webkit-text-fill-color:#e9c46a !important;letter-spacing:.04em;font-size:1.5rem}
  body.zstheme .card-subtitle{color:#b4bdd8 !important}
  body.zstheme .input-group label{color:#e9c46a !important;letter-spacing:.14em}
  body.zstheme .input-group input,body.zstheme .input-group select{background:rgba(255,255,255,.07) !important;border:1px solid rgba(233,196,106,.35) !important;color:#fff !important;border-radius:12px}
  body.zstheme .input-group input::placeholder{color:rgba(255,255,255,.35)}
  body.zstheme .input-group input:focus{border-color:#e9c46a !important;box-shadow:0 0 0 3px rgba(233,196,106,.2)}
  body.zstheme .btn-primary{background:linear-gradient(180deg,#f2d27a,#c9972a) !important;color:#1a1204 !important;font-weight:800;box-shadow:0 6px 22px rgba(233,196,106,.35) !important;border:none}
  body.zstheme .btn-secondary{background:rgba(255,255,255,.06) !important;color:#e9c46a !important;border:1px solid rgba(233,196,106,.55) !important;box-shadow:none !important}
  body.zstheme .char-card{background:rgba(255,255,255,.06) !important;border:1px solid rgba(233,196,106,.25) !important}
  body.zstheme .char-card .char-name{color:#cfd6ee !important}
  body.zstheme .char-card:hover{border-color:#e9c46a !important}
  body.zstheme .char-card.selected{background:rgba(233,196,106,.16) !important;border-color:#e9c46a !important;box-shadow:0 0 0 3px rgba(233,196,106,.28) !important}
  body.zstheme .color-dot.selected{outline:3px solid #e9c46a}
  body.zstheme #p-agerange button{background:rgba(255,255,255,.06) !important;border:1px solid rgba(233,196,106,.3) !important;color:#e8ecfa !important}
  body.zstheme #p-agerange button.zs-on{background:rgba(233,196,106,.2) !important;border-color:#e9c46a !important;color:#fff !important}
  body.zstheme .card button[onclick*="showWelcome"],body.zstheme .card button[onclick*="showCharSelect()"]:not(.btn){color:#e9c46a}
  body.zstheme .card button[onclick*="openadmin"],body.zstheme .card button[onclick*="showGlobalLeaderboard"],body.zstheme .card button[onclick*="showQR"]{opacity:.55}
  body.zstheme .card button[onclick*="openadmin"]{display:none}
  body.zstheme #p-err,body.zstheme #l-err{color:#ff8a80 !important}
  body.zstheme .card div[style*="border-left:4px solid #27AE60"]{display:none}
  body.zstheme .card button[onclick*="ZTrailer"]{background:rgba(255,255,255,.06) !important;border:1px solid rgba(233,196,106,.55) !important;color:#e9c46a !important;font-weight:700 !important}
  body.zstheme .game-logo{margin-top:6px}
  body.zstheme .card{box-sizing:border-box;max-width:calc(100vw - 20px)}
  body.zstheme .char-grid{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
  body.zstheme .char-card .char-name{font-size:.62rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  let cv=null, drawn=false;
  function paint(){
    if(!cv) return; const w=cv.width=innerWidth, h=cv.height=innerHeight, x=cv.getContext('2d'), m=Math.min(w,h);
    x.fillStyle='#02040c'; x.fillRect(0,0,w,h);
    let g=x.createRadialGradient(w*.55,h*.35,0,w*.55,h*.35,m*1.1); g.addColorStop(0,'#0d1a35'); g.addColorStop(1,'#02040c'); x.fillStyle=g; x.fillRect(0,0,w,h);
    for(let i=0;i<190;i++){ const a=.2+Math.random()*.7; x.fillStyle='rgba(255,255,'+(205+Math.floor(Math.random()*50))+','+a+')'; const s=Math.random()<.08?2:1; x.fillRect(Math.random()*w,Math.random()*h,s,s); }
    // Erde als Bogen unten, Sonnenaufgang rechts
    const R=m*1.25, ex=w*.3, ey=h+R*.8; g=x.createRadialGradient(ex,ey,R*.9,ex,ey,R*1.12); g.addColorStop(0,'rgba(90,150,255,.55)'); g.addColorStop(.4,'rgba(60,110,230,.18)'); g.addColorStop(1,'rgba(40,80,200,0)'); x.fillStyle=g; x.beginPath(); x.arc(ex,ey,R*1.12,0,7); x.fill();
    g=x.createRadialGradient(ex,ey-R*.2,R*.5,ex,ey,R); g.addColorStop(0,'#16346a'); g.addColorStop(1,'#07122b'); x.fillStyle=g; x.beginPath(); x.arc(ex,ey,R,0,7); x.fill();
    const sx=w*.92, sy=h*.94-m*.06; g=x.createRadialGradient(sx,sy,0,sx,sy,m*.55); g.addColorStop(0,'rgba(255,240,205,.85)'); g.addColorStop(.1,'rgba(255,200,130,.4)'); g.addColorStop(1,'rgba(255,140,60,0)'); x.globalCompositeOperation='lighter'; x.fillStyle=g; x.fillRect(0,0,w,h); x.globalCompositeOperation='source-over';
    const v=x.createRadialGradient(w/2,h/2,m*.4,w/2,h/2,Math.max(w,h)*.8); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.65)'); x.fillStyle=v; x.fillRect(0,0,w,h);
  }
  function sync(){
    const on=!!document.querySelector('#app .page[data-zs]');
    if(on&&!cv){ cv=document.createElement('canvas'); cv.id='zs-bg'; document.body.insertBefore(cv,document.body.firstChild); paint(); window.addEventListener('resize',paint); }
    document.body.classList.toggle('zstheme',on);
    if(on&&cv&&(cv.width!==innerWidth)) paint();
  }
  const boot=()=>{ const app=document.getElementById('app'); if(!app) return setTimeout(boot,100); new MutationObserver(sync).observe(app,{childList:true}); sync(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  // Altersknopf-Markierung (App._pickAgeRange setzt Inline-Stile → Klasse zusätzlich)
  document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('#p-agerange button'); if(!b) return; document.querySelectorAll('#p-agerange button').forEach(x=>x.classList.toggle('zs-on',x===b)); },true);
})();
