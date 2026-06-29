/* GMI Jewelry — mockup data engine (no backend). Seeded for stable screenshots. */
(function () {
  // ---- seeded RNG (mulberry32) so charts are deterministic ----
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function seriesOHLC(seed, n, base, vol){
    const r=mulberry32(seed); const out=[]; let px=base;
    for(let i=0;i<n;i++){ const o=px; const drift=(r()-0.48)*vol; const c=Math.max(base*0.8,o*(1+drift));
      const hi=Math.max(o,c)*(1+r()*vol*0.5); const lo=Math.min(o,c)*(1-r()*vol*0.5);
      out.push({o,h:hi,l:lo,c}); px=c; } return out;
  }
  function spark(seed,n,base,vol){ return seriesOHLC(seed,n,base,vol).map(c=>c.c); }

  // ---- Persian helpers ----
  const FA='۰۱۲۳۴۵۶۷۸۹';
  const faDigits = s => String(s).replace(/[0-9]/g, d => FA[d]);
  const group = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'); // arabic thousands sep
  const toman = n => faDigits(group(n));                 // e.g. ۴٬۱۸۲٬۰۰۰
  const gram  = (n,d=3) => faDigits(n.toFixed(d).replace('.', '٫'));
  const pct   = n => (n>=0?'+':'−')+faDigits(Math.abs(n).toFixed(2))+'٪';
  const faNum = (n,d=0)=> faDigits(d?Number(n).toFixed(d).replace('.','٫'):group(n));

  // ---- products (toman; آبشده per gram, سکه per coin) ----
  const products = [
    { id:'naqdi1', group:'آبشده', name:'نقدی یک', unit:'گرم', sub:'هر گرم ۷۵۰', buy:4182000, sell:4165000, premium:1.2, change:0.84, tag:'جابجایی امروز', updated:'۱۴:۲۳:۱۸', seed:11, vol:0.012, min:1, max:2000 },
    { id:'naqdi2', group:'آبشده', name:'نقدی ۲',  unit:'گرم', sub:'تحویل ۷ تیر',  buy:4180500, sell:4163000, premium:1.1, change:0.79, tag:'جابجایی ۷ تیر', updated:'۱۴:۲۳:۱۶', seed:12, vol:0.012, min:1, max:2000 },
    { id:'emami',  group:'سکه', name:'امامی جدید', unit:'عدد', sub:'طرح جدید', buy:48650000, sell:48500000, premium:2.4, change:1.12, tag:'جابجایی امروز', updated:'۱۴:۲۳:۳۴', seed:21, vol:0.016, min:1, max:50 },
    { id:'tamam',  group:'سکه', name:'تمام قدیم', unit:'عدد', sub:'طرح قدیم', buy:47800000, sell:47600000, premium:1.9, change:0.41, tag:'جابجایی امروز', updated:'۱۴:۲۳:۵۰', seed:22, vol:0.015, min:1, max:50 },
    { id:'nim',    group:'سکه', name:'نیم جدید',  unit:'عدد', sub:'طرح جدید', buy:25200000, sell:25050000, premium:3.1, change:-0.22, tag:'جابجایی امروز', updated:'۱۴:۲۳:۵۹', seed:23, vol:0.018, min:1, max:80 },
    { id:'rob',    group:'سکه', name:'ربع جدید',  unit:'عدد', sub:'طرح جدید', buy:15800000, sell:15650000, premium:4.0, change:-0.35, tag:'جابجایی امروز', updated:'۱۴:۲۳:۴۱', seed:24, vol:0.02, min:1, max:120 },
  ];
  products.forEach(p=>{ p.spread = p.buy - p.sell; p.spark = spark(p.seed, 28, p.sell, p.vol); p.candles = seriesOHLC(p.seed+100, 44, p.sell, p.vol); });

  // ---- account / balance (positive portfolio, with live P/L) ----
  const account = { name:'النا گالری', person:'حمیدرضا تهرانی', phone:'۰۹۱۹ ۷۲۶ ۶۹۹۳', tier:'عمده‌فروش', avatar:'assets/brand/GMI BLACK.png' };
  const goldPriceNow = 4182000; // toman/gram reference
  const balance = {
    gold: { amount:152.300, unit:'گرم', costBasis:618_000_000_000/100 , },
    rial: { amount:2_847_500_000 },
    netWorthToman: 152.300*goldPriceNow + 2_847_500_000,
    dayPnlPct: 1.06,
    dayPnlToman: 6_940_000,
    history: spark(77, 30, 9_200_000_000, 0.01)
  };

  // ---- transactions ledger (گردش): credit(blue)=بستانکار, debit(red)=بدهکار ----
  const transactions = [
    { date:'یکشنبه ۳۱ خرداد', rows:[
      { action:'پرداخت', type:'سکه امامی', qty:1, weight:null, unitFee:null, amount:48650000, kind:'debit', doc:'۴۹۳۹۱' },
      { action:'خرید', type:'نقدی یک', qty:50, weight:50, unitFee:4182000, amount:209100000, kind:'debit', doc:'۴۹۳۸۸' },
    ]},
    { date:'چهارشنبه ۲۷ خرداد', rows:[
      { action:'فروش', type:'پولی کردن امامی', qty:1, weight:null, unitFee:1575000000, amount:1575000000, kind:'credit', doc:'۴۹۳۹۱' },
      { action:'دریافت', type:'تسویه نقدی', qty:null, weight:null, unitFee:null, amount:820000000, kind:'credit', doc:'۴۹۳۱۲' },
    ]},
  ];

  // ---- orders (سفارش) ----
  const orders = [
    { id:'۱۱۳', date:'امروز ۱۴:۰۲', side:'خرید', product:'نقدی یک', qty:'۵ گرم', price:'۲۰٬۹۱۰٬۰۰۰', total:'۲۰٬۹۱۰٬۰۰۰', status:'انجام شد', kind:'done' },
    { id:'۱۱۲', date:'امروز ۱۳:۴۱', side:'فروش', product:'ربع جدید', qty:'۲ عدد', price:'۳۱٬۳۰۰٬۰۰۰', total:'۳۱٬۳۰۰٬۰۰۰', status:'انجام شد', kind:'done' },
    { id:'۱۱۱', date:'دیروز ۱۸:۲۰', side:'خرید', product:'امامی جدید', qty:'۱ عدد', price:'۴۸٬۶۵۰٬۰۰۰', total:'۴۸٬۶۵۰٬۰۰۰', status:'رد قیمت', kind:'rejected' },
  ];

  // ---- chat (چت) ----
  const chatSections = [
    { key:'FINANCIAL', label:'مالی' },
    { key:'ACCOUNTING', label:'حسابداری' },
    { key:'ORDER', label:'سفارش' },
    { key:'THR_WHOLESALE', label:'بنکداری تهران' },
    { key:'OTHER', label:'عمومی' },
  ];
  const chat = [
    { from:'them', name:'پشتیبانی', time:'۱۰:۱۲', text:'سلام، خدمت شما. بفرمایید.' },
    { from:'me', name:'شما', time:'۱۰:۱۳', text:'سلام خسته نباشید' },
    { from:'me', name:'شما', time:'۱۰:۱۳', text:'لطفاً پرینت حساب وزنی از اول سال ارسال بفرمایید' },
    { from:'them', name:'حسابداری', time:'۱۲:۱۲', attach:{type:'pdf', name:'TRIMsC.pdf', size:'۲٫۳ مگابایت'} },
    { from:'them', name:'حسابداری', time:'۱۲:۱۳', text:'فرستادم خدمتتان. در خدمتیم.' },
  ];

  const settings = { marketOpen:true, dealerRespondSec:50, clientConfirmSec:30, date:'شنبه ۶ تیر', clock:'۱۴:۲۵:۰۳' };

  window.DATA = { products, account, balance, transactions, orders, chat, chatSections, settings, goldPriceNow };
  window.FA = { faDigits, group, toman, gram, pct, faNum };
})();
