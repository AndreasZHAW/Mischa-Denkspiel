/* Sanction: Sperre / Auszeit / Admin-Nachricht — wirkt SOFORT beim Spieler (RTDB-Live-Listener)
 * - Admin setzt zoo_sanction/{key} (RTDB) + banned_players/{name} (Firestore, für Login-Prüfung)
 * - Spieler sieht sofort einen schwarzen Sperrbildschirm mit Grund, kann einen Entbannungsantrag schreiben
 * - Admin-Nachricht (zoo_amsg/{key}): schwarzer Bildschirm, wegklicken oder dem Admin antworten
 * Wird auf zoo.html UND index.html geladen. Verbindet sich selbst, sobald ein Spielername bekannt ist.
 */
(function(){
  if(window.Sanction) return;
  const rk=n=>String(n||'').toLowerCase().replace(/[.#$\[\]]/g,'_');
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S=window.Sanction={
    name:null, locked:false, _ov:null, _msgOv:null, _tick:null, _watching:false, _lastMsgId:null,
    _me(){
      try{ if(typeof ZS!=='undefined'&&ZS&&ZS.player) return ZS.player; }catch(e){}
      try{ if(typeof State!=='undefined'&&State&&State.currentPlayer&&State.currentPlayer.name) return State.currentPlayer.name; }catch(e){}
      try{ return sessionStorage.getItem('mischa_current')||''; }catch(e){ return ''; }
    },
    _active(d){
      if(!d) return false;
      if(d.permanent) return true;
      return !!(d.expiresAt && d.expiresAt>Date.now());
    },
    // ── Start: wartet, bis Name + Datenbank da sind ──
    init(){
      if(this._iv) return;
      this._iv=setInterval(()=>{
        const n=this._me();
        if(!n || typeof _rtdb==='undefined' || !_rtdb) return;
        if(this._watching && this.name===n) return;
        if(this._watching){ this._unwatch(); }
        this.name=n; this._watch(n);
      },1500);
    },
    _unwatch(){
      try{ if(this._r1) this._r1.off(); if(this._r2) this._r2.off(); }catch(e){}
      this._watching=false;
    },
    _watch(n){
      this._watching=true;
      const k=rk(n); const t0=Date.now();
      // 1) Login-Prüfung über Firestore (dauerhaft gespeicherte Sperre)
      try{
        if(typeof _db!=='undefined' && _db){
          _db.collection('banned_players').doc(n.toLowerCase()).get().then(doc=>{
            if(doc.exists){ const d=doc.data(); if(this._active(d)) this.showLock(d); }
          }).catch(()=>{});
        }
      }catch(e){}
      // 2) Live: Sperre/Auszeit
      this._r1=_rtdb.ref('zoo_sanction/'+k);
      this._r1.on('value',snap=>{
        const d=snap.val();
        if(d && this._active(d)) this.showLock(d);
        else if(this.locked) this._unlocked(d);
      });
      // 3) Live: Nachricht vom Admin — wird gemerkt und erst gezeigt, wenn man im Zoo ist
      this._r2=_rtdb.ref('zoo_amsg/'+k);
      this._r2.on('value',snap=>{
        const d=snap.val(); if(!d||!d.id) return;
        if(d.at && d.at<Date.now()-7*86400000) return; // älter als 7 Tage: ignorieren
        try{ if(localStorage.getItem('zoo_amsg_seen')===d.id) return; }catch(e){}
        this._pending=d;
      });
      clearInterval(this._pIv);
      this._pIv=setInterval(()=>{
        const d=this._pending; if(!d || this.locked) return;
        if(!this._inZoo()) return;
        this._pending=null;
        try{ localStorage.setItem('zoo_amsg_seen',d.id); }catch(e){}
        this._lastMsgId=d.id;
        this.showAdminMsg(d);
      },1500);
    },
    // Nur auf der Zoo-Seite, wenn die Spielwelt wirklich läuft (nicht auf Login, Intro oder in Denkspielen)
    _inZoo(){
      try{
        if(!/zoo\.html/i.test(location.pathname)) return false;
        if(typeof ZG==='undefined'||!ZG||!ZG.cam) return false;
        if(typeof ZS==='undefined'||!ZS||!ZS.zoo) return false;
        if(document.getElementById('w1-ov')||document.getElementById('world1-ov')) return false;
        return true;
      }catch(e){ return false; }
    },
    // ── Sperrbildschirm ──
    _stopGame(){
      try{ if(typeof ZG!=='undefined'&&ZG&&ZG.zStop) ZG.zStop(); }catch(e){}
      try{ document.querySelectorAll('audio,video').forEach(m=>{ try{m.pause();}catch(e){} }); }catch(e){}
      try{ if(typeof ZSound!=='undefined'&&ZSound.ctx&&ZSound.ctx.suspend) ZSound.ctx.suspend(); }catch(e){}
      try{ const f=document.getElementById('w1-frame'); if(f) f.src='about:blank'; }catch(e){}
    },
    showLock(d){
      this.locked=true; this._data=d;
      this._stopGame();
      let ov=this._ov;
      if(!ov){
        ov=document.createElement('div'); ov.id='sanction-lock';
        ov.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;overflow:auto';
        document.body.appendChild(ov); this._ov=ov;
      }
      const perm=!!d.permanent; const timeout=(d.kind==='timeout')||(!perm&&d.expiresAt);
      const title=perm?'🚫 Dein Account wurde gesperrt':'⏳ Auszeit';
      const ap=d.appeal;
      let apHtml='';
      if(ap && ap.status==='pending') apHtml='<div style="margin-top:14px;padding:10px;border-radius:10px;background:rgba(255,215,0,.12);border:1px solid rgba(255,215,0,.4);color:#ffd700">📨 Dein Antrag wurde gesendet. Der Admin schaut ihn sich an. Diese Seite aktualisiert sich automatisch.</div>';
      else {
        if(ap && ap.status==='rejected') apHtml+='<div style="margin-top:14px;padding:10px;border-radius:10px;background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.5);color:#ff9a8a">❌ Dein letzter Antrag wurde abgelehnt.</div>';
        apHtml+='<div style="margin-top:16px;text-align:left"><div style="font-weight:700;margin-bottom:6px">'+(perm?'Entbannungsantrag':'Nachricht an den Admin')+'</div>'
          +'<textarea id="sanction-appeal" rows="4" maxlength="600" placeholder="Schreibe hier, warum du entbannt werden möchtest…" style="width:100%;box-sizing:border-box;background:#111;color:#fff;border:1px solid #555;border-radius:10px;padding:10px;font-size:1rem"></textarea>'
          +'<button id="sanction-send" style="margin-top:8px;width:100%;padding:12px;border:none;border-radius:10px;background:#2980b9;color:#fff;font-weight:800;font-size:1rem;cursor:pointer">📨 Antrag senden</button></div>';
      }
      ov.innerHTML='<div style="max-width:440px;width:100%;text-align:center">'
        +'<div style="font-size:2rem;font-weight:900;margin-bottom:10px">'+title+'</div>'
        +(d.reason?'<div style="font-size:1.05rem;margin-bottom:8px"><b>Grund:</b> '+esc(d.reason)+'</div>':'')
        +'<div style="font-size:.95rem;color:#bbb">'+(perm?'Dauer: dauerhaft':'Noch <b id="sanction-left" style="color:#fff"></b>')+'</div>'
        +apHtml+'</div>';
      const b=ov.querySelector('#sanction-send');
      if(b) b.onclick=()=>this._sendAppeal();
      clearInterval(this._tick);
      const upd=()=>{
        const el=document.getElementById('sanction-left'); if(!el) return;
        const left=Math.max(0,(d.expiresAt||0)-Date.now());
        if(left<=0){ clearInterval(this._tick); this._unlocked(null); return; }
        const m=Math.floor(left/60000), s=Math.floor(left%60000/1000);
        el.textContent=(m>=60?Math.floor(m/60)+' Std. '+(m%60)+' Min.':m+' Min. '+s+' Sek.');
      };
      upd(); if(!perm) this._tick=setInterval(upd,1000);
    },
    _unlocked(){
      clearInterval(this._tick);
      this.locked=false;
      if(this._ov){
        this._ov.innerHTML='<div style="max-width:440px;text-align:center"><div style="font-size:2rem;font-weight:900;margin-bottom:10px">✅ Du bist wieder frei!</div>'
          +'<button id="sanction-reload" style="margin-top:10px;padding:12px 24px;border:none;border-radius:10px;background:#27ae60;color:#fff;font-weight:800;font-size:1rem;cursor:pointer">Spiel neu laden</button></div>';
        this._ov.querySelector('#sanction-reload').onclick=()=>location.reload();
      }
    },
    async _sendAppeal(){
      const ta=document.getElementById('sanction-appeal'); const text=(ta&&ta.value||'').trim();
      if(!text){ if(ta) ta.style.borderColor='#e74c3c'; return; }
      const ap={text:text.slice(0,600),at:Date.now(),status:'pending'};
      const n=this.name||this._me(); const k=rk(n);
      try{ await _rtdb.ref('zoo_sanction/'+k+'/appeal').set(ap); }catch(e){}
      try{ if(typeof _db!=='undefined'&&_db) await _db.collection('banned_players').doc(n.toLowerCase()).set({appeal:ap},{merge:true}); }catch(e){}
      try{ await _rtdb.ref('zoo_appeals/'+k).set({name:n,text:ap.text,at:ap.at}); }catch(e){}
      this._data=Object.assign({},this._data,{appeal:ap}); this.showLock(this._data);
    },
    // ── Nachricht vom Admin ──
    showAdminMsg(d){
      document.getElementById('sanction-msg')?.remove();
      const ov=document.createElement('div'); ov.id='sanction-msg';
      ov.style.cssText='position:fixed;inset:0;z-index:2147483500;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;overflow:auto';
      ov.innerHTML='<div style="max-width:460px;width:100%;text-align:center">'
        +'<div style="font-size:.85rem;color:#ffd700;margin-bottom:10px">👑 Nachricht vom Admin</div>'
        +'<div style="font-size:1.25rem;line-height:1.5;margin-bottom:18px;word-break:break-word;white-space:pre-line">'+esc(d.text)+'</div>'
        +'<button id="am-close" style="padding:12px 26px;border:none;border-radius:10px;background:#555;color:#fff;font-weight:800;font-size:1rem;cursor:pointer;margin:4px">Wegklicken</button>'
        +'<button id="am-reply-b" style="padding:12px 26px;border:none;border-radius:10px;background:#2980b9;color:#fff;font-weight:800;font-size:1rem;cursor:pointer;margin:4px">✍️ Antworten</button>'
        +'<div id="am-reply" style="display:none;margin-top:14px;text-align:left"><textarea id="am-text" rows="3" maxlength="500" placeholder="Deine Antwort an den Admin…" style="width:100%;box-sizing:border-box;background:#111;color:#fff;border:1px solid #555;border-radius:10px;padding:10px;font-size:1rem"></textarea>'
        +'<button id="am-send" style="margin-top:8px;width:100%;padding:12px;border:none;border-radius:10px;background:#27ae60;color:#fff;font-weight:800;font-size:1rem;cursor:pointer">📨 Senden</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#am-close').onclick=()=>ov.remove();
      ov.querySelector('#am-reply-b').onclick=()=>{ ov.querySelector('#am-reply').style.display='block'; ov.querySelector('#am-text').focus(); };
      ov.querySelector('#am-send').onclick=async()=>{
        const text=(ov.querySelector('#am-text').value||'').trim(); if(!text) return;
        try{ await _rtdb.ref('zoo_amsg_reply/'+rk(this.name)+'/'+d.id).set({text,at:Date.now(),from:this.name,orig:String(d.text||'').slice(0,120)}); }catch(e){}
        ov.remove();
        try{ if(typeof ZP!=='undefined'&&ZP.toast) ZP.toast('📨 Antwort an den Admin gesendet',2500); }catch(e){}
      };
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>S.init()); else S.init();
})();
