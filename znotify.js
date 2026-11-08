/* ═══ ZNotify (v777): 🔔 Ereignis-Glocke – erinnert an fertige Eier, Wetter-Pause, Schatz-Insel, Arena, Turm, Schatzhügel ═══ */
(function(){
  'use strict';
  if(window.ZNotify) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined') return setTimeout(wait,2000); try{ init(); }catch(e){ console.warn('ZNotify',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ls=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
    const lsw=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
    const uk='_'+String(ZS.player).toLowerCase();
    const N=window.ZNotify={list:ls('zn_list'+uk,[]),seen:ls('zn_seen'+uk,[]),unread:ls('zn_unread'+uk,0),off:ls('zn_off'+uk,false)};
    const day=()=>new Date().toISOString().slice(0,10);
    N.add=function(key,ic,txt,place){ if(N.seen.includes(key)) return; N.seen.push(key); if(N.seen.length>80) N.seen.shift(); N.list.unshift({t:Date.now(),ic,x:txt,p:place||''}); if(N.list.length>25) N.list.pop(); N.unread++; N.save(); if(!N.off) try{ ZP.toast(ic+' '+txt,4500); }catch(e){} N.paint(); };
    N.save=function(){ lsw('zn_list'+uk,N.list); lsw('zn_seen'+uk,N.seen); lsw('zn_unread'+uk,N.unread); lsw('zn_off'+uk,N.off); };
    N.check=function(){ const z=zoo(); if(!z||!z.r6&&!z.sec) return; const now=Date.now(), s=z.sec||{}, r=z.r6||{}, has=(window.ZReb6&&ZReb6.has&&ZReb6.has());
      if(has){
        const e=r.egg; if(e&&e.slots) e.slots.forEach((sl,i)=>{ if(sl&&sl.until<=now) N.add('egg:'+sl.until,'🥚','Dein '+(sl.k==='meadow'?'Wiesen':sl.k==='mountain'?'Berg':'Sternen')+'-Ei ist fertig! Geh zur Brüterei.','Ei-Brüterei'); });
        const w=r.wx; if(w&&w.c&&w.c<=now) N.add('wx:'+w.c,'🌦️','Der Wetter-Meister ist wieder bereit!','');
        const isl=r.isl; if(isl&&s.isl&&isl.t) Object.keys(isl.t).forEach(i=>{ const t=isl.t[i]; if(t&&t<=now) N.add('isl:'+i+':'+t,'🏝️','Ein Schatz auf der Insel ist wieder da!','Schatz-Insel'); });
        const a=r.ar; if(s.arena&&(!a||a.d!==day()||(a.n||0)===0)) N.add('ar:'+day(),'⚔️','Die Arena hat heute neue Kämpfe für dich!','Tier-Arena');
        const t=r.tw; if(s.tower&&(!t||t.d!==day()||(t.used||0)===0)) N.add('tw:'+day(),'🗼','Du hast heute einen Versuch im Legenden-Turm!','Legenden-Turm');
      }
      Object.keys(s).forEach(k=>{ if(/^t\d+$/.test(k)&&typeof s[k]==='number'&&s[k]>1e12&&s[k]<=now) N.add('tre:'+k+':'+s[k],'⛏️','Ein Schatzhügel ist wieder bereit zum Graben!',''); }); };
    // ── Glocke ──
    const b=document.createElement('button'); b.id='zn-bell'; b.style.cssText='position:fixed;left:240px;bottom:12px;z-index:127;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:rgba(30,40,90,.85);color:#fff;font-size:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,.4)'; b.innerHTML='🔔<span id="zn-badge" style="display:none;position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:9px;background:#e53935;color:#fff;font:900 .7rem/18px Arial;text-align:center;padding:0 3px"></span>'; document.body.appendChild(b);
    N.paint=function(){ const g=$('zn-badge'); if(!g) return; g.style.display=N.unread>0?'block':'none'; g.textContent=N.unread>9?'9+':N.unread; };
    N.open=function(){ N.unread=0; N.save(); N.paint(); const old=$('zn-ov'); if(old) old.remove(); const o=document.createElement('div'); o.id='zn-ov'; o.style.cssText='position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px'; o.onclick=e=>{ if(e.target===o) o.remove(); };
      const f=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      o.innerHTML='<div style="background:linear-gradient(160deg,#1a237e,#283593);border:3px solid #ffd54f;border-radius:18px;padding:16px;max-width:380px;width:100%;color:#fff;text-align:center;font-family:Arial,sans-serif;max-height:90vh;overflow:auto"><div style="font-size:2rem">🔔</div><div style="font:900 1.1rem Arial;color:#ffd54f">Hinweise</div><div style="text-align:left;font-size:.84rem;margin:8px 0">'
        +(N.list.length?N.list.map((e,i)=>'<div style="padding:6px;border-top:1px solid rgba(255,255,255,.12)"><span style="opacity:.6;font-size:.7rem">'+f(e.t)+'</span><br>'+e.ic+' '+esc(e.x)+(e.p?' <button data-p="'+esc(e.p)+'" style="margin-left:6px;border:none;border-radius:8px;padding:3px 8px;background:#ffd54f;color:#3b2a10;font-weight:900;font-size:.72rem">🧭 Hin</button>':'')+'</div>').join(''):'<div style="padding:10px;opacity:.7">Keine neuen Hinweise. Ich sage dir Bescheid, wenn ein Ei fertig ist oder etwas wieder bereit ist.</div>')
        +'</div><button id="zn-off" style="width:100%;padding:9px;border:none;border-radius:12px;background:rgba(255,255,255,.18);color:#fff;font:900 .85rem Arial;margin-top:6px">'+(N.off?'🔔 Hinweise einblenden':'🔕 Pop-ups ausschalten')+'</button><button id="zn-x" style="width:100%;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#43a047,#1b5e20);color:#fff;font:900 .9rem Arial;margin-top:6px">Schliessen</button></div>'; document.body.appendChild(o);
      $('zn-x').onclick=()=>o.remove(); $('zn-off').onclick=()=>{ N.off=!N.off; N.save(); o.remove(); N.open(); };
      o.querySelectorAll('button[data-p]').forEach(bn=>bn.onclick=()=>{ o.remove(); try{ const p=ZGuide.places().find(x=>x.n===bn.dataset.p); if(p) ZGuide.go(p); else ZP.toast('Ort noch unbekannt',2000); }catch(e){ ZP.toast('Wegweiser nicht verfügbar',2000); } }); };
    b.onclick=()=>N.open(); N.paint();
    setInterval(()=>{ try{ const hide=!!(window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive; b.style.display=hide?'none':'block'; }catch(e){} },1000);
    setInterval(()=>{ try{ N.check(); }catch(e){} },20000); setTimeout(()=>{ try{ N.check(); }catch(e){} },9000);
  }
  wait();
})();
