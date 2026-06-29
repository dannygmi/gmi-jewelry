/* GMI Jewelry — Apple-native mockup behavior. */
(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const FA = window.FA, DATA = window.DATA, CHARTS = window.CHARTS;
  const faToLatin = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٬،,]/g,'');
  const num = s => parseFloat(faToLatin(s)) || 0;
  const flash = el => { if(!el) return; el.style.transition='none'; el.style.background='var(--gold-tint)';
    requestAnimationFrame(()=>{ el.style.transition='background .6s'; el.style.background='transparent'; }); };

  // ---------- router ----------
  function showScreen(name){
    closeAllSheets();
    $$('[data-screen]').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    $$('[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    const sec = $(`[data-screen="${name}"]`);
    const it = $('[data-inline-title]'); if(it && sec) it.textContent = sec.dataset.title || '';
    const nav = $('.navbar'); if(nav) nav.classList.remove('is-collapsed');
    const sc = $('.app-scroll'); if(sc) sc.scrollTop = 0;
    renderChartsIn(sec);
  }
  function wireNav(){
    $$('[data-tab]').forEach(t => t.addEventListener('click', ()=>showScreen(t.dataset.tab)));
    $$('[data-go]').forEach(b => b.addEventListener('click', ()=>showScreen(b.dataset.go)));
    const sc=$('.app-scroll'), nav=$('.navbar');
    if(sc&&nav) sc.addEventListener('scroll', ()=>{ nav.classList.toggle('is-collapsed', sc.scrollTop>50); }, {passive:true});
  }

  // ---------- theme ----------
  function wireTheme(){
    const btn=$('[data-theme-toggle]'); if(!btn) return;
    btn.addEventListener('click', ()=>{
      const cur=document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
      document.documentElement.dataset.theme = cur==='dark' ? 'light' : 'dark';
      const open=$('[data-sheet].open'); renderChartsIn($('[data-screen].active')); if(open) renderChartsIn(open);
    });
  }

  // ---------- sheets ----------
  function closeAllSheets(){ $$('[data-sheet].open').forEach(s=>s.classList.remove('open')); document.body.classList.remove('sheet-open'); resetConfirm(); stopCountdown(); }
  function openSheet(id, ctx){ const sh=$(`[data-sheet="${id}"]`); if(!sh) return;
    sh.classList.add('open'); document.body.classList.add('sheet-open');
    if(id==='product' && ctx) hydrateProduct(ctx); renderChartsIn(sh); }
  function closeSheet(el){ if(el){ const sh=el.closest('[data-sheet]'); if(sh) sh.classList.remove('open'); } else closeAllSheets();
    if(!$('[data-sheet].open')) document.body.classList.remove('sheet-open'); resetConfirm(); stopCountdown(); }
  function resetConfirm(){ const cb=$('[data-confirmbody]'), rs=$('[data-sheet="confirm"] [data-result]');
    if(cb) cb.style.display=''; if(rs) rs.classList.remove('show'); }
  function wireSheets(){
    $$('[data-open]').forEach(b=>{
      const fire=()=>{ const pid=b.dataset.product; openSheet(b.dataset.open, pid?DATA.products.find(p=>p.id===pid):null); };
      b.addEventListener('click', fire);
      b.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } });
    });
    $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheet(b)));
    $$('[data-sheet] .scrim').forEach(s=>s.addEventListener('click',()=>closeSheet(s)));
  }

  // ---------- product hydrate ----------
  let CURRENT={product:null, side:'buy', qty:5};
  function hydrateProduct(p){
    CURRENT={product:p, side:'buy', qty:5};
    const set=(s,v)=>{const el=$(s); if(el) el.textContent=v;};
    set('[data-pf="name"]',p.name); set('[data-pf="sub"]',p.sub);
    set('[data-pf="buy"]',FA.toman(p.buy)); set('[data-pf="sell"]',FA.toman(p.sell));
    set('[data-pf="spread"]',FA.toman(p.spread)); set('[data-pf="premium"]',FA.pct(p.premium)); set('[data-pf="change"]',FA.pct(p.change));
    const ch=$('[data-pf="change"]'); if(ch){ ch.classList.toggle('down',p.change<0); ch.classList.toggle('up',p.change>=0); }
    $$('[data-side]').forEach(b=>b.setAttribute('aria-selected', b.dataset.side==='buy'?'true':'false'));
    const gi=$('[data-conv="gram"]'); if(gi) gi.value='۵';
    const c=$('[data-chart="candles"]'); if(c) requestAnimationFrame(()=>CHARTS.candles(c,p.candles));
    syncConverter();
  }
  function syncConverter(){
    const p=CURRENT.product; if(!p) return;
    const g=$('[data-conv="gram"]'), tot=$('[data-conv="total"]'), unit=$('[data-conv="unit"]'), mm=$('[data-conv="minmax"]');
    const price=CURRENT.side==='buy'?p.buy:p.sell;
    const grams=(g&&g.value)?num(g.value):(CURRENT.qty||0);
    if(tot) tot.textContent=FA.toman(grams*price)+' تومان';
    if(unit) unit.textContent=p.unit;
    if(mm) mm.textContent=`از ${FA.faDigits(p.min)} تا ${FA.faDigits(p.max)} ${p.unit}`;
  }
  function wireConverter(){
    const g=$('[data-conv="gram"]');
    if(g) g.addEventListener('input',()=>{ CURRENT.qty=num(g.value); syncConverter(); });
    $$('[data-side]').forEach(b=>b.addEventListener('click',()=>{ CURRENT.side=b.dataset.side;
      $$('[data-side]').forEach(x=>x.setAttribute('aria-selected', x===b?'true':'false')); syncConverter(); }));
    $$('[data-step]').forEach(b=>b.addEventListener('click',()=>{ let v=num(g.value); v+=b.dataset.step==='up'?1:-1; v=Math.max(0,v);
      g.value=v?FA.faDigits(v):''; CURRENT.qty=v; syncConverter(); }));
  }

  // ---------- countdown + press-hold ----------
  let cdTimer=null, cdLeft=0, expired=false;
  function startCountdown(seconds, onExpire){
    stopCountdown(); cdLeft=seconds; expired=false;
    const ring=$('#cdRing'), num_=$('#cdNum'), wrap=$('.lock-ring');
    const C=ring?2*Math.PI*48:0; if(ring){ ring.style.strokeDasharray=C; ring.style.strokeDashoffset=0; }
    if(wrap) wrap.classList.remove('urgent');
    const tick=()=>{ if(num_) num_.textContent=FA.faDigits(cdLeft); if(ring) ring.style.strokeDashoffset=C*(1-cdLeft/seconds);
      if(wrap) wrap.classList.toggle('urgent', cdLeft<=3 && cdLeft>0);
      if(cdLeft<=0){ stopCountdown(); onExpire&&onExpire(); return; } cdLeft--; };
    tick(); cdTimer=setInterval(tick,1000);
  }
  function stopCountdown(){ if(cdTimer){ clearInterval(cdTimer); cdTimer=null; } }
  function pressHold(el, ms, onProgress, onDone){
    let raf=null,start=null,active=false;
    const step=ts=>{ if(!start)start=ts; const p=Math.min(1,(ts-start)/ms); onProgress&&onProgress(p);
      if(p>=1){ active=false; onDone&&onDone(); return; } if(active) raf=requestAnimationFrame(step); };
    const begin=e=>{ e.preventDefault(); if(expired){ restartQuote(); return; } active=true; start=null; el.classList.add('holding'); raf=requestAnimationFrame(step); };
    const end=()=>{ active=false; el.classList.remove('holding'); if(raf)cancelAnimationFrame(raf); onProgress&&onProgress(0); };
    el.addEventListener('pointerdown',begin); el.addEventListener('pointerup',end); el.addEventListener('pointerleave',end); el.addEventListener('pointercancel',end);
  }
  function openConfirm(){
    const p=CURRENT.product; const set=(s,v)=>{const el=$(s); if(el)el.textContent=v;};
    const price=CURRENT.side==='buy'?p.buy:p.sell; const total=(CURRENT.qty||0)*price;
    set('[data-cf="name"]',p.name); set('[data-cf="side"]',CURRENT.side==='buy'?'خرید':'فروش');
    set('[data-cf="qty"]',FA.faDigits(CURRENT.qty||0)+' '+p.unit); set('[data-cf="price"]',FA.toman(price));
    set('[data-cf="spread"]',FA.toman(p.spread)); set('[data-cf="totalbig"]',FA.toman(total));
    const st=$('[data-cf="state"]'); if(st) st.innerHTML='قیمت برای شما قفل شده است. پس از تأیید، <b>معامله قابل لغو نیست.</b>';
    const hb=$('[data-holdbtn]'); if(hb){ hb.classList.remove('expired'); hb.querySelector('span:last-child').textContent='نگه دارید تا تأیید شود'; }
    openSheet('confirm');
    startCountdown(DATA.settings.clientConfirmSec, onExpire);
  }
  function onExpire(){ expired=true;
    const st=$('[data-cf="state"]'); if(st) st.innerHTML='<b>قیمت منقضی شد.</b> برای دریافت قیمت جدید دکمه را لمس کنید.';
    const hb=$('[data-holdbtn]'); if(hb){ hb.classList.add('expired'); hb.querySelector('span:last-child').textContent='دریافت قیمت جدید'; }
  }
  function restartQuote(){ expired=false; openConfirm(); }
  function wireConfirm(){
    $$('[data-confirm-open]').forEach(b=>b.addEventListener('click',openConfirm));
    const hb=$('[data-holdbtn]'); if(hb){ const bar=$('[data-holdfill]');
      pressHold(hb, 900, p=>{ if(bar) bar.style.transform=`scaleX(${p})`; }, ()=>{
        if(expired) return; stopCountdown();
        const body=$('[data-confirmbody]'), ok=$('[data-sheet="confirm"] [data-result]');
        if(body) body.style.display='none'; if(ok) ok.classList.add('show');
      });
    }
  }

  // ---------- charts ----------
  function renderChartsIn(root){ if(!root) return;
    $$('[data-spark]',root).forEach(cv=>{ const p=DATA.products.find(x=>x.id===cv.dataset.spark); if(p) requestAnimationFrame(()=>CHARTS.sparkline(cv,p.spark,{fill:true})); });
    $$('[data-area]',root).forEach(cv=>{ const gold=cv.dataset.area==='gold'; requestAnimationFrame(()=>CHARTS.area(cv,DATA.balance.history,{color:gold?'#241a06':undefined, fillA:gold?'40':'33'})); });
    $$('[data-chart="candles"]',root).forEach(cv=>{ if(CURRENT.product) requestAnimationFrame(()=>CHARTS.candles(cv,CURRENT.product.candles)); });
  }

  // ---------- chat ----------
  function wireChat(){ const form=$('[data-chat-form]'); if(!form) return;
    form.addEventListener('submit',e=>{ e.preventDefault(); const inp=$('[data-chat-input]'); const v=(inp.value||'').trim(); if(!v) return;
      const list=$('[data-chat-list]'); const b=document.createElement('div'); b.className='bubble me';
      b.innerHTML='<div class="bubble-text"></div><div class="bubble-meta">۱۴:۳۰</div>'; b.querySelector('.bubble-text').textContent=v;
      list.appendChild(b); inp.value=''; list.scrollTop=list.scrollHeight; });
  }
  function wireOnboarding(){ $$('[data-otp]').forEach((inp,i,arr)=>inp.addEventListener('input',()=>{ if(inp.value&&arr[i+1]) arr[i+1].focus(); })); }
  function liveClock(){ setInterval(()=>{ const ps=$$('[data-pricecell]'); if(ps.length) flash(ps[Math.floor(Math.random()*ps.length)]); }, 2800); }

  function init(){ wireNav(); wireTheme(); wireSheets(); wireConverter(); wireConfirm(); wireChat(); wireOnboarding(); liveClock();
    renderChartsIn($('[data-screen].active')||document); }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
  window.APP={ showScreen, openSheet, closeSheet };
})();
