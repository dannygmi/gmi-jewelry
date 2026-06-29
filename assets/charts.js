/* GMI mockup — canvas charts. Colors from CSS vars. Time axis LTR (oldest left, newest right) per native finance convention. */
(function () {
  const css = (n,f) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f);
  function hidpi(canvas){ const r=canvas.getBoundingClientRect(); const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*dpr)); canvas.height=Math.max(1,Math.round(r.height*dpr));
    const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w:r.width,h:r.height}; }

  function sparkline(canvas, data, opts={}){
    const {ctx,w,h}=hidpi(canvas); const up=css('--up','#34c759'), down=css('--down','#ff3b30');
    const d=data.slice(); const min=Math.min(...d), max=Math.max(...d), rng=(max-min)||1; const pad=2;
    const rising = d[d.length-1] >= d[0]; const color = opts.color || (rising?up:down);
    const X = i => pad + (i/(d.length-1))*(w-2*pad);     // LTR: oldest left → newest right
    const Y = v => h - pad - ((v-min)/rng)*(h-2*pad);
    if(opts.fill){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,color+'2e'); g.addColorStop(1,color+'00');
      ctx.beginPath(); d.forEach((v,i)=>{const x=X(i),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.lineTo(X(d.length-1),h); ctx.lineTo(X(0),h); ctx.closePath(); ctx.fillStyle=g; ctx.fill(); }
    ctx.lineWidth=opts.lw||1.7; ctx.strokeStyle=color; ctx.lineJoin='round'; ctx.beginPath();
    d.forEach((v,i)=>{ const x=X(i),y=Y(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
  }

  function area(canvas, data, opts={}){
    const {ctx,w,h}=hidpi(canvas); const color=opts.color||css('--gold','#c8a24b');
    const d=data.slice(); const min=Math.min(...d), max=Math.max(...d), rng=(max-min)||1; const pad=4;
    const X=i=> pad + (i/(d.length-1))*(w-2*pad);        // LTR
    const Y=v=> h - pad - ((v-min)/rng)*(h-2*pad);
    const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,color+(opts.fillA||'33')); g.addColorStop(1,color+'00');
    ctx.beginPath(); d.forEach((v,i)=>{const x=X(i),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.lineTo(X(d.length-1),h); ctx.lineTo(X(0),h); ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); d.forEach((v,i)=>{const x=X(i),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.lineWidth=2; ctx.strokeStyle=color; ctx.stroke();
    ctx.beginPath(); ctx.arc(X(d.length-1),Y(d[d.length-1]),3,0,7); ctx.fillStyle=color; ctx.fill();  // newest = right
  }

  function candles(canvas, ohlc, opts={}){
    const {ctx,w,h}=hidpi(canvas);
    const up=css('--up','#34c759'), down=css('--down','#ff3b30'), grid=css('--separator','#333'), txt=css('--label-3','#888');
    const padL=6,padR=50,padT=8,padB=16; const cw=w-padL-padR, chh=h-padT-padB;
    let min=Infinity,max=-Infinity; ohlc.forEach(c=>{min=Math.min(min,c.l);max=Math.max(max,c.h);});
    const rng=(max-min)||1; min-=rng*0.06; max+=rng*0.06; const R=max-min;
    const n=ohlc.length; const slot=cw/n; const bw=Math.max(2,slot*0.58);
    const X=i=> padL + (i+0.5)*slot;          // LTR: oldest left, newest right
    const Y=v=> padT + (max-v)/R*chh;
    ctx.fillStyle=txt; ctx.font='10px Vazirmatn, sans-serif'; ctx.textAlign='left';
    for(let k=0;k<=4;k++){ const v=min+R*k/4; const y=Y(v); ctx.strokeStyle=grid; ctx.globalAlpha=.5;
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); ctx.globalAlpha=1;
      const FA=window.FA?window.FA.faDigits:String; ctx.fillText(FA((v/1e6).toFixed(1))+'M', w-padR+5, y+3); }
    ohlc.forEach((c,i)=>{ const x=X(i); const rising=c.c>=c.o; ctx.strokeStyle=ctx.fillStyle=rising?up:down; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(x,Y(c.h)); ctx.lineTo(x,Y(c.l)); ctx.stroke();
      const yo=Y(c.o), yc=Y(c.c); ctx.fillRect(x-bw/2, Math.min(yo,yc), bw, Math.max(1.5,Math.abs(yc-yo))); });
    const last=ohlc[ohlc.length-1].c, yl=Y(last), gold=css('--gold','#c8a24b');
    ctx.setLineDash([3,3]); ctx.strokeStyle=gold; ctx.globalAlpha=.85; ctx.beginPath(); ctx.moveTo(padL,yl); ctx.lineTo(w-padR,yl); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
  }

  window.CHARTS = { sparkline, area, candles };
})();
