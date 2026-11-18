/* ═══ ZTrailer (v809): 🎬 Mischa-Trailer – Canvas-Film (~2:40), abspielbar + als Video herunterladbar ═══ */
(function(){
  if(window.ZTrailer) return;
  const W=1280,H=720,DUR=104;
  const TEAM=[
    {n:'Bu:)',r:'ADMIN · ERFINDER · „SCHWAMM“',d:'Hat das Spiel erfunden, baut jeden Tag Neues ein und saugt jeden Streit auf wie ein Schwamm – damit alle wieder Freunde sind.',c:'#e53935'},
    {n:'Andi5',r:'ADMIN',d:'Wacht über die Regeln und greift sofort ein, wenn jemand unfair ist.',c:'#1e88e5'},
    {n:'j.t',r:'SPIELER · FREUND',d:'Spielt von Anfang an mit, testet alles und hilft den Neuen beim Start.',c:'#43a047'}
  ];
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
  const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  const rnd=n=>{ const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); };
  const fade=(t,a,b,fi,fo)=>Math.min(seg(t,a,a+fi),1-seg(t,b-fo,b));
  let ctx;
  function sky(c1,c2){ const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,c1); g.addColorStop(1,c2); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  function ground(col,y){ ctx.fillStyle=col; ctx.fillRect(0,y,W,H-y); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(0,y,W,7); }
  function stars(t,n){ for(let i=0;i<n;i++){ const x=rnd(i)*W,y=rnd(i+99)*H*.7,a=.4+.6*Math.abs(Math.sin(t*1.2+i)); ctx.fillStyle='rgba(255,255,255,'+a+')'; ctx.fillRect(x,y,2+rnd(i+5)*2,2+rnd(i+5)*2); } }
  function snow(t,n,a){ ctx.fillStyle='rgba(255,255,255,'+(a==null?.85:a)+')'; for(let i=0;i<n;i++){ const x=(rnd(i)*W+Math.sin(t+i)*30+W)%W, y=(rnd(i+50)*H+t*(40+rnd(i+9)*60))%H; ctx.beginPath(); ctx.arc(x,y,1.5+rnd(i+3)*2.5,0,7); ctx.fill(); } }
  function rain(t,n,a){ ctx.strokeStyle='rgba(170,200,255,'+a+')'; ctx.lineWidth=2; ctx.beginPath(); for(let i=0;i<n;i++){ const x=(rnd(i)*W)%W, y=(rnd(i+50)*H+t*900)%H; ctx.moveTo(x,y); ctx.lineTo(x-6,y+22); } ctx.stroke(); }
  function txt(s,x,y,size,col,a,opt){ opt=opt||{}; if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font=(opt.w||'900')+' '+size+'px Arial Black, Arial, sans-serif'; ctx.textAlign=opt.al||'center'; ctx.textBaseline='middle'; if(opt.sh!==0){ ctx.lineWidth=size/6; ctx.strokeStyle=opt.st||'rgba(0,0,0,.75)'; ctx.lineJoin='round'; ctx.strokeText(s,x,y); } ctx.fillStyle=col; ctx.fillText(s,x,y); ctx.restore(); }
  function emo(e,x,y,s,a){ ctx.save(); ctx.globalAlpha=a==null?1:a; ctx.font=s+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e,x,y); ctx.restore(); }
  // Männchen: x,y = Fuss-Mitte
  function fig(x,y,s,o){ o=o||{}; const t=o.t||0, col=o.col||'#ff9800', bob=o.walk?Math.abs(Math.sin(t*8))*6*s:0, sw=o.walk?Math.sin(t*8)*.6:0, hy=o.sad?10*s:0;
    ctx.save(); ctx.translate(x,y-bob); const L=(a,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(-w/2,-h,w,h); };
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0,bob,34*s,8*s,0,0,7); ctx.fill();
    ctx.save(); ctx.translate(-12*s,-62*s); ctx.rotate(sw); ctx.fillStyle=o.suit||'#37474f'; ctx.fillRect(-7*s,0,14*s,62*s); ctx.restore();
    ctx.save(); ctx.translate(12*s,-62*s); ctx.rotate(-sw); ctx.fillStyle=o.suit||'#37474f'; ctx.fillRect(-7*s,0,14*s,62*s); ctx.restore();
    ctx.fillStyle=col; ctx.fillRect(-24*s,-130*s+hy,48*s,72*s);
    const arm=(sx,ang)=>{ ctx.save(); ctx.translate(sx*s,-122*s+hy); ctx.rotate(ang); ctx.fillStyle=col; ctx.fillRect(-6*s,0,12*s,54*s); ctx.fillStyle='#ffcc99'; ctx.fillRect(-6*s,50*s,12*s,12*s); ctx.restore(); };
    arm(-30,(o.up?-2.6:sw*-1)+(o.sad?.12:0)); arm(30,(o.up?2.6:sw)-(o.sad?.12:0));
    ctx.fillStyle='#ffcc99'; ctx.beginPath(); ctx.arc(0,-152*s+hy*1.6,26*s,0,7); ctx.fill();
    if(o.hat){ ctx.fillStyle=o.hat; ctx.fillRect(-26*s,-182*s+hy*1.6,52*s,12*s); ctx.fillRect(-16*s,-200*s+hy*1.6,32*s,20*s); }
    const hyy=-152*s+hy*1.6; ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(-9*s,hyy-3*s,3.4*s,0,7); ctx.arc(9*s,hyy-3*s,3.4*s,0,7); ctx.fill();
    ctx.strokeStyle='#222'; ctx.lineWidth=3*s; ctx.beginPath();
    if(o.mood==='sad'){ ctx.arc(0,hyy+18*s,9*s,Math.PI*1.1,Math.PI*1.9); }
    else if(o.mood==='laugh'){ ctx.fillStyle='#7a1f1f'; ctx.arc(0,hyy+8*s,10*s,0,Math.PI); ctx.fill(); }
    else { ctx.arc(0,hyy+6*s,10*s,.15*Math.PI,.85*Math.PI); }
    ctx.stroke();
    if(o.sad){ ctx.fillStyle='#4fc3f7'; const ty=((t*60)%40); ctx.beginPath(); ctx.ellipse(-12*s,hyy+6*s+ty*s*.5,3*s,5*s,0,0,7); ctx.fill(); }
    if(o.dots){ ctx.fillStyle='#2979ff'; [[0,-152],[-24,-122],[24,-122],[-30,-66],[30,-66],[0,-100],[-12,-30],[12,-30],[-12,-4],[12,-4]].forEach(p=>{ ctx.beginPath(); ctx.arc(p[0]*s,p[1]*s+(p[1]<-60?hy:0),5*s,0,7); ctx.fill(); }); }
    ctx.restore(); }
  function bubble(s,x,y,a){ if(a<=0) return; ctx.save(); ctx.globalAlpha=a; ctx.font='900 26px Arial'; const w=ctx.measureText(s).width+36; ctx.fillStyle='#fff'; ctx.strokeStyle='#222'; ctx.lineWidth=4; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-w/2,y-30,w,56,16):ctx.rect(x-w/2,y-30,w,56); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x-8,y+26); ctx.lineTo(x,y+46); ctx.lineTo(x+12,y+26); ctx.fill(); ctx.fillStyle='#222'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(s,x,y-2); ctx.restore(); }
  function pen(x,y,w,h,col){ ctx.strokeStyle=col||'#8d6e63'; ctx.lineWidth=5; ctx.fillStyle='rgba(120,200,90,.55)'; ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h); ctx.beginPath(); for(let i=1;i<5;i++){ ctx.moveTo(x+w*i/5,y); ctx.lineTo(x+w*i/5,y+h);} ctx.lineWidth=2; ctx.stroke(); }
  function counter(v){ const e=Math.floor(Math.log10(Math.max(1,v))); const m=v/Math.pow(10,e); return e<4?Math.floor(v).toLocaleString('de-CH'):m.toFixed(2)+'×10^'+e; }
  function vig(a){ const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+a+')'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  function bars(p){ ctx.fillStyle='#000'; const h=44*p; ctx.fillRect(0,0,W,h); ctx.fillRect(0,H-h,W,h); }

  function scene1(t){ sky('#050a24','#1b2a5a'); stars(t,120); const z=1.25-.25*ease(seg(t,0,9)); ctx.save(); ctx.translate(W/2,H/2); ctx.scale(z,z); ctx.translate(-W/2,-H/2);
    emo('🎮',W/2,190,110,fade(t,.5,12,1.5,1.5)); txt('MISCHA',W/2,320,120,'#ffd54f',fade(t,1.5,12,1.5,1.5)); txt('DENKSPIEL',W/2,445,120,'#69f0ae',fade(t,2.5,12,1.5,1.5)); ctx.restore();
    txt('E I N   T R A I L E R',W/2,560,34,'#fff',fade(t,5,12,1.5,1.5),{sh:0}); snow(t,90); }
  function scene2(t){ const u=t-12; sky('#7ec8ff','#e8f6ff'); ground('#cfe8f5',520); snow(t,70,.9); const px=-120+ease(seg(u,0,5))*560; fig(px,600,1.5,{col:'#ff9800',walk:u<5,t:t,mood:'happy'});
    txt('Ein neuer Spieler.',W/2,120,60,'#fff',fade(u,1,5,.6,.6)); txt('Ein leeres Stück Land.',W/2,120,60,'#fff',fade(u,6,10.5,.6,.6)); txt('Ein grosser Traum …',W/2,110,56,'#fff',fade(u,11,14,.6,.4)); txt('Baue deinen eigenen Zoo!',W/2,180,70,'#ffd54f',fade(u,13,16,.6,.6)); }
  function scene3(t){ const u=t-28, d=seg(u,0,22); sky(d>0?'rgb('+Math.round(126-80*d)+','+Math.round(200-130*d)+','+Math.round(255-120*d)+')':'#7ec8ff','rgb('+Math.round(232-130*d)+','+Math.round(246-150*d)+','+Math.round(255-120*d)+')'); ground('#b8cfdc',520); if(d>.25) rain(t,120,.5*d); else snow(t,50);
    const sad=u>4; fig(440,600,1.5,{col:'#ff9800',mood:sad?'sad':'happy',sad:sad,t:t});
    const B=[{x:760,c:'#e53935',s:'Hahaha!'},{x:900,c:'#8e24aa',s:'Du hast ja nix!'},{x:1040,c:'#00897b',s:'Das wird nie was!'},{x:1170,c:'#6d4c41',s:'Geh heim!'}];
    B.forEach((b,i)=>{ const e=ease(seg(u,1+i*.8,3+i*.8)); const bx=b.x+(1-e)*500; fig(bx,600,1.35,{col:b.c,mood:'laugh',t:t+i,up:Math.sin(t*5+i)>.6&&e>.9}); bubble(b.s,bx-20,380-(i%2)*55,e>.95?fade(u,4+i*3.4,7+i*3.4,.3,.4)*(u<20?1:0):0); });
    txt('Aber nicht alle sind nett …',W/2,110,56,'#fff',fade(u,.5,6,.6,.6)); txt('Er wird ausgelacht.',W/2,110,56,'#ffcdd2',fade(u,8,14,.6,.6)); txt('Niemand glaubt an ihn.',W/2,110,56,'#ffcdd2',fade(u,15,20,.6,.5)); txt('Er gibt nicht auf.',W/2,H/2-120,80,'#fff',fade(u,23,27,.8,.2)); vig(.35+.3*d); }
  function scene4(t){ const u=t-55; sky('#9be15d','#e6ffb3'); ground('#5fa140',540); const n=Math.floor(seg(u,2,22)*6);
    const slots=[[80,300],[330,300],[580,300],[830,300],[1080,300]]; slots.slice(0,Math.min(5,Math.ceil(n*.9))).forEach((s,i)=>{ const e=ease(seg(u,2+i*3.2,4+i*3.2)); ctx.save(); ctx.globalAlpha=e; ctx.translate(0,(1-e)*-60); pen(s[0],s[1]+110,180,120); ctx.restore(); });
    const an=['🐱','🐶','🦊','🐼','🦁','🐘'];  an.forEach((a,i)=>{ const e=seg(u,3+i*3,4+i*3); if(e>0){ const x=170+i*205, bounce=Math.sin(t*3+i)*8; emo(a,x>1180?1180:x,380+(i>4?0:0)+bounce,70*ease(e)); if(e<1) emo('✨',x,330,90,1-e); } });
    for(let i=0;i<12;i++){ const e=((u*.5+i/12)%1); if(u>3){ emo('🪙',110+rnd(i)*1050,330-e*220,40,1-e); } }
    fig(640,640,1.3,{col:'#ff9800',mood:'happy',t:t,up:Math.sin(t*4)>0,hat:'#fdd835'});
    txt(counter(Math.pow(10,seg(u,2,24)*17.8))+' MT',W/2,90,64,'#ffd54f',fade(u,2,25,.8,.8)); txt('Tier für Tier. Mischtaler für Mischtaler.',W/2,175,44,'#fff',fade(u,1,12,.6,.6)); txt('Und es geht immer weiter …',W/2,175,44,'#fff',fade(u,14,24,.6,.6)); }
  function lockSoon(v,d,col){ const f=fade(v,1.2,d,.5,.5); if(f<=0) return; ctx.save(); ctx.fillStyle='rgba(0,0,0,'+(.5*f)+')'; ctx.fillRect(W/2-300,330,600,210); emo('🔒',W/2,410,110,f*(1+.05*Math.sin(v*5))); txt('KOMMT BALD',W/2,510,52,col,f); ctx.restore(); }
  function scene5(t){ const u=t-80;
    if(u<8){ sky('#1a0033','#6a1b9a'); stars(t,80); ctx.save(); ctx.translate(W/2,350); ctx.rotate(t*.8); emo('🔄',0,0,230,1); ctx.restore(); txt('REBIRTH',W/2,110,80,'#ffd54f',fade(u,.3,8,.5,.5)); txt('Neu anfangen – und viel stärker werden',W/2,590,40,'#fff',fade(u,1,8,.5,.5)); txt('💰 Einkommen ×500',W/2,660,40,'#69f0ae',fade(u,2.5,8,.5,.5)); }
    else if(u<16){ const v=u-8; sky('#7fd6ff','#005f99'); ctx.fillStyle='#0277bd'; ctx.fillRect(0,420,W,300); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=4; for(let r=0;r<5;r++){ ctx.beginPath(); for(let x=0;x<=W;x+=20){ const y=440+r*55+Math.sin(x/60+t*2+r)*10; x?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke(); }
      const sx=200+v*100; ctx.save(); ctx.translate(sx,420+Math.sin(t*2)*10); ctx.rotate(Math.sin(t*2)*.06); emo('⛵',0,0,200,1); ctx.restore(); emo('🐙',1050+Math.sin(t)*10,500,130,seg(v,3,5)); emo('🍾',640,520+Math.sin(t*3)*8,60,1);
      txt('PIRATEN-WELT',W/2,110,80,'#fff',fade(v,.3,8,.5,.5)); txt('ab Rebirth 7',W/2,270,44,'#ffd54f',fade(v,.8,8,.5,.5)); lockSoon(v,8,'#ffd54f'); txt('Segle über das gemeinsame Meer',W/2,200,40,'#ffd54f',fade(v,1,8,.5,.5)); txt('Seeschlangen · Kraken · Schätze',W/2,640,40,'#fff',fade(v,2.5,8,.5,.5)); }
    else { const v=u-16; sky('#ff8a65','#ffe0b2'); ground('#7cb342',560); ctx.strokeStyle='#d32f2f'; ctx.lineWidth=12; ctx.beginPath(); for(let x=60;x<=1220;x+=10){ const y=450-Math.abs(Math.sin(x/170))*260; x===60?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke(); ctx.lineWidth=3; for(let x=80;x<1220;x+=80){ const y=450-Math.abs(Math.sin(x/170))*260; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,560); ctx.stroke(); }
      const cx=60+((v*160)%1160), cy=450-Math.abs(Math.sin(cx/170))*260; emo('🚃',cx,cy-22,70,1); emo('🎡',1100,430,200,1); emo('🎪',160,500,120,1); emo('🌭',420,590,60,1); emo('🎈',700+Math.sin(t)*20,210,70,1);
      txt('FREIZEITPARK',W/2,100,80,'#fff',fade(v,.3,9,.5,.5)); txt('ab Rebirth 8',W/2,260,44,'#fff',fade(v,.8,9,.5,.5)); lockSoon(v,9,'#fff'); txt('Baue Achterbahnen im eigenen Editor',W/2,190,40,'#fff',fade(v,1.5,9,.5,.5)); } }
  function scene6(t){ const u=t-105; sky('#ffe082','#fff8e1'); ground('#8bc34a',540); for(let i=0;i<30;i++){ ctx.fillStyle='rgba(255,215,0,'+(.3+.3*Math.sin(t*3+i))+')'; ctx.fillRect(rnd(i)*W,(rnd(i+7)*H+t*60)%H,6,6); }
    ['🐘','🦁','🐼','🦊','🐶','🐱'].forEach((a,i)=>emo(a,120+i*200,520+Math.sin(t*3+i)*6,90,1)); fig(640,600,1.6,{col:'#ff9800',mood:'happy',t:t,up:true,hat:'#fdd835'}); emo('👑',640,360+Math.sin(t*3)*6,70,1);
    const e=ease(seg(u,3,6)); [{x:180,c:'#e53935',s:'Wow! Das ist riesig!'},{x:1090,c:'#8e24aa',s:'Tut uns leid …'}].forEach((b,i)=>{ fig(b.x+(i?1:-1)*(1-e)*400,600,1.35,{col:b.c,mood:'happy',t:t+i}); bubble(b.s,b.x,400,e>.95?fade(u,6+i*2,10+i*2,.3,.4):0); });
    txt('Er hat alles geschafft.',W/2,110,64,'#4e342e',fade(u,.3,5,.6,.6),{st:'rgba(255,255,255,.8)'}); txt('Und die anderen? Sie staunen.',W/2,110,56,'#4e342e',fade(u,6,12,.6,.4),{st:'rgba(255,255,255,.8)'}); }
  function scene7(t){ const u=t-117; sky('#0d1b2a','#1b263b'); stars(t,60);
    if(u<4){ ctx.save(); ctx.translate(W/2,H/2); const s=1+.1*Math.sin(t*2); ctx.scale(s,s); emo('🛡️',0,-40,200,fade(u,0,4,.6,.6)); ctx.restore(); txt('DAS TEAM',W/2,520,90,'#ffd54f',fade(u,.4,4,.6,.6)); return; }
    const i=Math.min(2,Math.floor((u-4)/8.6)), m=TEAM[i], v=(u-4)-i*8.6, a=fade(v,0,8.6,.6,.5), e=ease(seg(v,0,.8));
    ctx.save(); ctx.globalAlpha=a; const g=ctx.createLinearGradient(0,0,W,0); g.addColorStop(0,'#0b2e33'); g.addColorStop(.55,'#12454d'); g.addColorStop(1,'#cfd8dc'); ctx.fillStyle=g; ctx.fillRect(80,130,1120,460); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(80,130,1120,460);
    ctx.fillStyle='rgba(255,255,255,.07)'; for(let k=0;k<7;k++) ctx.fillRect(700+k*70,130,3,460); ctx.restore();
    ctx.save(); ctx.translate((1-e)*-120,0); txt('M E E T',150,200,30,'#9ad',a,{al:'left',sh:0}); txt(m.n,150,290,m.n.length>6?100:130,'#fff',a,{al:'left'}); txt(m.r,150,380,m.r.length>20?27:36,m.c,a,{al:'left'});
    ctx.globalAlpha=a; ctx.font='500 28px Arial'; ctx.fillStyle='#e0f2f1'; ctx.textAlign='left'; ctx.textBaseline='top'; const words=m.d.split(' '); let line='',yy=425; words.forEach(w=>{ if(ctx.measureText(line+w).width>520){ ctx.fillText(line,150,yy); yy+=38; line=''; } line+=w+' '; }); ctx.fillText(line,150,yy); ctx.restore();
    ctx.save(); ctx.globalAlpha=a; ctx.translate((1-e)*160,0); ctx.beginPath(); ctx.rect(700,131,499,458); ctx.clip(); fig(950,572,2.1,{col:'#263238',suit:'#263238',dots:true,t:t,mood:'happy',up:i===0&&Math.sin(t*3)>0}); txt('12',1170,160,26,'#fff',1,{sh:0}); ctx.restore();
    ctx.globalAlpha=a; ctx.fillStyle=m.c; ctx.fillRect(80,590,1120*seg(v,0,8.6),8); ctx.globalAlpha=1; }
  function scene8(t){ const u=t-147; sky('#0d1b2a','#2e4a7d'); stars(t,100); snow(t,60,.7);
    txt('Bei uns wird niemand gemobbt.',W/2,200,66,'#fff',fade(u,.5,5.5,.8,.6)); emo('🛡️',W/2,380,170,fade(u,1.5,5.5,.8,.6)); txt('Dafür sorgt das wachsame Admin-Team.',W/2,560,46,'#ffd54f',fade(u,2,5.5,.8,.6));
    const v=u-5.5; if(v>0){ emo('🍀',W/2,200,150,fade(v,0,10,.8,1.8)); txt('VIEL GLÜCK!',W/2,360,130,'#69f0ae',fade(v,.5,10,.8,1.8)); txt('Mischa Denkspiel',W/2,500,56,'#ffd54f',fade(v,1.5,10,.8,1.8)); txt('Baue deinen eigenen Zoo.',W/2,580,40,'#fff',fade(v,2.2,10,.8,1.8)); } }
  const SC=[[0,12,scene1],[12,28,scene2],[28,55,scene3],[55,80,scene4],[80,105,scene5],[105,117,scene6],[117,147,scene7],[147,162,scene8]];
  // Zeitraffer-Tabelle: [echt von, echt bis, Szenenzeit von, Szenenzeit bis] – kürzt den Film auf 1:44
  const MAP=[[0,8,0,12],[8,18,12,28],[18,36,28,55],[36,45,55,80],[45,62,80,105],[62,70,105,117],[70,92,117,147],[92,104,147,162]];
  const tm=r=>{ for(const m of MAP){ if(r>=m[0]&&r<m[1]) return m[2]+(r-m[0])*(m[3]-m[2])/(m[1]-m[0]); } return 161.9; };
  function draw(t){ t=clamp(t,0,DUR-.001); const rt=t; t=tm(t); ctx.clearRect(0,0,W,H); for(const s of SC){ if(t>=s[0]&&t<s[1]){ ctx.save(); s[2](t); ctx.restore(); const dt=t-s[0]; if(dt<.7){ ctx.fillStyle='rgba(0,0,0,'+(1-dt/.7)+')'; ctx.fillRect(0,0,W,H); } if(s[1]-t<.5&&s[1]<DUR){ ctx.fillStyle='rgba(0,0,0,'+(1-(s[1]-t)/.5)+')'; ctx.fillRect(0,0,W,H); } break; } }
    vig(.35); bars(.7); if(rt>DUR-2){ ctx.fillStyle='rgba(0,0,0,'+clamp((rt-(DUR-2))/1.8,0,1)+')'; ctx.fillRect(0,0,W,H); } }

  const T=window.ZTrailer={ draw:t=>{ if(!ctx){ const c=document.createElement('canvas'); c.width=W; c.height=H; ctx=c.getContext('2d'); T._c=c; } draw(t); return T._c; }, DUR:DUR };
  function open(){ if(document.getElementById('ztr-ov')) return; const o=document.createElement('div'); o.id='ztr-ov'; o.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif';
    o.innerHTML='<canvas id="ztr-cv" width="'+W+'" height="'+H+'" style="max-width:100vw;max-height:calc(100vh - 70px);aspect-ratio:16/9;background:#000"></canvas><div style="display:flex;gap:8px;align-items:center;padding:8px;width:min(100vw,900px);box-sizing:border-box"><button id="ztr-pl" style="padding:8px 14px;border-radius:10px;border:none;font:900 15px Arial;background:#2e7d32;color:#fff">⏸</button><div id="ztr-bar" style="flex:1;height:14px;background:#333;border-radius:7px;cursor:pointer;position:relative"><div id="ztr-fill" style="height:100%;width:0;background:#ffd54f;border-radius:7px"></div></div><span id="ztr-tm" style="color:#fff;font-size:13px;min-width:80px;text-align:center">0:00</span><button id="ztr-dl" style="padding:8px 12px;border-radius:10px;border:none;font:900 14px Arial;background:#1565c0;color:#fff">⬇️ Video</button><button id="ztr-x" style="padding:8px 12px;border-radius:10px;border:none;font:900 14px Arial;background:#b71c1c;color:#fff">✕</button></div><div id="ztr-msg" style="color:#ffd54f;font-size:13px;min-height:18px"></div>';
    document.body.appendChild(o); const cv=o.querySelector('#ztr-cv'); ctx=cv.getContext('2d'); T._c=cv; const $=s=>o.querySelector(s);
    let t=0,last=performance.now(),playing=true,rec=null,raf=0,au=null,ac=null,dest=null,gn=null;
    try{ au=new Audio('music/m1.mp3'); au.loop=true; au.volume=.8; }catch(e){}
    const pa=()=>{ try{ au&&au.play().catch(()=>{}); }catch(e){} };
    const msg=s=>{ $('#ztr-msg').textContent=s||''; };
    const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
    function loop(now){ const dt=(now-last)/1000; last=now; if(playing) t+=dt; if(t>=DUR){ if(rec){ rec.stop(); } else { t=DUR-.001; playing=false; $('#ztr-pl').textContent='↺'; try{ au&&au.pause(); }catch(e){} } }
      const vol=clamp((DUR-t)/5,0,1); try{ if(au) au.volume=.8*vol; if(gn) gn.gain.value=vol; }catch(e){}
      draw(t); $('#ztr-fill').style.width=(t/DUR*100)+'%'; $('#ztr-tm').textContent=fmt(t)+' / '+fmt(DUR); raf=requestAnimationFrame(loop); }
    pa(); raf=requestAnimationFrame(loop);
    $('#ztr-pl').onclick=()=>{ if(rec) return; if(t>=DUR-.01){ t=0; try{ au.currentTime=0; }catch(e){} } playing=!playing; $('#ztr-pl').textContent=playing?'⏸':'▶'; try{ playing?pa():au.pause(); }catch(e){} };
    $('#ztr-bar').onclick=e=>{ if(rec) return; const r=e.currentTarget.getBoundingClientRect(); t=clamp((e.clientX-r.left)/r.width,0,.999)*DUR; try{ au.currentTime=t%(au.duration||1e9); }catch(er){} };
    function close(){ cancelAnimationFrame(raf); try{ au&&au.pause(); }catch(e){} try{ rec&&rec.state!=='inactive'&&(rec.onstop=null,rec.stop()); }catch(e){} try{ ac&&ac.close(); }catch(e){} o.remove(); }
    $('#ztr-x').onclick=close;
    $('#ztr-dl').onclick=()=>{ if(rec) return; if(!cv.captureStream||typeof MediaRecorder==='undefined') return msg('Dieser Browser kann kein Video aufnehmen – bitte Chrome oder Edge am Computer benutzen.');
      const mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m)); if(!mt) return msg('Video-Aufnahme wird hier nicht unterstützt.');
      const ms=cv.captureStream(30); try{ ac=new (window.AudioContext||window.webkitAudioContext)(); dest=ac.createMediaStreamDestination(); const src=ac.createMediaElementSource(au); gn=ac.createGain(); src.connect(gn); gn.connect(dest); gn.connect(ac.destination); dest.stream.getAudioTracks().forEach(tr=>ms.addTrack(tr)); }catch(e){ console.warn('[trailer] audio',e); }
      const chunks=[]; rec=new MediaRecorder(ms,{mimeType:mt,videoBitsPerSecond:5e6}); rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
      rec.onstop=()=>{ const ext=mt.indexOf('mp4')>=0?'mp4':'webm'; const b=new Blob(chunks,{type:mt.split(';')[0]}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='Mischa-Trailer.'+ext; document.body.appendChild(a); a.click(); setTimeout(()=>{ a.remove(); URL.revokeObjectURL(a.href); },4000); rec=null; msg('✅ Fertig – das Video wurde heruntergeladen.'); t=DUR-.001; playing=false; $('#ztr-pl').textContent='↺'; try{ au.pause(); }catch(e){} $('#ztr-dl').disabled=false; };
      t=0; playing=true; try{ au.currentTime=0; }catch(e){} pa(); rec.start(1000); $('#ztr-dl').disabled=true; msg('🔴 Nimmt auf … bitte warten, dauert so lange wie der Trailer (1:44). Fenster offen lassen!'); };
  }
  T.open=open;
})();
