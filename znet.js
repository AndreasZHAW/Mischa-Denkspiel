// ZNet — Netz- & Ruckel-Monitor (v641). Zählt Firebase-Schreib-/Lese-Mengen pro Pfad,
// misst Frame-Zeiten, schreibt alle 30 s eine [Net-debug]-Zeile ins Crash-Log und
// einen Schnappschuss nach zoo_traffic_diag/<gerät>/net. Rein passiv, darf nie etwas kaputt machen.
(function(){
  'use strict';
  var Z=window.ZNet={
    t0:Date.now(), out:{}, inn:{}, cnt:{w:{},r:{}}, evt:[],
    fr:{n:0,sum:0,max:0,long:0,vlong:0,last:0,win:[]},
    marks:[], spikes:{},
    vis:{live:0,stale:0,total:0,minLive:99,maxLive:0}, lastLog:0
  };
  function top(path){ try{ var p=String(path||'').replace(/^https?:\/\/[^\/]+/,'').replace(/^\/+/,'').split('/'); return p[0]||'?'; }catch(e){return '?';} }
  function size(v){ try{ return v==null?0:JSON.stringify(v).length; }catch(e){ return 0; } }
  function add(m,k,n){ m[k]=(m[k]||0)+n; }
  Z.w=function(path,val){ var k=top(path); add(Z.out,k,size(val)+40); add(Z.cnt.w,k,1); };
  Z.r=function(path,val){ var k=top(path); add(Z.inn,k,size(val)+40); add(Z.cnt.r,k,1); };
  // ── Firebase-Referenz patchen ──
  function patch(){
    try{
      if(Z._patched||typeof firebase==='undefined'||!firebase.database||!firebase.database.Reference) return false;
      var P=firebase.database.Reference.prototype;
      ['set','update','push'].forEach(function(m){
        var o=P[m]; if(!o) return;
        P[m]=function(v){ try{ Z.w(this.toString(),v); }catch(e){} return o.apply(this,arguments); };
      });
      var oT=P.transaction;
      if(oT) P.transaction=function(){ try{ Z.w(this.toString(),{t:1}); }catch(e){} return oT.apply(this,arguments); };
      var oR=P.remove; if(oR) P.remove=function(){ try{ Z.w(this.toString(),null); }catch(e){} return oR.apply(this,arguments); };
      var oOn=P.on;
      if(oOn) P.on=function(ev,cb){
        var self=this, args=Array.prototype.slice.call(arguments);
        if(typeof cb==='function'){
          args[1]=function(snap){ try{ Z.r(self.toString(), snap&&snap.val?snap.val():null); }catch(e){} return cb.apply(this,arguments); };
        }
        return oOn.apply(this,args);
      };
      var oOnce=P.once;
      if(oOnce) P.once=function(){
        var self=this, p=oOnce.apply(this,arguments);
        try{ if(p&&p.then) p.then(function(s){ try{ Z.r(self.toString(), s&&s.val?s.val():null); }catch(e){} }).catch(function(){}); }catch(e){}
        return p;
      };
      Z._patched=true; return true;
    }catch(e){ return false; }
  }
  var tries=0, iv=setInterval(function(){ if(patch()||++tries>60) clearInterval(iv); },500);
  // ── Frame-Zeiten ──
  function frame(ts){
    var f=Z.fr;
    if(f.last){
      var d=ts-f.last;
      if(d>0&&d<5000){ f.n++; f.sum+=d; if(d>f.max)f.max=d; if(d>100){ f.long++; Z.spike(d,ts); } if(d>250)f.vlong++; f.win.push(d); }
    }
    f.last=ts; requestAnimationFrame(frame);
  }
  try{ requestAnimationFrame(frame); }catch(e){}
  document.addEventListener('visibilitychange',function(){ Z.fr.last=0; if(!document.hidden) Z.mark('tab-resume',2500); });
  // ── Sichtbarkeit anderer Spieler (von _syncMP aufgerufen) ──
  Z.seen=function(hotAll,myKey,now,mySlot){
    try{
      var live=0,stale=0,names=[];
      Object.keys(hotAll||{}).forEach(function(k){
        if(k===myKey) return;
        var h=hotAll[k]; if(!h) return;
        if(now-(h.t||0)<10000){ live++; names.push(k); } else stale++;
      });
      var slots={},warn=[];
      Object.keys(hotAll||{}).forEach(function(k){ var h=hotAll[k]; if(!h||now-(h.t||0)>=10000) return;
        if(typeof h.slotIdx==='number'){ (slots[h.slotIdx]=slots[h.slotIdx]||[]).push(k); }
        if(Math.abs(h.x)>400||Math.abs(h.z)>400||h.x!==h.x) warn.push('Position-Ausreisser '+k+' ('+h.x+','+h.z+')'); });
      if(typeof mySlot==='number'){ (slots[mySlot]=slots[mySlot]||[]).push(myKey); }
      Object.keys(slots).forEach(function(s){ if(slots[s].length>1) warn.push('Slot '+s+' doppelt belegt: '+slots[s].join(', ')); });
      var sig=warn.join('|'); if(sig&&sig!==Z._lastWarn){ console.warn('[Net-debug] '+sig); Z.event(sig); } Z._lastWarn=sig;
      var v=Z.vis; v.live=live; v.stale=stale; v.total=live+stale; v.names=names;
      if(live<v.minLive)v.minLive=live; if(live>v.maxLive)v.maxLive=live;
    }catch(e){}
  };
  // Ursachen-Zuordnung: Z.mark('label',ms) = „in den nächsten ms könnten Ruckler von label kommen"
  Z.mark=function(label,ms){ try{ Z.marks.push({l:label,until:performance.now()+(ms||3000)}); if(Z.marks.length>40)Z.marks.shift(); }catch(e){} };
  Z.spike=function(d,ts){
    try{ var now=performance.now(), ls=[]; Z.marks.forEach(function(m){ if(m.until>now&&ls.indexOf(m.l)<0) ls.push(m.l); });
      var k=ls.length?ls.join('+'):'ohne-Event'; var e=Z.spikes[k]||(Z.spikes[k]={n:0,max:0,sum:0}); e.n++; e.sum+=d; if(d>e.max)e.max=d; }catch(e){}
  };
  Z.fsW=0; Z.fs=function(){ Z.fsW++; };
  Z.event=function(s){ try{ Z.evt.push(new Date().toLocaleTimeString('de-CH')+' '+s); if(Z.evt.length>30)Z.evt.shift(); }catch(e){} };
  function kb(n){ return (n/1024).toFixed(1); }
  function topN(m,n){ return Object.keys(m).sort(function(a,b){return m[b]-m[a];}).slice(0,n).map(function(k){return k+'='+kb(m[k])+'k';}).join(' '); }
  Z.snapshot=function(){
    var f=Z.fr, secs=Math.max(1,(Date.now()-Z.t0)/1000);
    var win=f.win.slice().sort(function(a,b){return a-b;});
    var p95=win.length?win[Math.floor(win.length*.95)]:0;
    var inT=0,outT=0; Object.keys(Z.inn).forEach(function(k){inT+=Z.inn[k];}); Object.keys(Z.out).forEach(function(k){outT+=Z.out[k];});
    return {secs:Math.round(secs), fps:f.n?Math.round(1000/(f.sum/f.n)):0, frameMax:Math.round(f.max), frameP95:Math.round(p95),
      long:f.long, vlong:f.vlong, inKB:+kb(inT), outKB:+kb(outT), inKBmin:+(inT/1024/(secs/60)).toFixed(1), outKBmin:+(outT/1024/(secs/60)).toFixed(1),
      topIn:topN(Z.inn,4), topOut:topN(Z.out,4), live:Z.vis.live, stale:Z.vis.stale, minLive:Z.vis.minLive===99?0:Z.vis.minLive, maxLive:Z.vis.maxLive,
      spk:Object.keys(Z.spikes).map(function(k){var e=Z.spikes[k];return k+' '+e.n+'× (max '+Math.round(e.max)+'ms)';}).join(', '),
      mem:(performance&&performance.memory)?Math.round(performance.memory.usedJSHeapSize/1048576):null};
  };
  Z.tick=function(){
    try{
      var s=Z.snapshot();
      var line='[Net-debug] '+s.secs+'s · FPS Ø'+s.fps+' (p95-Frame '+s.frameP95+'ms, max '+s.frameMax+'ms, >100ms: '+s.long+'×, >250ms: '+s.vlong+'×) · '
        +'↓'+s.inKB+'KB ('+s.inKBmin+'/min) ↑'+s.outKB+'KB ('+s.outKBmin+'/min) · Top↓ '+s.topIn+' · Top↑ '+s.topOut
        +' · Spieler live '+s.live+' (min '+s.minLive+'/max '+s.maxLive+') stale '+s.stale+(s.mem!=null?' · Heap '+s.mem+'MB':'')+' · Firestore-Writes: '+Z.fsW+' · Ruckler-Ursachen: '+(s.spk||'–');
      if(s.long>0||s.vlong>0||s.inKBmin>400) console.warn(line); else console.log(line);
      if(typeof _rtdb!=='undefined'&&_rtdb&&typeof State!=='undefined'&&State._useCloud&&State._useCloud()){
        var id=(window.getDeviceId&&window.getDeviceId())||'dev';
        _rtdb.ref('zoo_net_diag/'+id).set(Object.assign({ts:Date.now(),events:Z.evt.slice(-8)},s)).catch(function(){});
      }
      Z.fr.win=[]; // p95 pro 30-s-Fenster
    }catch(e){}
  };
  setInterval(Z.tick,30000);
})();
