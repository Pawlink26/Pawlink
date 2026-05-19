import { useState, useRef, useEffect } from "react";

// ── Supabase ──────────────────────────────────────────────
const SUPABASE_URL = "https://dmbfawpmgemqpbzpsbdm.supabase.co";
const SUPABASE_KEY = "sb_publishable__0eHRyn3NQ_5qG2YeWcdxA_Ijr29Ivq";

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sbAuth(action, email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${action}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// ── Google Fonts ──────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #f7f4ef;
    --warm-white: #fffdf9;
    --sand: #e8e0d0;
    --sage: #6b8f71;
    --sage-light: #eef4ef;
    --sage-dark: #4a6b50;
    --amber: #d97706;
    --amber-light: #fef3c7;
    --coral: #e05c3a;
    --coral-light: #fef0eb;
    --slate: #374151;
    --slate-mid: #6b7280;
    --slate-light: #9ca3af;
    --border: #e5ddd0;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
    --radius: 16px;
    --radius-sm: 10px;
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; }
  h1,h2,h3,h4 { font-family: 'Inter', sans-serif; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.15); } }

  .fade-up  { animation: fadeUp 0.5s ease both; }
  .fade-up-1{ animation: fadeUp 0.5s 0.08s ease both; }
  .fade-up-2{ animation: fadeUp 0.5s 0.16s ease both; }
  .fade-up-3{ animation: fadeUp 0.5s 0.24s ease both; }
  .fade-in  { animation: fadeIn 0.3s ease both; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer;
    border-radius: var(--radius-sm); transition: all 0.18s; border: none;
    white-space: nowrap;
  }
  .btn-primary { background: var(--sage); color: #fff; box-shadow: 0 2px 8px rgba(107,143,113,0.28); }
  .btn-primary:hover { background: var(--sage-dark); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(107,143,113,0.38); }
  .btn-secondary { background: transparent; color: var(--sage); border: 1.5px solid var(--sage) !important; }
  .btn-secondary:hover { background: var(--sage-light); }
  .btn-coral { background: var(--coral); color: #fff; box-shadow: 0 2px 8px rgba(224,92,58,0.28); }
  .btn-coral:hover { background: #c4482a; transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--slate-mid); border: 1px solid var(--border) !important; }
  .btn-ghost:hover { background: var(--cream); color: var(--slate); }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-md { padding: 11px 22px; font-size: 14px; }
  .btn-lg { padding: 14px 32px; font-size: 16px; }

  .input, .select, .textarea {
    width: 100%; padding: 11px 15px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    background: var(--warm-white); font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--slate);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input:focus, .select:focus, .textarea:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(107,143,113,0.14); }
  .input::placeholder, .textarea::placeholder { color: var(--slate-light); }
  .select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 13px center; cursor: pointer; }
  .textarea { resize: vertical; font-family: 'DM Sans', sans-serif; }
  .label { display: block; font-size: 12px; font-weight: 600; color: var(--slate-mid); margin-bottom: 5px; letter-spacing: 0.04em; text-transform: uppercase; }

  .card { background: var(--warm-white); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
  .card-hover:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }

  .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.04em; text-transform: uppercase; }
  .badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
  .badge-urgent   { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
  .badge-good     { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
  .badge-info     { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .badge-sage     { background: var(--sage-light); color: var(--sage-dark); border: 1px solid #c7dfc9; }
  .badge-overflow { background: #fef0eb; color: var(--coral); border: 1px solid #fbd0c3; }

  .tab-bar { display: flex; background: var(--cream); border-radius: 12px; padding: 4px; border: 1px solid var(--border); }
  .tab { flex: 1; padding: 9px 10px; border: none; border-radius: 9px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.18s; background: transparent; color: var(--slate-mid); display: flex; align-items: center; justify-content: center; gap: 6px; }
  .tab.active { background: #fff; color: var(--slate); font-weight: 600; box-shadow: var(--shadow-sm); }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(55,65,81,0.5); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
  .modal { background: var(--warm-white); border-radius: 20px; box-shadow: var(--shadow-lg); max-height: 92vh; overflow-y: auto; animation: fadeUp 0.25s ease; }

  .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius-sm); padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--cream); }
  .upload-zone:hover { border-color: var(--sage); background: var(--sage-light); }

  .progress-track { height: 7px; background: var(--sand); border-radius: 4px; overflow: hidden; }
  .progress-fill  { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  .filter-chip { padding: 7px 16px; border-radius: 20px; border: 1.5px solid var(--border); background: var(--warm-white); color: var(--slate-mid); font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .filter-chip.active { border-color: var(--sage); background: var(--sage-light); color: var(--sage-dark); font-weight: 600; }
  .filter-chip:hover:not(.active) { border-color: var(--slate-light); color: var(--slate); }

  .nav-link { padding: 8px 14px; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--slate-mid); cursor: pointer; border-radius: 8px; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
  .nav-link:hover { background: var(--cream); color: var(--slate); }
  .nav-link.active { background: var(--sage); color: #fff; font-weight: 600; }

  .toast { position: fixed; top: 20px; right: 20px; z-index: 500; background: var(--sage); color: #fff; padding: 13px 20px; border-radius: 12px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 500; max-width: 360px; animation: slideDown 0.3s ease; }

  .section-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }

  .stat-card { background: var(--warm-white); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; display: flex; gap: 14px; align-items: center; }
  .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }

  .animal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px; }
  .shelter-list { display: grid; gap: 14px; }

  .trait-pill { font-size: 12px; padding: 4px 11px; border-radius: 7px; font-weight: 600; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 3px; }

  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .animal-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
    .nav-link span { display: none; }
  }
  @media (max-width: 480px) {
    .animal-grid { grid-template-columns: 1fr; }
  }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ── Constants ──────────────────────────────────────────────
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const SEED_SHELTERS = [
  { id:"s1", name:"Austin Animal Center", city:"Austin", state:"TX", type:"Municipal Shelter", email:"intake@austinanimals.org", phone:"(512) 978-0500", website:"austinanimals.org", totalSpace:120, availableSpace:34, needsHelp:false, canTake:["Dogs","Cats"], bio:"Austin's largest open-intake shelter, committed to a no-kill community.", verified:true },
  { id:"s2", name:"Houston SPCA", city:"Houston", state:"TX", type:"Non-Profit Rescue", email:"intake@houstonspca.org", phone:"(713) 869-7722", website:"houstonspca.org", totalSpace:200, availableSpace:82, needsHelp:false, canTake:["Dogs","Cats","Small Animals"], bio:"Serving Houston since 1924. Dedicated to ending animal cruelty and finding loving homes.", verified:true },
  { id:"s3", name:"Dallas Animal Services", city:"Dallas", state:"TX", type:"Municipal Shelter", email:"DAS@dallas.gov", phone:"(214) 670-8246", website:"", totalSpace:150, availableSpace:6, needsHelp:true, canTake:[], bio:"City of Dallas animal shelter. Currently at critical capacity and seeking transfer partners.", verified:true },
  { id:"s4", name:"Denver Dumb Friends League", city:"Denver", state:"CO", type:"Non-Profit Rescue", email:"info@ddfl.org", phone:"(303) 751-5772", website:"ddfl.org", totalSpace:180, availableSpace:55, needsHelp:false, canTake:["Dogs","Cats"], bio:"Colorado's largest animal welfare organization, helping pets and people since 1910.", verified:true },
  { id:"s5", name:"LA Animal Services", city:"Los Angeles", state:"CA", type:"Municipal Shelter", email:"info@laanimalservices.com", phone:"(888) 452-7381", website:"laanimalservices.com", totalSpace:300, availableSpace:12, needsHelp:true, canTake:[], bio:"Six shelters across LA County. Currently over capacity and seeking urgent transfer partners.", verified:true },
];

const SEED_ANIMALS = [
  { id:"a1", name:"Bruno", species:"Dog", breed:"Pit Bull Mix", age:"3 years", sex:"Male", weight:"52 lbs", color:"Brindle", shelterId:"s3", shelterName:"Dallas Animal Services", shelterCity:"Dallas", shelterState:"TX", shelterPhone:"(214) 670-8246", shelterEmail:"DAS@dallas.gov", daysLeft:2, status:"critical", description:"Bruno is a sweet, house-trained boy who has been patiently waiting for his forever home. He gets along with other dogs and loves belly rubs. Knows basic commands.", photos:[], vaccinated:true, neutered:true, goodWithKids:true, goodWithDogs:true, goodWithCats:false, fee:"$50", id_num:"DAS-2024-4421" },
  { id:"a2", name:"Mittens", species:"Cat", breed:"Domestic Shorthair", age:"5 years", sex:"Female", weight:"9 lbs", color:"Gray Tabby", shelterId:"s3", shelterName:"Dallas Animal Services", shelterCity:"Dallas", shelterState:"TX", shelterPhone:"(214) 670-8246", shelterEmail:"DAS@dallas.gov", daysLeft:2, status:"critical", description:"Mittens is a gentle, quiet lady who loves slow mornings and lap time. Perfect for a calm household looking for a low-maintenance companion.", photos:[], vaccinated:true, neutered:true, goodWithKids:true, goodWithDogs:false, goodWithCats:true, fee:"$35", id_num:"DAS-2024-4398" },
  { id:"a3", name:"Rex", species:"Dog", breed:"German Shepherd Mix", age:"2 years", sex:"Male", weight:"68 lbs", color:"Black & Tan", shelterId:"s1", shelterName:"Austin Animal Center", shelterCity:"Austin", shelterState:"TX", shelterPhone:"(512) 978-0500", shelterEmail:"intake@austinanimals.org", daysLeft:5, status:"urgent", description:"Rex is active, intelligent, and eager to please. Knows sit, stay, and shake. Loves fetch and long hikes. Best with an active family who has a yard.", photos:[], vaccinated:true, neutered:false, goodWithKids:true, goodWithDogs:true, goodWithCats:false, fee:"$75", id_num:"AAC-2024-8812" },
  { id:"a4", name:"Luna", species:"Cat", breed:"Siamese Mix", age:"1 year", sex:"Female", weight:"7 lbs", color:"Seal Point", shelterId:"s1", shelterName:"Austin Animal Center", shelterCity:"Austin", shelterState:"TX", shelterPhone:"(512) 978-0500", shelterEmail:"intake@austinanimals.org", daysLeft:4, status:"urgent", description:"Luna is playful, social, and incredibly chatty — a true Siamese personality. She loves interactive toys and would thrive with another cat for companionship.", photos:[], vaccinated:true, neutered:true, goodWithKids:true, goodWithDogs:false, goodWithCats:true, fee:"$50", id_num:"AAC-2024-9001" },
  { id:"a5", name:"Biscuit", species:"Dog", breed:"Beagle", age:"6 years", sex:"Male", weight:"28 lbs", color:"Tricolor", shelterId:"s5", shelterName:"LA Animal Services", shelterCity:"Los Angeles", shelterState:"CA", shelterPhone:"(888) 452-7381", shelterEmail:"info@laanimalservices.com", daysLeft:3, status:"critical", description:"Biscuit is a calm, loving senior who just wants a couch to call his own. House trained, great with kids, and perfectly content with short daily walks.", photos:[], vaccinated:true, neutered:true, goodWithKids:true, goodWithDogs:true, goodWithCats:true, fee:"$25", id_num:"LAAS-2024-1122" },
  { id:"a6", name:"Shadow", species:"Cat", breed:"Domestic Longhair", age:"3 years", sex:"Male", weight:"11 lbs", color:"Black", shelterId:"s5", shelterName:"LA Animal Services", shelterCity:"Los Angeles", shelterState:"CA", shelterPhone:"(888) 452-7381", shelterEmail:"info@laanimalservices.com", daysLeft:3, status:"critical", description:"Shadow is a stunning black longhair who is shy at first but becomes incredibly affectionate once he trusts you. Loves windows, bird watching, and chin scratches.", photos:[], vaccinated:true, neutered:true, goodWithKids:false, goodWithDogs:false, goodWithCats:true, fee:"$35", id_num:"LAAS-2024-1130" },
];

const MSGS_SEED = [
  { id:1, from:"Dallas Animal Services", fromId:"s3", time:"10:32 AM", text:"We're at critical capacity — can anyone take 3 dogs this week? Two pit mixes and a shepherd. All vetted and vaccinated." },
  { id:2, from:"Houston SPCA", fromId:"s2", time:"10:45 AM", text:"Yes! We can take up to 5 dogs. Can you arrange transport by Thursday?" },
  { id:3, from:"Dallas Animal Services", fromId:"s3", time:"11:00 AM", text:"Thursday works. Sending health records over today. Thank you 🙏" },
  { id:4, from:"Denver Dumb Friends League", fromId:"s4", time:"11:14 AM", text:"We can also take 2 small dogs if needed. Just DM us." },
];

// ── Brand Wordmark Logo ────────────────────────────────────

// ── Custom Brand Icons ─────────────────────────────────────
// All hand-crafted SVGs specific to RescuPawLink's visual language
const I = {
  // Branded paw — softer, rounder toe beans with unique proportions
  paw: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><ellipse cx="8.5" cy="7" rx="2" ry="2.5" fill="currentColor" opacity=".7"/><ellipse cx="15.5" cy="7" rx="2" ry="2.5" fill="currentColor" opacity=".7"/><ellipse cx="5.5" cy="12" rx="1.7" ry="2.2" fill="currentColor" opacity=".5"/><ellipse cx="18.5" cy="12" rx="1.7" ry="2.2" fill="currentColor" opacity=".5"/><path d="M12 22c-4 0-7-2.5-7-6 0-2.5 1.8-4 3.5-4C9.7 12 11 12.6 12 13.5c1-.9 2.3-1.5 3.5-1.5 1.7 0 3.5 1.5 3.5 4 0 3.5-3 6-7 6z" fill="currentColor"/></svg>,

  // Home — shelter house with a heart chimney
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"/><path d="M9 21v-8h6v8"/><path d="M12 6.5c.5-.8 1.5-.8 2 0 .3.5.1 1.1-.4 1.5L12 9.5l-1.6-1.5c-.5-.4-.7-1-.4-1.5.5-.8 1.5-.8 2 0z" fill="currentColor" stroke="none" opacity=".6"/></svg>,

  // Heart with paw inside — brand signature icon for adoption
  heartPaw: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 000-7.8z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="10" cy="11" rx="1.2" ry="1.5" fill="currentColor"/><ellipse cx="14" cy="11" rx="1.2" ry="1.5" fill="currentColor"/><ellipse cx="8.5" cy="13.5" rx="1" ry="1.3" fill="currentColor" opacity=".6"/><ellipse cx="15.5" cy="13.5" rx="1" ry="1.3" fill="currentColor" opacity=".6"/><path d="M12 19c-2.5 0-4-1.5-4-3.5 0-1.5 1-2.5 2-2.5.7 0 1.5.4 2 1 .5-.6 1.3-1 2-1 1 0 2 1 2 2.5 0 2-1.5 3.5-4 3.5z" fill="currentColor"/></svg>,

  // Network — three shelters connected with a paw center
  network: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="2.5" fill="currentColor" opacity=".2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="20" r="2"/><line x1="7" y1="6.5" x2="10.5" y2="10.5"/><line x1="17" y1="6.5" x2="13.5" y2="10.5"/><line x1="12" y1="14.5" x2="12" y2="18"/></svg>,

  // Chat bubbles — two overlapping, shows two-way conversation
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 14a2 2 0 01-2 2H9l-4 4V6a2 2 0 012-2h12a2 2 0 012 2v8z" opacity=".4" fill="currentColor"/><path d="M17 10a2 2 0 01-2 2H5l-3 3V4a2 2 0 012-2h11a2 2 0 012 2v6z" fill="currentColor" opacity=".15" stroke="currentColor"/></svg>,

  // Plus — rounded, softer
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,

  // Upload — cloud with upward arrow
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m0 0L8 7m4-4l4 4"/><path d="M20.4 17.6A5 5 0 0018 9h-1.3A8 8 0 103 16.3" opacity=".7"/></svg>,

  // Checkmark — rounded, confident
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13l5 5L20 7"/></svg>,

  // X close
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,

  // Pin — location marker with soft inner dot
  pin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22S4 15.5 4 9.5a8 8 0 0116 0C20 15.5 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor" opacity=".4"/></svg>,

  // Phone
  phone: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>,

  // Mail — envelope with heart flap
  mail: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 7l8.5 6.5a2.5 2.5 0 003 0L22 7"/></svg>,

  // Shield — verified partner badge
  shield: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5.5v6c0 4.8 3.4 9.3 8 10.4 4.6-1.1 8-5.6 8-10.4v-6L12 2z" opacity=".9"/><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,

  // Logout
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,

  // Search — magnifier with paw hint
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>,

  // Filter
  filter: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,

  // Arrow right
  arrow: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/></svg>,

  // Alert triangle — urgent
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3H20.5a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>,

  // Capacity / gauge icon for shelter space
  capacity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z" opacity=".2" fill="currentColor"/><path d="M6.3 17.7A7 7 0 0112 5"/><path d="M17.7 17.7A7 7 0 0012 5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><line x1="12" y1="12" x2="16" y2="8" strokeWidth="2"/></svg>,

  // Transfer arrows — two animals passing between shelters
  transfer: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,

  // Dog silhouette — brand-specific
  dog: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity=".85"><path d="M17 4c0-1.1-.9-2-2-2h-1l-1 2H9L8 2H7C5.9 2 5 2.9 5 4v2L3 8v4h2v5a1 1 0 002 0v-5h10v5a1 1 0 002 0v-5h2V8l-2-2V4zM9 10H7V8h2v2zm8 0h-2V8h2v2z"/></svg>,

  // Cat silhouette — brand-specific
  cat: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity=".85"><path d="M18 3l-2 4H8L6 3 3 6v6c0 5 2 9 9 9s9-4 9-9V6l-3-3zm-5 12H11v-2h2v2zm-4-4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z"/></svg>,
};

function Spinner() {
  return <div style={{ width:18, height:18, border:"2.5px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />;
}

function Toast({ msg }) {
  return (
    <div className="toast">
      <span style={{ color:"#a7f3d0", flexShrink:0 }}>{I.check}</span>
      {msg}
    </div>
  );
}

// ── ChatSystem Component ──────────────────────────────────
const CHANNELS = [
  { id:"all",       label:"📢 All Shelters",      desc:"Network-wide announcements and coordination" },
  { id:"urgent",    label:"🚨 Urgent Transfers",   desc:"Animals that need placement in under 72 hours" },
  { id:"transport", label:"🚗 Transport Board",    desc:"Volunteer drivers and transport coordination" },
  { id:"medical",   label:"💉 Medical Needs",      desc:"Animals needing medical support or sponsorship" },
  { id:"dogs",      label:"🐕 Dog Network",        desc:"Dog-specific placement and breed rescue" },
  { id:"cats",      label:"🐈 Cat Network",        desc:"Cat-specific placement and rescue coordination" },
];

const CHANNEL_SEED = {
  all:       [{ id:1, from:"Dallas Animal Services", fromId:"s3", time:"10:32 AM", text:"We're at critical capacity — can anyone take 3 dogs? Two pit mixes and a shepherd. All vaccinated." }, { id:2, from:"Houston SPCA", fromId:"s2", time:"10:45 AM", text:"Yes! We can take up to 5 dogs. Can you arrange transport by Thursday?" }, { id:3, from:"Dallas Animal Services", fromId:"s3", time:"11:00 AM", text:"Thursday works. Sending health records today. Thank you 🙏" }, { id:4, from:"Denver Dumb Friends League", fromId:"s4", time:"11:14 AM", text:"We can also take 2 small dogs if needed. Just DM us." }],
  urgent:    [{ id:1, from:"LA Animal Services", fromId:"s5", time:"8:00 AM", text:"URGENT: We have 6 dogs with 24-hour deadline. Looking for any foster or transfer partner in SoCal or willing to transport." }, { id:2, from:"Austin Animal Center", fromId:"s1", time:"8:22 AM", text:"We can take 2 if transport is arranged. Please DM us directly." }],
  transport: [{ id:1, from:"Houston SPCA", fromId:"s2", time:"Yesterday", text:"Anyone doing a run from DFW to Houston this week? We have 3 dogs lined up needing a ride." }, { id:2, from:"Dallas Animal Services", fromId:"s3", time:"Yesterday", text:"We might be able to arrange something. DMing you now." }],
  medical:   [{ id:1, from:"Austin Animal Center", fromId:"s1", time:"Monday", text:"Looking for a rescue that can take a dog with a broken leg. Surgery already done, just needs recovery foster." }],
  dogs:      [{ id:1, from:"Denver Dumb Friends League", fromId:"s4", time:"Tuesday", text:"We have 8 open dog kennels this week. Prioritizing bully breeds and large dogs. Send us a DM." }],
  cats:      [{ id:1, from:"Houston SPCA", fromId:"s2", time:"Wednesday", text:"We pulled 14 cats from a hoarding situation. Looking for rescue partners to help place. All have been vet-checked." }],
};

function ChatSystem({ user, shelters, messages, setMessages, msgText, setMsgText, msgEndRef, sendMsg, isLoggedIn, onLogin, dmTarget, setDmTarget }) {
  const [activeChannel, setActiveChannel] = useState("all");
  const [view, setView] = useState("channels"); // channels | dms
  const [channelMsgs, setChannelMsgs] = useState(CHANNEL_SEED);
  const [dmMsgs, setDmMsgs] = useState({
    "s1-s3": [{ id:1, from:"Austin Animal Center", fromId:"s1", time:"9:15 AM", text:"Hey Dallas — we have a few dogs we're trying to place. Any foster connections in your area?" }],
    "s2-s3": [{ id:1, from:"Dallas Animal Services", fromId:"s3", time:"10:32 AM", text:"We're critically over capacity. Can you take 3 dogs this week?" }, { id:2, from:"Houston SPCA", fromId:"s2", time:"10:45 AM", text:"Yes! We can take up to 5. Can you arrange transport by Thursday?" }],
    "s1-s2": [{ id:1, from:"Houston SPCA", fromId:"s2", time:"Tuesday", text:"Quick question — do you have capacity for cats right now? We have overflow." }],
  });
  const [activeDm, setActiveDm] = useState(dmTarget || null);
  const [input, setInput] = useState(msgText || "");
  const [unread, setUnread] = useState({ "s2-s3":1, "s1-s2":1, urgent:1 });
  const chatRef = useRef();

  useEffect(() => {
    if (dmTarget) { setView("dms"); setActiveDm(dmTarget); }
  }, [dmTarget]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [activeChannel, activeDm, view, channelMsgs, dmMsgs]);

  function getDmKey(a, b) {
    return [a, b].sort().join("-");
  }

  function sendChannelMsg() {
    if (!input.trim() || !isLoggedIn) return;
    const msg = { id:Date.now(), from:user.name, fromId:user.id, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), text:input };
    setChannelMsgs(p => ({ ...p, [activeChannel]: [...(p[activeChannel]||[]), msg] }));
    setInput("");
  }

  function sendDmMsg() {
    if (!input.trim() || !isLoggedIn || !activeDm) return;
    const key = getDmKey(user.id, activeDm);
    const msg = { id:Date.now(), from:user.name, fromId:user.id, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), text:input };
    setDmMsgs(p => ({ ...p, [key]: [...(p[key]||[]), msg] }));
    setInput("");
    // Clear unread for this DM
    setUnread(p => { const n={...p}; delete n[key]; return n; });
  }

  function openDm(shelterId) {
    setActiveDm(shelterId);
    setView("dms");
    const key = getDmKey(user?.id, shelterId);
    setUnread(p => { const n={...p}; delete n[key]; return n; });
    setInput("");
  }

  const otherShelters = shelters.filter(s => s.id !== user?.id);
  const activeDmShelter = shelters.find(s => s.id === activeDm);
  const activeDmKey = activeDm && user ? getDmKey(user.id, activeDm) : null;
  const activeDmConvo = activeDmKey ? (dmMsgs[activeDmKey] || []) : [];
  const activeChannelMsgs = channelMsgs[activeChannel] || [];

  const totalUnread = Object.values(unread).reduce((s,v)=>s+v, 0);

  function MessageBubble({ m, myId }) {
    const isMe = m.fromId === myId;
    return (
      <div style={{ display:"flex", flexDirection:isMe?"row-reverse":"row", gap:9, alignItems:"flex-start" }}>
        <div style={{ width:32, height:32, borderRadius:9, background:isMe?"var(--sage-light)":"var(--cream)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🏠</div>
        <div style={{ maxWidth:"74%" }}>
          {!isMe && <div style={{ fontSize:11, color:"var(--slate-light)", marginBottom:3 }}>{m.from} · {m.time}</div>}
          {isMe && <div style={{ fontSize:11, color:"var(--slate-light)", marginBottom:3, textAlign:"right" }}>{m.time}</div>}
          <div style={{ background:isMe?"var(--sage)":"var(--warm-white)", color:isMe?"#fff":"var(--slate)", border:isMe?"none":"1px solid var(--border)", borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px", padding:"10px 14px", fontSize:14, lineHeight:1.55, boxShadow:isMe?"none":"var(--shadow-sm)" }}>
            {m.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:30, marginBottom:5 }}>Coordinator Messaging</h1>
          <p style={{ color:"var(--slate-mid)", fontSize:14 }}>Group channels for the whole network + private messages between shelters.</p>
        </div>
        {totalUnread > 0 && (
          <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
            🔔 {totalUnread} unread message{totalUnread!==1?"s":""}
          </div>
        )}
      </div>

      {!isLoggedIn && (
        <div style={{ background:"var(--amber-light)", border:"1px solid #fde68a", borderRadius:12, padding:"14px 20px", marginBottom:18, fontSize:14, color:"#92400e", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <span>🔒 Sign in to send messages and access private DMs between shelters.</span>
          <button onClick={onLogin} style={{ background:"var(--amber)", border:"none", color:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13 }}>Sign In</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:18, height:600 }}>

        {/* ── LEFT SIDEBAR ── */}
        <div className="card" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Toggle */}
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)" }}>
            <div className="tab-bar" style={{ gap:4 }}>
              <button className={`tab ${view==="channels"?"active":""}`} onClick={()=>setView("channels")} style={{ fontSize:12 }}>
                # Channels
              </button>
              <button className={`tab ${view==="dms"?"active":""}`} onClick={()=>setView("dms")} style={{ fontSize:12, position:"relative" }}>
                💬 Direct
                {Object.keys(unread).some(k=>k.includes("-")) && (
                  <span style={{ position:"absolute", top:-4, right:-4, width:8, height:8, background:"#dc2626", borderRadius:"50%" }}/>
                )}
              </button>
            </div>
          </div>

          {/* Channel list */}
          {view === "channels" && (
            <div style={{ flex:1, overflowY:"auto", padding:"10px 10px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--slate-light)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, padding:"0 4px" }}>Channels</div>
              {CHANNELS.map(ch => {
                const hasUnread = !!unread[ch.id];
                const isActive = activeChannel === ch.id && view === "channels";
                return (
                  <div key={ch.id} onClick={()=>{ setActiveChannel(ch.id); setView("channels"); setUnread(p=>{const n={...p};delete n[ch.id];return n;}); setInput(""); }}
                    style={{ padding:"9px 12px", borderRadius:9, marginBottom:2, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", background:isActive?"var(--sage-light)":"transparent", transition:"background 0.15s" }}
                    onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="var(--cream)"; }}
                    onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
                    <span style={{ fontSize:13, fontWeight:isActive||hasUnread?700:400, color:isActive?"var(--sage-dark)":hasUnread?"var(--slate)":"var(--slate-mid)" }}>
                      {ch.label}
                    </span>
                    {hasUnread && <span style={{ width:8, height:8, borderRadius:"50%", background:"#dc2626", flexShrink:0 }}/>}
                  </div>
                );
              })}

              <div style={{ fontSize:11, fontWeight:700, color:"var(--slate-light)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"14px 0 8px", padding:"0 4px" }}>Online Now</div>
              {shelters.map(s=>(
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", fontSize:12, color:"var(--slate-mid)", borderRadius:8, cursor:isLoggedIn&&s.id!==user?.id?"pointer":"default" }}
                  onClick={()=>{ if(isLoggedIn && s.id!==user?.id) openDm(s.id); }}
                  onMouseEnter={e=>{ if(isLoggedIn&&s.id!==user?.id) e.currentTarget.style.background="var(--cream)"; }}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", flexShrink:0 }}/>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{s.name}</span>
                  {s.id===user?.id && <span style={{ fontSize:10, color:"var(--sage)", fontWeight:600 }}>you</span>}
                  {isLoggedIn && s.id!==user?.id && <span style={{ fontSize:10, color:"var(--slate-light)" }}>DM</span>}
                </div>
              ))}
            </div>
          )}

          {/* DM list */}
          {view === "dms" && (
            <div style={{ flex:1, overflowY:"auto", padding:"10px 10px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--slate-light)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, padding:"0 4px" }}>Direct Messages</div>
              {!isLoggedIn ? (
                <div style={{ padding:"20px 10px", textAlign:"center", color:"var(--slate-light)", fontSize:13 }}>Sign in to access private messages</div>
              ) : (
                <>
                  {otherShelters.map(s => {
                    const key = getDmKey(user.id, s.id);
                    const convo = dmMsgs[key] || [];
                    const lastMsg = convo[convo.length-1];
                    const hasUnread = !!unread[key];
                    const isActive = activeDm === s.id && view === "dms";
                    return (
                      <div key={s.id} onClick={()=>openDm(s.id)}
                        style={{ padding:"10px 12px", borderRadius:10, marginBottom:4, cursor:"pointer", background:isActive?"var(--sage-light)":"transparent", border:isActive?"1px solid #c7dfc9":"1px solid transparent", transition:"all 0.15s" }}
                        onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="var(--cream)"; }}
                        onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:isActive?"var(--sage)":"var(--sand)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🏠</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <span style={{ fontSize:13, fontWeight:hasUnread||isActive?700:500, color:isActive?"var(--sage-dark)":"var(--slate)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                              {lastMsg && <span style={{ fontSize:10, color:"var(--slate-light)", flexShrink:0, marginLeft:4 }}>{lastMsg.time}</span>}
                            </div>
                            {lastMsg && <div style={{ fontSize:12, color:"var(--slate-mid)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2, fontWeight:hasUnread?600:400 }}>{lastMsg.text}</div>}
                            {!lastMsg && <div style={{ fontSize:12, color:"var(--slate-light)", marginTop:2, fontStyle:"italic" }}>No messages yet</div>}
                          </div>
                          {hasUnread && <div style={{ width:8, height:8, borderRadius:"50%", background:"#dc2626", flexShrink:0 }}/>}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:10, padding:"0 4px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--slate-light)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Start New DM</div>
                    {otherShelters.filter(s => !Object.keys(dmMsgs).some(k=>k.includes(s.id)&&k.includes(user.id))).map(s=>(
                      <div key={s.id} onClick={()=>openDm(s.id)} style={{ padding:"8px 12px", borderRadius:9, cursor:"pointer", fontSize:13, color:"var(--slate-mid)", display:"flex", alignItems:"center", gap:7, transition:"background 0.15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--cream)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{ fontSize:16 }}>✉️</span> {s.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Chat window ── */}
        <div className="card" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Channel header */}
          {view === "channels" && (
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{CHANNELS.find(c=>c.id===activeChannel)?.label}</div>
                <div style={{ fontSize:12, color:"var(--slate-light)", marginTop:2 }}>{CHANNELS.find(c=>c.id===activeChannel)?.desc}</div>
              </div>
              <div style={{ fontSize:12, color:"var(--slate-light)" }}>{shelters.length} members</div>
            </div>
          )}

          {/* DM header */}
          {view === "dms" && activeDmShelter && (
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"var(--sage-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏠</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{activeDmShelter.name}</div>
                  <div style={{ fontSize:12, color:"#22c55e", display:"flex", alignItems:"center", gap:4 }}><div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e" }}/> Online</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {activeDmShelter.phone && <a href={`tel:${activeDmShelter.phone}`} style={{ fontSize:12, color:"var(--sage)", textDecoration:"none", background:"var(--sage-light)", border:"1px solid #c7dfc9", borderRadius:8, padding:"5px 11px", fontWeight:600 }}>📞 Call</a>}
                {activeDmShelter.email && <a href={`mailto:${activeDmShelter.email}`} style={{ fontSize:12, color:"var(--sage)", textDecoration:"none", background:"var(--sage-light)", border:"1px solid #c7dfc9", borderRadius:8, padding:"5px 11px", fontWeight:600 }}>✉️ Email</a>}
              </div>
            </div>
          )}

          {/* DM header — no shelter selected */}
          {view === "dms" && !activeDmShelter && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--slate-light)", gap:12 }}>
              <div style={{ fontSize:48 }}>💬</div>
              <div style={{ fontSize:16, fontWeight:600, color:"var(--slate-mid)" }}>Select a shelter to message</div>
              <div style={{ fontSize:14 }}>Choose from the left or start a new conversation.</div>
            </div>
          )}

          {/* Messages area */}
          {(view === "channels" || (view === "dms" && activeDmShelter)) && (
            <>
              <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
                {(view === "channels" ? activeChannelMsgs : activeDmConvo).map(m => (
                  <MessageBubble key={m.id} m={m} myId={user?.id} />
                ))}
                {(view === "channels" ? activeChannelMsgs : activeDmConvo).length === 0 && (
                  <div style={{ textAlign:"center", padding:"40px", color:"var(--slate-light)" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                    <div style={{ fontSize:14 }}>No messages yet. Be the first to say something.</div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ padding:"14px 16px", borderTop:"1px solid var(--border)", background:"var(--warm-white)" }}>
                {isLoggedIn ? (
                  <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
                    <div style={{ flex:1 }}>
                      <textarea
                        className="input textarea"
                        rows={2}
                        value={input}
                        onChange={e=>setInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); view==="channels"?sendChannelMsg():sendDmMsg(); }}}
                        placeholder={view==="channels" ? `Message #${CHANNELS.find(c=>c.id===activeChannel)?.label.split(" ").slice(1).join(" ")}...` : `Message ${activeDmShelter?.name}...`}
                        style={{ resize:"none", borderRadius:12, fontSize:14 }}
                      />
                      <div style={{ fontSize:11, color:"var(--slate-light)", marginTop:4 }}>Press Enter to send · Shift+Enter for new line</div>
                    </div>
                    <button className="btn btn-primary btn-md" style={{ padding:"12px 20px", flexShrink:0 }}
                      onClick={view==="channels"?sendChannelMsg:sendDmMsg}>
                      Send
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign:"center", padding:"10px", color:"var(--slate-mid)", fontSize:14 }}>
                    <button onClick={onLogin} style={{ background:"none", border:"none", color:"var(--sage)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>Sign in</button> to send messages
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

}

// ── MAIN APP ──────────────────────────────────────────────
export default function RescuPawLink() {
  const [page, setPage]           = useState("landing");
  const [authMode, setAuthMode]   = useState("login");
  const [tab, setTab]             = useState("adopt");
  const [user, setUser]           = useState(null);
  const [shelters, setShelters]   = useState(SEED_SHELTERS);
  const [animals, setAnimals]     = useState(SEED_ANIMALS);
  const [messages, setMessages]   = useState(MSGS_SEED);
  const [toast, setToast]         = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [claimTarget, setClaimTarget]       = useState(null);
  const [applyTarget, setApplyTarget]       = useState(null);
  const [postStep, setPostStep]   = useState(1);
  const [loading, setLoading]     = useState(false);
  const [authErr, setAuthErr]     = useState("");
  const msgEndRef = useRef();

  // Filters — adopt page
  const [fSpecies, setFSpecies] = useState("All");
  const [fState,   setFState]   = useState("");
  const [fCity,    setFCity]    = useState("");
  const [fSearch,  setFSearch]  = useState("");

  // Filters — network page
  const [nState,   setNState]   = useState("");
  const [nNeedsHelp, setNNeedsHelp] = useState(false);
  const [nCanTake, setNCanTake] = useState(false);

  // Forms
  const [loginF,  setLoginF]  = useState({ email:"", password:"" });
  const [regF,    setRegF]    = useState({ orgName:"", type:"", city:"", state:"", email:"", phone:"", password:"", confirm:"" });
  const [postF,   setPostF]   = useState({ name:"", species:"Dog", breed:"", age:"", sex:"", weight:"", color:"", description:"", daysLeft:7, vaccinated:false, neutered:false, goodWithKids:false, goodWithDogs:false, goodWithCats:false, fee:"", photos:[] });
  const [capF,    setCapF]    = useState({ total:"", available:"", needsHelp:false, canTakeDogs:false, canTakeCats:false, canTakeSmall:false, overflow:"" });
  const [msgText, setMsgText] = useState("");
  const [dmTarget, setDmTarget] = useState(null); // shelter id for active DM
  const [dmMessages, setDmMessages] = useState({
    "s1-s3": [{ id:1, from:"Austin Animal Center", fromId:"s1", to:"s3", time:"9:15 AM", text:"Hey Dallas — we have a few dogs we're trying to place. Any chance you have foster connections in your area?" }],
    "s2-s3": [{ id:1, from:"Dallas Animal Services", fromId:"s3", to:"s2", time:"10:32 AM", text:"We're critically over capacity. Can you take 3 dogs this week?" }, { id:2, from:"Houston SPCA", fromId:"s2", to:"s3", time:"10:45 AM", text:"Yes! We can take up to 5. Arrange transport by Thursday?" }],
  });
  const [applyF,  setApplyF]  = useState({ name:"", email:"", phone:"", message:"", type:"adopt" });

  const fileRef = useRef();

  function showToast(m) { setToast(m); setTimeout(() => setToast(""), 4000); }

  // ── Load data on mount ──────────────────────────
  useEffect(() => {
    loadShelters();
    loadAnimals();
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const token = localStorage.getItem("rpl_token");
      const shelterId = localStorage.getItem("rpl_shelter_id");
      if (!token || !shelterId) return;
      const data = await sbFetch(`shelters?id=eq.${shelterId}`);
      if (data?.[0]) setUser(data[0]);
    } catch(e) { console.log("No session"); }
  }

  async function loadShelters() {
    try {
      const data = await sbFetch("shelters?order=name");
      if (data?.length) setShelters(data);
    } catch(e) { console.log("Using seed shelters"); }
  }

  async function loadAnimals() {
    try {
      const data = await sbFetch("animals?order=days_left");
      if (data?.length) setAnimals(data.map(a => ({
        ...a,
        daysLeft: a.days_left,
        shelterName: a.shelter_name,
        shelterCity: a.shelter_city,
        shelterState: a.shelter_state,
        shelterPhone: a.shelter_phone,
        shelterEmail: a.shelter_email,
        goodWithKids: a.good_with_kids,
        goodWithDogs: a.good_with_dogs,
        goodWithCats: a.good_with_cats,
      })));
    } catch(e) { console.log("Using seed animals"); }
  }

  // ── Auth ────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault(); setAuthErr(""); setLoading(true);
    try {
      const result = await sbAuth("token?grant_type=password", loginF.email, loginF.password);
      if (result.error) { setAuthErr(result.error_description || "Invalid email or password."); setLoading(false); return; }
      localStorage.setItem("rpl_token", result.access_token);
      // Find shelter by email
      const shelterData = await sbFetch(`shelters?email=eq.${encodeURIComponent(loginF.email)}`);
      if (shelterData?.[0]) {
        localStorage.setItem("rpl_shelter_id", shelterData[0].id);
        setUser(shelterData[0]);
        setPage("app"); setTab("dashboard");
        showToast(`Welcome back, ${shelterData[0].name}!`);
      } else {
        setAuthErr("Account found but shelter profile missing. Please register again.");
      }
    } catch(e) {
      setAuthErr("Login failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault(); setAuthErr(""); setLoading(true);
    if (regF.password !== regF.confirm) { setAuthErr("Passwords do not match."); setLoading(false); return; }
    try {
      // Sign up with Supabase Auth
      const result = await sbAuth("signup", regF.email, regF.password);
      if (result.error) { setAuthErr(result.error_description || "Registration failed."); setLoading(false); return; }
      // Create shelter profile
      const shelterData = await sbFetch("shelters", {
        method: "POST",
        body: JSON.stringify({
          name: regF.orgName, type: regF.type, city: regF.city,
          state: regF.state, email: regF.email, phone: regF.phone,
          total_space: 0, available_space: 0, needs_help: false,
          can_take: [], bio: "", verified: false,
        }),
      });
      const newShelter = shelterData?.[0] || {
        id: `s${Date.now()}`, name: regF.orgName, city: regF.city,
        state: regF.state, type: regF.type, email: regF.email,
        phone: regF.phone, totalSpace: 0, availableSpace: 0,
        needsHelp: false, canTake: [], bio: "", verified: false,
      };
      if (result.access_token) localStorage.setItem("rpl_token", result.access_token);
      localStorage.setItem("rpl_shelter_id", newShelter.id);
      setShelters(p => [...p, newShelter]);
      setUser(newShelter); setPage("app"); setTab("dashboard");
      showToast(`Welcome to RescuPawLink, ${regF.orgName}!`);
    } catch(e) {
      // Fallback to local if Supabase tables not set up yet
      const ns = { id:`s${Date.now()}`, name:regF.orgName, city:regF.city, state:regF.state, type:regF.type, email:regF.email, phone:regF.phone, totalSpace:0, availableSpace:0, needsHelp:false, canTake:[], bio:"", verified:false };
      setShelters(p => [...p, ns]);
      setUser(ns); setPage("app"); setTab("dashboard");
      showToast(`Welcome to RescuPawLink, ${regF.orgName}!`);
    }
    setLoading(false);
  }

  function handleSignOut() {
    localStorage.removeItem("rpl_token");
    localStorage.removeItem("rpl_shelter_id");
    setUser(null); setPage("landing");
  }

  // ── Photo upload ────────────────────────────────
  function handlePhotos(files) {
    Array.from(files).forEach(f => {
      if (!f.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = e => setPostF(p => ({ ...p, photos: [...p.photos, e.target.result].slice(0,6) }));
      r.readAsDataURL(f);
    });
  }

  // ── Post animal ─────────────────────────────────
  async function submitPost(e) {
    e.preventDefault();
    const a = {
      id:`a${Date.now()}`, ...postF,
      shelterId:user.id, shelterName:user.name,
      shelterCity:user.city, shelterState:user.state,
      shelterPhone:user.phone, shelterEmail:user.email,
      status: postF.daysLeft<=2?"critical":postF.daysLeft<=5?"urgent":"good",
      postedAt:new Date().toISOString().split("T")[0]
    };
    // Save to Supabase
    try {
      await sbFetch("animals", {
        method: "POST",
        body: JSON.stringify({
          name: postF.name, species: postF.species, breed: postF.breed,
          age: postF.age, sex: postF.sex, weight: postF.weight,
          color: postF.color, description: postF.description,
          days_left: postF.daysLeft, vaccinated: postF.vaccinated,
          neutered: postF.neutered, good_with_kids: postF.goodWithKids,
          good_with_dogs: postF.goodWithDogs, good_with_cats: postF.goodWithCats,
          fee: postF.fee, photos: postF.photos,
          shelter_id: user.id, shelter_name: user.name,
          shelter_city: user.city, shelter_state: user.state,
          shelter_phone: user.phone, shelter_email: user.email,
          status: a.status,
        }),
      });
    } catch(err) { console.log("Saved locally only"); }
    setAnimals(p => [...p, a]);
    setPostF({ name:"", species:"Dog", breed:"", age:"", sex:"", weight:"", color:"", description:"", daysLeft:7, vaccinated:false, neutered:false, goodWithKids:false, goodWithDogs:false, goodWithCats:false, fee:"", photos:[] });
    setPostStep(1); setTab("dashboard");
    showToast(`${a.name} is now live on RescuPawLink!`);
  }

  // ── Update capacity ─────────────────────────────
  async function submitCap(e) {
    e.preventDefault();
    const canTake = [capF.canTakeDogs&&"Dogs", capF.canTakeCats&&"Cats", capF.canTakeSmall&&"Small Animals"].filter(Boolean);
    const updates = { totalSpace:+capF.total||user.totalSpace, availableSpace:+capF.available||user.availableSpace, needsHelp:capF.needsHelp, canTake };
    // Save to Supabase
    try {
      await sbFetch(`shelters?id=eq.${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          total_space: updates.totalSpace, available_space: updates.availableSpace,
          needs_help: updates.needsHelp, can_take: updates.canTake,
        }),
      });
    } catch(err) { console.log("Saved locally only"); }
    setShelters(p => p.map(s => s.id===user.id ? { ...s, ...updates } : s));
    setUser(p => ({ ...p, ...updates }));
    showToast("Capacity updated and broadcast to network!");
  }

  // ── Send message ────────────────────────────────
  function sendMsg() {
    if (!msgText.trim()) return;
    setMessages(p => [...p, { id:Date.now(), from:user?.name||"Guest", fromId:user?.id, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), text:msgText }]);
    setMsgText("");
    setTimeout(() => msgEndRef.current?.scrollIntoView({behavior:"smooth"}), 50);
  }

  // ── Derived ─────────────────────────────────────
  const myAnimals   = animals.filter(a => a.shelterId === user?.id);
  const userShelter = shelters.find(s => s.id === user?.id);

  const filteredAnimals = animals.filter(a => {
    if (fSpecies !== "All" && a.species !== fSpecies) return false;
    if (fState   && a.shelterState !== fState)        return false;
    if (fCity    && !a.shelterCity.toLowerCase().includes(fCity.toLowerCase())) return false;
    if (fSearch  && !a.name.toLowerCase().includes(fSearch.toLowerCase()) && !a.breed.toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  }).sort((a,b) => a.daysLeft - b.daysLeft);

  const filteredShelters = shelters.filter(s => {
    if (nState && s.state !== nState) return false;
    if (nNeedsHelp && !s.needsHelp)  return false;
    if (nCanTake && s.canTake.length === 0) return false;
    return true;
  });

  const capPct   = s => s.totalSpace > 0 ? Math.round((s.availableSpace / s.totalSpace) * 100) : 0;
  const capColor = s => { const p = capPct(s); return p < 10 ? "#dc2626" : p < 30 ? "#d97706" : "#16a34a"; };

  const stateBadgeColor = status => status === "critical" ? "badge-critical" : status === "urgent" ? "badge-urgent" : "badge-good";

  // ─────────────────────────────────────────────────────────
  // LANDING PAGE
  // ─────────────────────────────────────────────────────────
  const featuredAnimals = [...animals].sort((a,b) => a.daysLeft - b.daysLeft).slice(0,3);

  const SUCCESS_STORIES = [
    { name:"Max & Daisy", outcome:"Transferred from Dallas to Houston — both adopted within 48 hours", shelters:"Dallas Animal Services → Houston SPCA", emoji:"🐕🐕", date:"May 2025" },
    { name:"The Tuxedo Trio", outcome:"3 bonded cats moved to Denver when LA hit capacity. All 3 found one home together.", shelters:"LA Animal Services → Denver Dumb Friends League", emoji:"🐈🐈🐈", date:"April 2025" },
    { name:"Biscuit", outcome:"6-year-old beagle hours from deadline. Foster in Austin stepped up same day via RescuPawLink.", shelters:"Austin Animal Center + Foster Network", emoji:"🐕", date:"March 2025" },
  ];

  const BENEFITS = [
    { icon:I.capacity, title:"Live Capacity Board",     desc:"See who has space right now — updated in real time. No more phone tag." },
    { icon:I.chat,     title:"Direct Coordinator Chat", desc:"Message shelter staff directly or broadcast to the whole network." },
    { icon:I.alert,    title:"Overflow Alerts",         desc:"Flag when you're over capacity. Every partner sees it immediately." },
    { icon:I.paw,      title:"Animal Listings",         desc:"Post animals with real photos. Reach adopters and fosters nationwide." },
    { icon:I.transfer, title:"Transfer Requests",       desc:"Request space at a partner shelter in one click. They get notified instantly." },
    { icon:I.network,  title:"Network Reach",           desc:"Your listings reach beyond your local area — 38 states and growing." },
  ];

  if (page === "landing") return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a1a", background:"#fff", minHeight:"100vh" }}>
      {toast && <Toast msg={toast} />}

      {/* ─── NAV ─────────────────────────────────── */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #f0ede8", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1140, margin:"0 auto", padding:"0 40px", height:68, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {/* Wordmark */}
          <button onClick={()=>setPage("landing")} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>
              <span style={{ color:"var(--sage)" }}>Rescue</span>
              <span style={{ color:"#1a1a1a" }}>PawLink</span>
            </div>
          </button>

          {/* Nav links */}
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {[
              ["Find Animals",    ()=>{ setPage("app"); setTab("adopt"); }],
              ["Shelter Network", ()=>{ setPage("app"); setTab("network"); }],
            ].map(([label, fn]) => (
              <button key={label} onClick={fn}
                style={{ padding:"8px 16px", border:"none", background:"transparent", color:"#666", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit", borderRadius:8, transition:"color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.color="#666"}>
                {label}
              </button>
            ))}
            <div style={{ width:1, height:18, background:"#e5e7eb", margin:"0 8px" }}/>
            <button onClick={()=>{ setAuthMode("login"); setPage("login"); }}
              style={{ padding:"8px 16px", border:"none", background:"transparent", color:"#666", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit", borderRadius:8 }}
              onMouseEnter={e=>e.currentTarget.style.color="#1a1a1a"}
              onMouseLeave={e=>e.currentTarget.style.color="#666"}>
              Sign In
            </button>
            <button onClick={()=>{ setAuthMode("register"); setPage("login"); }}
              style={{ padding:"10px 22px", border:"none", background:"var(--sage)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", borderRadius:8, marginLeft:4, transition:"all 0.18s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="var(--sage-dark)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="var(--sage)"; e.currentTarget.style.transform="translateY(0)"; }}>
              Register Free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO — full bleed photo ─────────────── */}
      <div style={{ position:"relative", height:"88vh", minHeight:560, overflow:"hidden" }}>

        {/* Your photo — full bleed */}
        <img
          src="https://i.imgur.com/VxvRJfd.png"
          alt="Dog and cat"
          onError={e=>{ e.target.style.display="none"; }}
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }}
        />

        {/* Left-to-right gradient so text is readable over photo */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(255,253,249,0.96) 0%, rgba(255,253,249,0.85) 35%, rgba(255,253,249,0.3) 60%, rgba(255,253,249,0) 80%)" }}/>

        {/* Bottom fade into white */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(to top, #fff, transparent)" }}/>

        {/* Text — left side */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center" }}>
          <div style={{ maxWidth:1140, margin:"0 auto", padding:"0 40px", width:"100%" }}>
            <div style={{ maxWidth:540 }}>

              {/* Badge */}
              <div className="fade-up" style={{ display:"inline-flex", alignItems:"center", gap:7, background:"var(--sage-light)", border:"1px solid #c7dfc9", borderRadius:20, padding:"6px 16px", fontSize:11, fontWeight:700, color:"var(--sage-dark)", marginBottom:28, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                Free · Shelter-to-Shelter Network
              </div>

              {/* Headline */}
              <h1 className="fade-up-1" style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(42px,5.5vw,74px)", fontWeight:900, lineHeight:1.0, color:"#1a1a1a", marginBottom:20, letterSpacing:"-2.5px" }}>
                CONNECTING<br/>
                SHELTERS.<br/>
                <span style={{ color:"var(--sage)" }}>SAVING LIVES.</span>
              </h1>

              {/* Subtext */}
              <p className="fade-up-2" style={{ fontSize:17, color:"#555", lineHeight:1.75, marginBottom:32, maxWidth:420 }}>
                Share capacity, coordinate transfers, and get animals placed — before time runs out. Free for every shelter and rescue.
              </p>

              {/* CTAs */}
              <div className="fade-up-3" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:44 }}>
                <button onClick={()=>{ setPage("app"); setTab("adopt"); }}
                  style={{ padding:"15px 30px", borderRadius:9, border:"none", background:"var(--sage)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", boxShadow:"0 4px 20px rgba(107,143,113,0.35)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="var(--sage-dark)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="var(--sage)"; e.currentTarget.style.transform="translateY(0)"; }}>
                  Find Animals Near You
                </button>
                <button onClick={()=>{ setAuthMode("register"); setPage("login"); }}
                  style={{ padding:"15px 30px", borderRadius:9, border:"1.5px solid #ccc", background:"rgba(255,255,255,0.85)", color:"#1a1a1a", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", backdropFilter:"blur(4px)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="#ccc"; e.currentTarget.style.transform="translateY(0)"; }}>
                  Register Your Shelter →
                </button>
              </div>

              {/* Stats */}
              <div className="fade-up-3" style={{ display:"flex", gap:28, paddingTop:24, borderTop:"1px solid rgba(0,0,0,0.1)" }}>
                {[["12,400+","Animals Connected"],["400+","Partner Shelters"],["38","States Covered"]].map(([n,l])=>(
                  <div key={l}>
                    <div style={{ fontFamily:"'Inter',sans-serif", fontSize:22, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:11, color:"#888", marginTop:4, letterSpacing:"0.02em" }}>{l}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Live alert pill — bottom right */}
        <div style={{ position:"absolute", bottom:28, right:36, background:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)", borderRadius:12, padding:"11px 18px", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", border:"1px solid #f0ede8", display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#dc2626", flexShrink:0, animation:"pulse 1.5s ease-in-out infinite" }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{animals.filter(a=>a.status==="critical").length || 6} animals critical right now</div>
            <div style={{ fontSize:11, color:"#9ca3af" }}>Across the RescuPawLink network</div>
          </div>
        </div>
      </div>

      {/* ─── FEATURED ANIMALS ────────────────────── */}
      <div style={{ padding:"80px 40px", background:"#fafaf8" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>

          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:44, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--sage)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Urgent — Needs You Now</div>
              <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:"#1a1a1a", lineHeight:1.1, letterSpacing:"-1px" }}>Animals Running Out of Time</h2>
            </div>
            <button onClick={()=>{ setPage("app"); setTab("adopt"); }}
              style={{ padding:"12px 22px", border:"1.5px solid #1a1a1a", background:"transparent", color:"#1a1a1a", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", borderRadius:8, transition:"all 0.18s", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#1a1a1a"; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#1a1a1a"; }}>
              View All Animals →
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:22 }}>
            {featuredAnimals.map((a,i) => (
              <div key={a.id} className="fade-up" style={{ animationDelay:`${i*0.08}s`, background:"#fff", borderRadius:18, overflow:"hidden", border:"1px solid #f0ede8", cursor:"pointer", transition:"all 0.22s" }}
                onClick={()=>{ setPage("app"); setTab("adopt"); setSelectedAnimal(a); }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-5px)"; e.currentTarget.style.boxShadow="0 16px 48px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>

                {/* Photo */}
                <div style={{ height:220, background:a.photos?.[0]?"transparent":`linear-gradient(135deg,${a.status==="critical"?"#fef2f2,#fee2e2":"#fffbeb,#fef3c7"})`, overflow:"hidden", position:"relative" }}>
                  {a.photos?.[0]
                    ? <img src={a.photos[0]} alt={a.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:90 }}>{a.species==="Dog"?"🐕":a.species==="Cat"?"🐈":"🐾"}</div>
                  }
                  <div style={{ position:"absolute", top:12, left:12 }}>
                    <span style={{ background:a.status==="critical"?"#dc2626":"#d97706", color:"#fff", fontSize:10, fontWeight:800, padding:"4px 11px", borderRadius:20, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                      {a.status==="critical"?"⚠ Critical":"⏱ Urgent"}
                    </span>
                  </div>
                  <div style={{ position:"absolute", bottom:12, right:12, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", color:"#fff", borderRadius:7, padding:"4px 10px", fontSize:12, fontWeight:700 }}>
                    {a.daysLeft} day{a.daysLeft!==1?"s":""} left
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding:"18px 20px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:5 }}>
                    <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:20, fontWeight:700, color:"#1a1a1a" }}>{a.name}</h3>
                    <span style={{ fontSize:12, color:"#888", background:"#f5f5f3", padding:"3px 9px", borderRadius:6, marginLeft:8, flexShrink:0 }}>{a.age}</span>
                  </div>
                  <div style={{ fontSize:13, color:"#aaa", marginBottom:10 }}>{a.breed}</div>
                  <p style={{ fontSize:14, color:"#444", lineHeight:1.6, marginBottom:14, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{a.description}</p>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid #f5f5f3" }}>
                    <span style={{ fontSize:12, color:"#aaa" }}>📍 {a.shelterCity}, {a.shelterState}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--sage)" }}>Learn More →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FOR SHELTERS ────────────────────────── */}
      <div style={{ padding:"80px 40px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }}>

            {/* Left — copy */}
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--sage)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12 }}>For Shelters & Rescues</div>
              <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:"#1a1a1a", lineHeight:1.1, marginBottom:20, letterSpacing:"-1px" }}>
                Your Network Is<br/>Stronger Together
              </h2>
              <p style={{ fontSize:16, color:"#555", lineHeight:1.75, marginBottom:32 }}>
                When one shelter is full, another has space. RescuPawLink makes that connection instant — no phone tag, no guessing.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:36 }}>
                {BENEFITS.map(b => (
                  <div key={b.title} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:38, height:38, borderRadius:9, background:"var(--sage-light)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"var(--sage)" }}>
                      {b.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a", marginBottom:2 }}>{b.title}</div>
                      <div style={{ fontSize:13, color:"#777", lineHeight:1.55 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>{ setAuthMode("register"); setPage("login"); }}
                style={{ padding:"15px 30px", border:"none", background:"#1a1a1a", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", borderRadius:9, transition:"all 0.2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="var(--sage)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#1a1a1a"; e.currentTarget.style.transform="translateY(0)"; }}>
                Register Free — 2 Minutes
              </button>
            </div>

            {/* Right — live shelter cards */}
            <div style={{ display:"grid", gap:12 }}>
              {shelters.filter(s=>s.totalSpace>0).slice(0,3).map(s => {
                const pct = Math.round((s.availableSpace/s.totalSpace)*100);
                const col = pct<10?"#dc2626":pct<30?"#d97706":"#16a34a";
                return (
                  <div key={s.id} style={{ background:"#fff", border:"1px solid #f0ede8", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{s.name}</div>
                        <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>📍 {s.city}, {s.state}</div>
                      </div>
                      <span style={{ fontSize:10, background:s.needsHelp?"#fee2e2":"#dcfce7", color:s.needsHelp?"#dc2626":"#16a34a", padding:"4px 10px", borderRadius:20, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                        {s.needsHelp?"Needs Help":"Has Space"}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5, color:"#aaa" }}>
                      <span>Available space</span>
                      <span style={{ fontWeight:700, color:col }}>{s.availableSpace} / {s.totalSpace}</span>
                    </div>
                    <div style={{ height:5, background:"#f0ede8", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:3, transition:"width 0.5s" }}/>
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>{ setPage("app"); setTab("network"); }}
                style={{ padding:"13px", border:"1.5px dashed #ccc", background:"transparent", color:"#888", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit", borderRadius:14, transition:"all 0.18s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--sage)"; e.currentTarget.style.color="var(--sage)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#ccc"; e.currentTarget.style.color="#888"; }}>
                View Full Network →
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ─── SUCCESS STORIES ─────────────────────── */}
      <div style={{ padding:"80px 40px", background:"#fafaf8" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--sage)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Real Impact</div>
            <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:"#1a1a1a", letterSpacing:"-1px" }}>Lives Saved Through the Network</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
            {SUCCESS_STORIES.map(s => (
              <div key={s.name} style={{ background:"#fff", borderRadius:18, border:"1px solid #f0ede8", padding:"28px 24px" }}>
                <div style={{ fontSize:36, marginBottom:16 }}>{s.emoji}</div>
                <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:18, fontWeight:800, color:"#1a1a1a", marginBottom:8, letterSpacing:"-0.3px" }}>{s.name}</h3>
                <p style={{ fontSize:14, color:"#555", lineHeight:1.7, marginBottom:14, fontStyle:"italic" }}>"{s.outcome}"</p>
                <div style={{ height:1, background:"#f0ede8", marginBottom:12 }}/>
                <div style={{ fontSize:12, color:"#aaa" }}>🔗 {s.shelters}</div>
                <div style={{ fontSize:11, color:"#ccc", marginTop:3 }}>{s.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOW IT WORKS ────────────────────────── */}
      <div style={{ padding:"80px 40px" }}>
        <div style={{ maxWidth:860, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--sage)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Simple by Design</div>
          <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, color:"#1a1a1a", marginBottom:12, letterSpacing:"-1px" }}>How It Works</h2>
          <p style={{ fontSize:16, color:"#666", marginBottom:56, lineHeight:1.65 }}>Built for shelter staff. Fast, simple, focused on what matters.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:36 }}>
            {[
              { n:"01", icon:I.home,     t:"Register Free",  d:"Create your shelter account in under 2 minutes." },
              { n:"02", icon:I.capacity, t:"Set Capacity",   d:"Update your space live. The network sees it instantly." },
              { n:"03", icon:I.transfer, t:"Connect",        d:"Message partners, request transfers, arrange transport." },
              { n:"04", icon:I.heartPaw, t:"Save Lives",     d:"Animals get placed — not lost in the system." },
            ].map(c => (
              <div key={c.n}>
                <div style={{ width:54, height:54, borderRadius:14, background:"var(--sage-light)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"var(--sage)" }}>
                  {c.icon}
                </div>
                <div style={{ fontSize:10, fontWeight:800, color:"var(--sage)", letterSpacing:"0.12em", marginBottom:6, textTransform:"uppercase" }}>Step {c.n}</div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:700, color:"#1a1a1a", marginBottom:7, letterSpacing:"-0.2px" }}>{c.t}</div>
                <div style={{ fontSize:13, color:"#777", lineHeight:1.6 }}>{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FINAL CTA ───────────────────────────── */}
      <div style={{ margin:"0 40px 80px", borderRadius:20, background:"linear-gradient(135deg, var(--sage-dark) 0%, var(--sage) 100%)", padding:"72px 56px", textAlign:"center", maxWidth:1060, marginLeft:"auto", marginRight:"auto" }}>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,4vw,48px)", fontWeight:900, color:"#fff", marginBottom:14, lineHeight:1.1, letterSpacing:"-1px" }}>
          Together, we save more lives.
        </h2>
        <p style={{ color:"rgba(255,255,255,0.75)", fontSize:16, maxWidth:420, margin:"0 auto 36px", lineHeight:1.7 }}>
          Join hundreds of shelters using RescuPawLink to coordinate, connect, and save animals — for free.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={()=>{ setAuthMode("register"); setPage("login"); }}
            style={{ padding:"16px 36px", borderRadius:9, border:"none", background:"#fff", color:"var(--sage-dark)", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.15)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            Register Your Shelter →
          </button>
          <button onClick={()=>{ setPage("app"); setTab("adopt"); }}
            style={{ padding:"16px 36px", borderRadius:9, border:"2px solid rgba(255,255,255,0.45)", background:"transparent", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            Browse Animals
          </button>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────── */}
      <footer style={{ borderTop:"1px solid #f0ede8", padding:"44px 40px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:17, fontWeight:800, color:"#1a1a1a", letterSpacing:"-0.3px", marginBottom:5 }}>
              <span style={{ color:"var(--sage)" }}>Rescue</span>PawLink
            </div>
            <div style={{ fontSize:12, color:"#aaa" }}>Free for shelters and rescues · forever</div>
          </div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              ["Find Animals",    ()=>{ setPage("app"); setTab("adopt"); }],
              ["Shelter Network", ()=>{ setPage("app"); setTab("network"); }],
              ["Register",        ()=>{ setAuthMode("register"); setPage("login"); }],
              ["Sign In",         ()=>{ setAuthMode("login"); setPage("login"); }],
            ].map(([l,fn]) => (
              <button key={l} onClick={fn}
                style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:500, transition:"color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseLeave={e=>e.currentTarget.style.color="#888"}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ fontSize:12, color:"#ccc" }}>© 2025 RescuPawLink · Built to save lives</div>
        </div>
      </footer>

    </div>
  );

  // AUTH
  // ─────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#eef4ef,#f7f4ef)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div className="card fade-up" style={{ width:"100%", maxWidth:480, padding:"36px 40px" }}>
        <button onClick={() => setPage("landing")} style={{ background:"none", border:"none", color:"var(--slate-mid)", cursor:"pointer", fontSize:13, marginBottom:22, display:"flex", alignItems:"center", gap:5 }}>← Back</button>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:22, fontWeight:800, color:"var(--slate)", letterSpacing:"-0.5px" }}>
            <span style={{ color:"var(--sage)" }}>Rescue</span>PawLink
          </div>
        </div>

        <div className="tab-bar" style={{ marginBottom:26 }}>
          {[["login","Sign In"],["register","Create Account"]].map(([v,l]) => (
            <button key={v} className={`tab ${authMode===v?"active":""}`} onClick={() => { setAuthMode(v); setAuthErr(""); }}>{l}</button>
          ))}
        </div>

        {authErr && <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:9, padding:"10px 14px", fontSize:13, marginBottom:18 }}>{authErr}</div>}

        {authMode === "login" ? (
          <form onSubmit={handleLogin}>
            <h2 style={{ fontSize:22, marginBottom:4 }}>Welcome back</h2>
            <p style={{ color:"var(--slate-mid)", fontSize:13, marginBottom:22 }}>Sign in to your shelter account.</p>
            <div style={{ marginBottom:14 }}><label className="label">Email</label><input className="input" type="email" required placeholder="intake@yourshelter.org" value={loginF.email} onChange={e=>setLoginF(p=>({...p,email:e.target.value}))} /></div>
            <div style={{ marginBottom:6 }}><label className="label">Password</label><input className="input" type="password" required placeholder="••••••••" value={loginF.password} onChange={e=>setLoginF(p=>({...p,password:e.target.value}))} /></div>
            <div style={{ fontSize:12, color:"var(--slate-light)", marginBottom:22 }}>Demo: any shelter email + password "demo"</div>
            <button className="btn btn-primary btn-md" type="submit" style={{ width:"100%", padding:13 }} disabled={loading}>{loading ? <Spinner /> : "Sign In"}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2 style={{ fontSize:22, marginBottom:4 }}>Join RescuPawLink</h2>
            <p style={{ color:"var(--slate-mid)", fontSize:13, marginBottom:22 }}>Free for all shelters and rescues.</p>
            <div style={{ display:"grid", gap:13 }}>
              <div><label className="label">Organization Name *</label><input className="input" required placeholder="e.g. Denver Humane Society" value={regF.orgName} onChange={e=>setRegF(p=>({...p,orgName:e.target.value}))} /></div>
              <div><label className="label">Type *</label>
                <select className="select" required value={regF.type} onChange={e=>setRegF(p=>({...p,type:e.target.value}))}>
                  <option value="">Select...</option>
                  {["Municipal Shelter","Non-Profit Rescue","Foster Network","Private Shelter","Breed-Specific Rescue"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 80px", gap:10 }}>
                <div><label className="label">City *</label><input className="input" required placeholder="Denver" value={regF.city} onChange={e=>setRegF(p=>({...p,city:e.target.value}))} /></div>
                <div><label className="label">State *</label><input className="input" required placeholder="CO" maxLength={2} value={regF.state} onChange={e=>setRegF(p=>({...p,state:e.target.value.toUpperCase()}))} /></div>
              </div>
              <div><label className="label">Email *</label><input className="input" type="email" required placeholder="intake@yourshelter.org" value={regF.email} onChange={e=>setRegF(p=>({...p,email:e.target.value}))} /></div>
              <div><label className="label">Phone</label><input className="input" type="tel" placeholder="(555) 000-0000" value={regF.phone} onChange={e=>setRegF(p=>({...p,phone:e.target.value}))} /></div>
              <div><label className="label">Password *</label><input className="input" type="password" required placeholder="••••••••" value={regF.password} onChange={e=>setRegF(p=>({...p,password:e.target.value}))} /></div>
              <div><label className="label">Confirm Password *</label><input className="input" type="password" required placeholder="••••••••" value={regF.confirm} onChange={e=>setRegF(p=>({...p,confirm:e.target.value}))} /></div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width:"100%", padding:13, fontSize:15, marginTop:18 }} disabled={loading}>{loading ? <Spinner /> : "Create Free Account"}</button>
          </form>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────────────
  const isLoggedIn = !!user;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"var(--slate)", background:"var(--cream)", minHeight:"100vh" }}>
      {toast && <Toast msg={toast} />}

      {/* Header */}
      <header style={{ background:"var(--warm-white)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:100, boxShadow:"var(--shadow-sm)" }}>
        <div style={{ maxWidth:1160, margin:"0 auto", padding:"0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <button onClick={() => setPage("landing")} style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0 }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:18, fontWeight:800, color:"var(--slate)", letterSpacing:"-0.5px" }}>
              <span style={{ color:"var(--sage)" }}>Rescue</span>PawLink
            </div>
          </button>

          <nav style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
            {[
              { key:"adopt",   label:"Adoptable Animals", icon:I.heartPaw },
              { key:"network", label:"Shelter Network",   icon:I.network },
              ...(isLoggedIn ? [
                { key:"chat",      label:"Coordinator Chat", icon:I.chat },
                { key:"post",      label:"Post Animal",      icon:I.plus },
                { key:"dashboard", label:"Dashboard",        icon:I.home },
              ] : []),
            ].map(t => (
              <button key={t.key} className={`nav-link ${tab===t.key?"active":""}`} onClick={() => setTab(t.key)}>
                {t.icon}<span className="hide-mobile">{t.label}</span>
              </button>
            ))}
          </nav>

          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
            {isLoggedIn ? (
              <>
                <span style={{ fontSize:13, color:"var(--slate-mid)", fontWeight:500 }} className="hide-mobile">{user.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>{I.logout} <span className="hide-mobile">Sign Out</span></button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthMode("login"); setPage("login"); }}>Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

        {/* ══ ADOPTABLE ANIMALS ══════════════════════════════ */}
        {tab === "adopt" && (
          <div className="fade-in">
            <div className="section-header">
              <div>
                <h1 style={{ fontSize:30, marginBottom:5 }}>Adoptable Animals</h1>
                <p style={{ color:"var(--slate-mid)", fontSize:14 }}>Real listings from shelters across the country — sorted by urgency.</p>
              </div>
              <div style={{ fontSize:13, color:"var(--slate-mid)", background:"var(--warm-white)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
                <strong style={{ color:"var(--slate)" }}>{filteredAnimals.length}</strong> animals found
              </div>
            </div>

            {/* Critical banner — always visible to everyone */}
            {animals.filter(a=>a.status==="critical" && (fSpecies==="All"||a.species===fSpecies)).length > 0 && !fState && !fCity && !fSearch && (
              <div style={{ background:"linear-gradient(135deg,#fff1f2,#fff5f5)", border:"1.5px solid #fca5a5", borderRadius:14, padding:"18px 22px", marginBottom:22 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight:700, color:"#dc2626", fontSize:15 }}>Running Out of Time</div>
                    <div style={{ fontSize:13, color:"#ef4444" }}>These animals have 48 hours or less. Adopt, foster, or share — every action helps.</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {animals.filter(a=>a.status==="critical" && (fSpecies==="All"||a.species===fSpecies)).map(a=>(
                    <div key={a.id} onClick={()=>setSelectedAnimal(a)} style={{ display:"flex", alignItems:"center", gap:9, background:"#fff", border:"1px solid #fca5a5", borderRadius:10, padding:"8px 14px", cursor:"pointer", transition:"box-shadow 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(220,38,38,0.12)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", background:"var(--sand)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {a.photos?.[0] ? <img src={a.photos[0]} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:22 }}>{a.species==="Dog"?"🐕":"🐈"}</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13 }}>{a.name}</div>
                        <div style={{ fontSize:11, color:"#ef4444", fontWeight:600 }}>⏱ {a.daysLeft} day{a.daysLeft!==1?"s":""} · {a.shelterCity}, {a.shelterState}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="card" style={{ padding:"18px 20px", marginBottom:24 }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                {/* Search */}
                <div style={{ flex:"1 1 180px", minWidth:160 }}>
                  <label className="label">Search</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--slate-light)" }}>{I.search}</span>
                    <input className="input" placeholder="Name or breed..." value={fSearch} onChange={e=>setFSearch(e.target.value)} style={{ paddingLeft:34 }} />
                  </div>
                </div>
                {/* State */}
                <div style={{ flex:"0 0 120px" }}>
                  <label className="label">State</label>
                  <select className="select" value={fState} onChange={e=>setFState(e.target.value)}>
                    <option value="">All States</option>
                    {US_STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                {/* City */}
                <div style={{ flex:"1 1 140px", minWidth:120 }}>
                  <label className="label">City</label>
                  <input className="input" placeholder="Any city" value={fCity} onChange={e=>setFCity(e.target.value)} />
                </div>
                {/* Species chips */}
                <div>
                  <label className="label">Species</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {["All","Dog","Cat","Other"].map(sp=>(
                      <button key={sp} className={`filter-chip ${fSpecies===sp?"active":""}`} onClick={()=>setFSpecies(sp)}>
                        {sp==="Dog"?"🐕":sp==="Cat"?"🐈":sp==="Other"?"🐾":""} {sp}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Clear */}
                {(fSearch||fState||fCity||fSpecies!=="All") && (
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setFSearch("");setFState("");setFCity("");setFSpecies("All");}}>Clear filters</button>
                )}
              </div>
            </div>

            {filteredAnimals.length === 0 ? (
              <div style={{ textAlign:"center", padding:"70px 20px", color:"var(--slate-mid)" }}>
                <div style={{ fontSize:48, marginBottom:10 }}>🐾</div>
                <div style={{ fontSize:18, fontWeight:600, marginBottom:6 }}>No animals match</div>
                <div style={{ fontSize:14 }}>Try adjusting your filters.</div>
              </div>
            ) : (
              <div className="animal-grid">
                {filteredAnimals.map((a,i) => (
                  <div key={a.id} className="card card-hover fade-up" style={{ animationDelay:`${i*0.05}s`, cursor:"pointer", overflow:"hidden" }} onClick={()=>setSelectedAnimal(a)}>
                    {/* Photo */}
                    <div style={{ height:195, background:a.photos?.[0]?"transparent":`linear-gradient(135deg,${a.status==="critical"?"#fef2f2,#fee2e2":a.status==="urgent"?"#fffbeb,#fef3c7":"#f0fdf4,#dcfce7"})`, overflow:"hidden", position:"relative" }}>
                      {a.photos?.[0]
                        ? <img src={a.photos[0]} alt={a.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:80 }}>{a.species==="Dog"?"🐕":a.species==="Cat"?"🐈":"🐾"}</div>
                      }
                      <div style={{ position:"absolute", top:10, left:10 }}>
                        <span className={`badge ${stateBadgeColor(a.status)}`}>{a.status==="critical"?"⚠ Critical":"⏱ Urgent"}</span>
                      </div>
                      <div style={{ position:"absolute", bottom:10, right:10, background:"rgba(0,0,0,0.52)", backdropFilter:"blur(4px)", color:"#fff", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:600 }}>
                        {a.daysLeft} day{a.daysLeft!==1?"s":""} left
                      </div>
                      {a.photos?.length > 1 && <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,0.52)", color:"#fff", borderRadius:7, padding:"3px 9px", fontSize:11 }}>📷 {a.photos.length}</div>}
                    </div>
                    <div style={{ padding:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:3 }}>
                        <h3 style={{ fontSize:19 }}>{a.name}</h3>
                        <span style={{ fontSize:12, color:"var(--slate-mid)", background:"var(--cream)", padding:"3px 9px", borderRadius:7, border:"1px solid var(--border)", flexShrink:0, marginLeft:6 }}>{a.sex}·{a.age}</span>
                      </div>
                      <div style={{ fontSize:13, color:"var(--slate-mid)", marginBottom:9 }}>{a.breed}</div>
                      <p style={{ fontSize:13, color:"var(--slate)", lineHeight:1.55, marginBottom:13, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{a.description}</p>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                        <span style={{ fontSize:12, color:"var(--slate-light)", display:"flex", alignItems:"center", gap:4 }}>{I.pin} {a.shelterCity}, {a.shelterState}</span>
                        <div style={{ display:"flex", gap:5 }}>
                          {a.vaccinated && <span className="trait-pill" style={{ background:"var(--sage-light)", color:"var(--sage-dark)" }}>Vacc'd</span>}
                          {a.neutered   && <span className="trait-pill" style={{ background:"#eff6ff", color:"#2563eb" }}>Altered</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SHELTER NETWORK ════════════════════════════════ */}
        {tab === "network" && (
          <div className="fade-in">
            {/* Header + login nudge */}
            <div className="section-header">
              <div>
                <h1 style={{ fontSize:30, marginBottom:5 }}>Shelter Network</h1>
                <p style={{ color:"var(--slate-mid)", fontSize:14 }}>Live capacity across every partner shelter. Connect, coordinate, and save animals together.</p>
              </div>
              {!isLoggedIn && (
                <button className="btn btn-primary btn-md" onClick={()=>{setAuthMode("register");setPage("login");}}>
                  🐾 Join to Connect
                </button>
              )}
            </div>

            {/* Sign-in prompt for guests */}
            {!isLoggedIn && (
              <div style={{ background:"linear-gradient(135deg,#eef4ef,#f0f7f0)", border:"1px solid #c7dfc9", borderRadius:16, padding:"24px 28px", marginBottom:24, display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:"var(--slate)", marginBottom:6 }}>🔗 Want to coordinate with these shelters?</div>
                  <p style={{ fontSize:14, color:"var(--slate-mid)", lineHeight:1.55 }}>Registered shelters can see full contact details, claim available space, send transfer requests, and message coordinators directly — all in one place.</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
                  <button className="btn btn-primary btn-md" onClick={()=>{setAuthMode("register");setPage("login");}}>Register Free</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setAuthMode("login");setPage("login");}}>Sign In</button>
                </div>
              </div>
            )}

            {/* Quick stats for logged-in users */}
            {isLoggedIn && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:22 }}>
                {[
                  { label:"Shelters Online", value:shelters.length, color:"var(--sage)", icon:"🏠" },
                  { label:"Need Help Now",   value:shelters.filter(s=>s.needsHelp).length, color:"#dc2626", icon:"⚠️" },
                  { label:"Have Open Space", value:shelters.filter(s=>s.availableSpace>0).length, color:"#16a34a", icon:"✅" },
                  { label:"Total Open Spots", value:shelters.reduce((sum,s)=>sum+s.availableSpace,0), color:"#2563eb", icon:"📊" },
                ].map(st=>(
                  <div key={st.label} className="card" style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:22 }}>{st.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:22, fontWeight:700, color:st.color, lineHeight:1 }}>{st.value}</div>
                      <div style={{ fontSize:12, color:"var(--slate-mid)", marginTop:2 }}>{st.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="card" style={{ padding:"16px 20px", marginBottom:22 }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div style={{ flex:"0 0 130px" }}>
                  <label className="label">State</label>
                  <select className="select" value={nState} onChange={e=>setNState(e.target.value)}>
                    <option value="">All States</option>
                    {US_STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"flex-end", flexWrap:"wrap" }}>
                  <button className={`filter-chip ${nNeedsHelp?"active":""}`} onClick={()=>setNNeedsHelp(p=>!p)}>
                    ⚠️ Needs Transfer Help
                  </button>
                  <button className={`filter-chip ${nCanTake?"active":""}`} onClick={()=>setNCanTake(p=>!p)}>
                    ✅ Has Open Space
                  </button>
                </div>
                {(nState||nNeedsHelp||nCanTake) && <button className="btn btn-ghost btn-sm" onClick={()=>{setNState("");setNNeedsHelp(false);setNCanTake(false);}}>Clear</button>}
                <div style={{ marginLeft:"auto", fontSize:13, color:"var(--slate-mid)" }}>{filteredShelters.length} shelter{filteredShelters.length!==1?"s":""}</div>
              </div>
            </div>

            <div className="shelter-list">
              {filteredShelters.map((s,i) => {
                const pct = capPct(s); const col = capColor(s);
                const sAnimals = animals.filter(a => a.shelterId === s.id);
                const isMe = s.id === user?.id;
                return (
                  <div key={s.id} className="card fade-up" style={{ animationDelay:`${i*0.06}s`, padding:"22px 24px", border:isMe?"2px solid var(--sage)":"1px solid var(--border)" }}>
                    {isMe && <div style={{ fontSize:11, fontWeight:700, color:"var(--sage)", letterSpacing:"0.08em", marginBottom:10 }}>YOUR SHELTER</div>}
                    <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>

                      {/* Avatar */}
                      <div style={{ width:48, height:48, borderRadius:12, background:s.needsHelp?"#fee2e2":"var(--sage-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                        {s.needsHelp?"⚠️":"🏠"}
                      </div>

                      {/* Info */}
                      <div style={{ flex:"1 1 180px", minWidth:160 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                          <span style={{ fontSize:17, fontWeight:700 }}>{s.name}</span>
                          {s.verified && <span style={{ fontSize:11, color:"var(--sage-dark)", display:"flex", alignItems:"center", gap:3, fontWeight:600 }}>{I.shield} Verified</span>}
                          {s.needsHelp && <span className="badge badge-overflow">⚠ Seeking Transfers</span>}
                        </div>
                        <div style={{ fontSize:13, color:"var(--slate-mid)", marginBottom:6 }}>📍 {s.city}, {s.state} · {s.type}</div>
                        {s.bio && <p style={{ fontSize:13, color:"var(--slate)", lineHeight:1.5, marginBottom:8 }}>{s.bio}</p>}

                        {/* Contact — full details for logged-in, blurred for guests */}
                        {isLoggedIn ? (
                          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                            {s.phone && <span style={{ fontSize:12, color:"var(--slate-mid)", display:"flex", alignItems:"center", gap:4 }}>{I.phone} {s.phone}</span>}
                            {s.email && <a href={`mailto:${s.email}`} style={{ fontSize:12, color:"var(--sage)", display:"flex", alignItems:"center", gap:4, textDecoration:"none", fontWeight:500 }}>{I.mail} {s.email}</a>}
                          </div>
                        ) : (
                          <div style={{ fontSize:12, color:"var(--slate-light)", display:"flex", alignItems:"center", gap:6, background:"var(--cream)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", width:"fit-content" }}>
                            🔒 Sign in to see contact details
                          </div>
                        )}
                      </div>

                      {/* Capacity meter */}
                      {s.totalSpace > 0 ? (
                        <div style={{ minWidth:190, flex:"0 0 190px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7, fontSize:13 }}>
                            <span style={{ color:"var(--slate-mid)" }}>Available space</span>
                            <span style={{ fontWeight:700, color:col }}>{s.availableSpace} / {s.totalSpace}</span>
                          </div>
                          <div className="progress-track"><div className="progress-fill" style={{ width:`${pct}%`, background:col }}/></div>
                          <div style={{ fontSize:11, color:"var(--slate-light)", marginTop:4 }}>{pct}% open</div>
                          {s.canTake.length > 0 && (
                            <div style={{ marginTop:10, display:"flex", gap:5, flexWrap:"wrap" }}>
                              {s.canTake.map(c=><span key={c} className="badge badge-good" style={{ fontSize:10 }}>✓ {c}</span>)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize:13, color:"var(--slate-light)", fontStyle:"italic", minWidth:120 }}>Capacity not set</div>
                      )}

                      {/* Action buttons — only for logged in, not own shelter */}
                      {isLoggedIn && !isMe && (
                        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"stretch", minWidth:130 }}>
                          {s.availableSpace > 0 && (
                            <button className="btn btn-primary btn-sm" onClick={()=>setClaimTarget(s)}>
                              Request Space
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={()=>{ setMsgText(`Hi ${s.name}, `); setTab("chat"); }}>
                            💬 Message
                          </button>
                          {s.needsHelp && (
                            <button className="btn btn-sm" style={{ background:"var(--coral-light)", color:"var(--coral)", border:"1px solid #fbd0c3", fontWeight:600 }} onClick={()=>setClaimTarget(s)}>
                              Offer Help
                            </button>
                          )}
                        </div>
                      )}
                      {isLoggedIn && isMe && (
                        <button className="btn btn-ghost btn-sm" onClick={()=>setTab("dashboard")}>Edit Capacity</button>
                      )}
                    </div>

                    {/* At-risk animals row */}
                    {sAnimals.length > 0 && (
                      <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", display:"flex", gap:9, flexWrap:"wrap", alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"var(--slate-light)", flexShrink:0 }}>At-risk animals:</span>
                        {sAnimals.map(a => (
                          <div key={a.id} onClick={()=>setSelectedAnimal(a)} style={{ display:"flex", alignItems:"center", gap:7, background:"var(--cream)", border:"1px solid var(--border)", borderRadius:9, padding:"5px 11px", cursor:"pointer", transition:"box-shadow 0.15s", fontSize:13 }}
                            onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--shadow-sm)"}
                            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                            {a.photos?.[0] ? <img src={a.photos[0]} style={{ width:26, height:26, borderRadius:6, objectFit:"cover" }}/> : <span style={{ fontSize:16 }}>{a.species==="Dog"?"🐕":"🐈"}</span>}
                            <span style={{ fontWeight:500 }}>{a.name}</span>
                            <span className={`badge ${stateBadgeColor(a.status)}`} style={{ fontSize:10 }}>{a.daysLeft}d</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ COORDINATOR CHAT ═══════════════════════════════ */}
        {tab === "chat" && (
          <ChatSystem
            user={user} shelters={shelters} messages={messages} setMessages={setMessages}
            msgText={msgText} setMsgText={setMsgText} msgEndRef={msgEndRef}
            sendMsg={sendMsg} isLoggedIn={isLoggedIn}
            onLogin={()=>{setAuthMode("login");setPage("login");}}
            dmTarget={dmTarget} setDmTarget={setDmTarget}
          />
        )}

        {/* ══ POST ANIMAL ════════════════════════════════════ */}
        {tab === "post" && isLoggedIn && (
          <div className="fade-in" style={{ maxWidth:660, margin:"0 auto" }}>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:30, marginBottom:5 }}>Post an Animal</h1>
              <p style={{ color:"var(--slate-mid)", fontSize:14 }}>Real photos and complete info dramatically increase placement speed.</p>
            </div>

            {/* Step indicator */}
            <div style={{ display:"flex", gap:0, marginBottom:28, background:"var(--warm-white)", borderRadius:12, border:"1px solid var(--border)", padding:4 }}>
              {[["1","Details"],["2","Photos"],["3","Health & Traits"]].map(([n,l]) => (
                <div key={n} onClick={()=>setPostStep(+n)} style={{ flex:1, padding:"10px 6px", textAlign:"center", borderRadius:9, cursor:"pointer", transition:"all 0.18s", background:postStep===+n?"var(--sage)":"transparent" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:postStep===+n?"rgba(255,255,255,0.7)":postStep>+n?"var(--sage)":"var(--slate-light)" }}>STEP {n}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:postStep===+n?"#fff":postStep>+n?"var(--sage-dark)":"var(--slate-mid)" }}>{l}</div>
                </div>
              ))}
            </div>

            <form onSubmit={submitPost}>
              {/* Step 1 */}
              {postStep === 1 && (
                <div className="card fade-in" style={{ padding:28 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, marginBottom:15 }}>
                    <div><label className="label">Name *</label><input className="input" required placeholder="e.g. Buddy" value={postF.name} onChange={e=>setPostF(p=>({...p,name:e.target.value}))} /></div>
                    <div><label className="label">Species *</label>
                      <select className="select" value={postF.species} onChange={e=>setPostF(p=>({...p,species:e.target.value}))}>
                        {["Dog","Cat","Rabbit","Bird","Other"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Breed</label><input className="input" placeholder="e.g. Labrador Mix" value={postF.breed} onChange={e=>setPostF(p=>({...p,breed:e.target.value}))} /></div>
                    <div><label className="label">Age</label><input className="input" placeholder="e.g. 3 years" value={postF.age} onChange={e=>setPostF(p=>({...p,age:e.target.value}))} /></div>
                    <div><label className="label">Sex</label>
                      <select className="select" value={postF.sex} onChange={e=>setPostF(p=>({...p,sex:e.target.value}))}>
                        <option value="">Unknown</option><option>Male</option><option>Female</option>
                      </select>
                    </div>
                    <div><label className="label">Weight</label><input className="input" placeholder="e.g. 45 lbs" value={postF.weight} onChange={e=>setPostF(p=>({...p,weight:e.target.value}))} /></div>
                    <div><label className="label">Color / Markings</label><input className="input" placeholder="e.g. Black & White" value={postF.color} onChange={e=>setPostF(p=>({...p,color:e.target.value}))} /></div>
                    <div><label className="label">Adoption Fee</label><input className="input" placeholder="e.g. $50 or Waived" value={postF.fee} onChange={e=>setPostF(p=>({...p,fee:e.target.value}))} /></div>
                    <div style={{ gridColumn:"span 2" }}>
                      <label className="label">Days Until Deadline *</label>
                      <input className="input" type="number" min={1} max={60} required value={postF.daysLeft} onChange={e=>setPostF(p=>({...p,daysLeft:+e.target.value}))} />
                      <div style={{ fontSize:12, color:postF.daysLeft<=2?"#dc2626":postF.daysLeft<=5?"#d97706":"var(--sage-dark)", marginTop:5, fontWeight:600 }}>
                        Status: {postF.daysLeft<=2?"⚠ Critical":postF.daysLeft<=5?"⏱ Urgent":"✅ Standard"}
                      </div>
                    </div>
                    <div style={{ gridColumn:"span 2" }}>
                      <label className="label">Description *</label>
                      <textarea className="textarea" required rows={4} placeholder="Describe this animal's personality, history, and what makes them special to a potential adopter..." value={postF.description} onChange={e=>setPostF(p=>({...p,description:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <button type="button" className="btn btn-primary btn-md" onClick={()=>setPostStep(2)} style={{ display:"flex", alignItems:"center", gap:7 }}>Next: Photos {I.arrow}</button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {postStep === 2 && (
                <div className="card fade-in" style={{ padding:28 }}>
                  <h3 style={{ fontSize:18, marginBottom:5 }}>Add Photos</h3>
                  <p style={{ color:"var(--slate-mid)", fontSize:14, marginBottom:20 }}>Up to 6 photos. Clear, well-lit images increase adoption speed dramatically.</p>
                  <div className="upload-zone" onClick={()=>fileRef.current?.click()} onDrop={e=>{e.preventDefault();handlePhotos(e.dataTransfer.files);}} onDragOver={e=>e.preventDefault()} style={{ marginBottom:18 }}>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handlePhotos(e.target.files)} />
                    <div style={{ color:"var(--sage)", marginBottom:8, display:"flex", justifyContent:"center" }}>{I.upload}</div>
                    <div style={{ fontWeight:600, color:"var(--slate)", marginBottom:3 }}>Drop photos here or click to upload</div>
                    <div style={{ fontSize:13, color:"var(--slate-light)" }}>JPG, PNG · Up to 6 · Real photos only</div>
                  </div>
                  {postF.photos.length > 0 && (
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
                      {postF.photos.map((ph,i)=>(
                        <div key={i} style={{ position:"relative", width:90, height:90, borderRadius:10, overflow:"hidden", border:"1px solid var(--border)", flexShrink:0 }}>
                          <img src={ph} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          <button onClick={()=>setPostF(p=>({...p,photos:p.photos.filter((_,j)=>j!==i)}))} style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>{I.x}</button>
                          {i===0 && <div style={{ position:"absolute", bottom:4, left:4, background:"var(--sage)", color:"#fff", fontSize:10, padding:"2px 6px", borderRadius:5, fontWeight:700 }}>MAIN</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {postF.photos.length === 0 && (
                    <div style={{ background:"var(--amber-light)", border:"1px solid #fde68a", borderRadius:10, padding:"11px 15px", fontSize:13, color:"#92400e", marginBottom:18 }}>
                      💡 Animals with photos are 3× more likely to find a placement quickly.
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <button type="button" className="btn btn-ghost btn-md" onClick={()=>setPostStep(1)}>← Back</button>
                    <button type="button" className="btn btn-primary btn-md" onClick={()=>setPostStep(3)} style={{ display:"flex", alignItems:"center", gap:7 }}>Next: Health Info {I.arrow}</button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {postStep === 3 && (
                <div className="card fade-in" style={{ padding:28 }}>
                  <h3 style={{ fontSize:18, marginBottom:5 }}>Health & Compatibility</h3>
                  <p style={{ color:"var(--slate-mid)", fontSize:14, marginBottom:22 }}>Check all that apply.</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12, marginBottom:24 }}>
                    {[
                      {k:"vaccinated",     l:"Vaccinated",      ic:"💉"},
                      {k:"neutered",       l:"Spayed/Neutered", ic:"✂️"},
                      {k:"goodWithKids",   l:"Good with Kids",  ic:"👶"},
                      {k:"goodWithDogs",   l:"Good with Dogs",  ic:"🐕"},
                      {k:"goodWithCats",   l:"Good with Cats",  ic:"🐈"},
                    ].map(t=>(
                      <label key={t.k} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, padding:"15px 10px", borderRadius:12, border:`2px solid ${postF[t.k]?"var(--sage)":"var(--border)"}`, background:postF[t.k]?"var(--sage-light)":"var(--cream)", cursor:"pointer", transition:"all 0.18s", textAlign:"center" }}>
                        <input type="checkbox" style={{ display:"none" }} checked={postF[t.k]} onChange={e=>setPostF(p=>({...p,[t.k]:e.target.checked}))} />
                        <span style={{ fontSize:26 }}>{t.ic}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:postF[t.k]?"var(--sage-dark)":"var(--slate-mid)" }}>{t.l}</span>
                        {postF[t.k] && <span style={{ color:"var(--sage)" }}>{I.check}</span>}
                      </label>
                    ))}
                  </div>

                  {/* Summary */}
                  <div style={{ background:"var(--sage-light)", border:"1px solid #c7dfc9", borderRadius:12, padding:"15px 18px", marginBottom:22 }}>
                    <div style={{ fontWeight:600, marginBottom:6 }}>Ready to post: {postF.name||"Unnamed"}</div>
                    <div style={{ fontSize:13, color:"var(--slate-mid)", display:"flex", gap:16, flexWrap:"wrap" }}>
                      <span>{postF.species} · {postF.breed||"Unknown breed"}</span>
                      <span style={{ color:postF.daysLeft<=2?"#dc2626":postF.daysLeft<=5?"#d97706":"var(--sage-dark)", fontWeight:600 }}>⏱ {postF.daysLeft} days</span>
                      <span>📷 {postF.photos.length} photo{postF.photos.length!==1?"s":""}</span>
                    </div>
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                    <button type="button" className="btn btn-ghost btn-md" onClick={()=>setPostStep(2)}>← Back</button>
                    <button type="submit" className="btn btn-primary btn-md" style={{ fontSize:15 }}>🐾 Post to RescuPawLink</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ══ DASHBOARD ══════════════════════════════════════ */}
        {tab === "dashboard" && isLoggedIn && (
          <div className="fade-in">

            {/* ── Welcome / Onboarding banner for new shelters ── */}
            {(!userShelter?.totalSpace || userShelter.totalSpace === 0) && (
              <div style={{ background:"linear-gradient(135deg,#2d4a32,#1a2e1d)", borderRadius:18, padding:"28px 32px", marginBottom:28, color:"#fff", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:-20, top:-20, fontSize:120, opacity:0.06 }}>🐾</div>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Welcome to RescuPawLink</div>
                <h2 style={{ fontSize:24, color:"#fff", marginBottom:8 }}>You're in! Let's set up your shelter profile.</h2>
                <p style={{ color:"rgba(255,255,255,0.75)", fontSize:14, lineHeight:1.6, marginBottom:20, maxWidth:520 }}>
                  Three quick steps and you'll be fully connected to the network — visible to other shelters and ready to save animals together.
                </p>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
                  {[
                    { n:"1", label:"Set your capacity", done: false },
                    { n:"2", label:"Post an at-risk animal", done: false },
                    { n:"3", label:"Connect with a partner shelter", done: false },
                  ].map(step => (
                    <div key={step.n} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:10, padding:"8px 14px" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{step.n}</div>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.85)" }}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-md" style={{ background:"#fff", color:"var(--sage-dark)", fontWeight:700 }} onClick={()=>document.getElementById("capacity-form")?.scrollIntoView({behavior:"smooth"})}>
                    Start: Set Capacity ↓
                  </button>
                  <button className="btn btn-md" style={{ background:"transparent", color:"#fff", border:"1px solid rgba(255,255,255,0.4)" }} onClick={()=>setTab("network")}>
                    Browse Network
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="section-header">
              <div>
                <h1 style={{ fontSize:28, marginBottom:4 }}>{user.name}</h1>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", fontSize:13, color:"var(--slate-mid)", alignItems:"center" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:4 }}>{I.pin} {user.city}, {user.state}</span>
                  <span>· {user.type}</span>
                  {user.verified
                    ? <span className="badge badge-sage" style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{I.shield} Verified Partner</span>
                    : <span className="badge" style={{ background:"#fef3c7", color:"#d97706", border:"1px solid #fde68a" }}>⏳ Verification Pending</span>
                  }
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-ghost btn-md" onClick={()=>setTab("network")} style={{ display:"flex", alignItems:"center", gap:7 }}>{I.network} <span>View Network</span></button>
                <button className="btn btn-primary btn-md" onClick={()=>setTab("post")} style={{ display:"flex", alignItems:"center", gap:7 }}>{I.plus} Post Animal</button>
              </div>
            </div>

            {/* ── CRITICAL ALERT BANNER — animals in network at ≤2 days ── */}
            {animals.filter(a=>a.status==="critical").length > 0 && (
              <div style={{ background:"#fff5f5", border:"1.5px solid #fca5a5", borderRadius:14, padding:"18px 22px", marginBottom:22 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>⚠️</div>
                  <div>
                    <div style={{ fontWeight:700, color:"#dc2626", fontSize:15 }}>
                      {animals.filter(a=>a.status==="critical").length} Animal{animals.filter(a=>a.status==="critical").length!==1?"s":""} Are Critical — Under 48 Hours
                    </div>
                    <div style={{ fontSize:13, color:"#ef4444" }}>These animals need space or placement NOW. Can your shelter help?</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {animals.filter(a=>a.status==="critical").map(a=>(
                    <div key={a.id} onClick={()=>setSelectedAnimal(a)} style={{ display:"flex", alignItems:"center", gap:9, background:"#fff", border:"1px solid #fca5a5", borderRadius:10, padding:"8px 14px", cursor:"pointer", transition:"box-shadow 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(220,38,38,0.15)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <div style={{ width:34, height:34, borderRadius:8, overflow:"hidden", background:"var(--sand)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {a.photos?.[0] ? <img src={a.photos[0]} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:20 }}>{a.species==="Dog"?"🐕":"🐈"}</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--slate)" }}>{a.name}</div>
                        <div style={{ fontSize:11, color:"#ef4444", fontWeight:600 }}>⏱ {a.daysLeft} day{a.daysLeft!==1?"s":""} · {a.shelterCity}, {a.shelterState}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, flexDirection:"column" }}>
                        <button className="btn btn-sm" style={{ background:"#dc2626", color:"#fff", fontSize:11, padding:"5px 10px" }}
                          onClick={e=>{e.stopPropagation(); const s=shelters.find(sh=>sh.id===a.shelterId); setClaimTarget(s);}}>
                          Offer Space
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:24 }}>
              {[
                { label:"Your Animals Listed", value:myAnimals.length,                                    icon:"🐾", color:"var(--sage)",  action:()=>document.getElementById("my-animals")?.scrollIntoView({behavior:"smooth"}) },
                { label:"Critical (≤2 days)",  value:myAnimals.filter(a=>a.status==="critical").length,   icon:"⚠️", color:"#dc2626",      action:null },
                { label:"Your Open Spaces",    value:userShelter?.availableSpace||0,                      icon:"🏠", color:"#2563eb",      action:()=>document.getElementById("capacity-form")?.scrollIntoView({behavior:"smooth"}) },
                { label:"Network Partners",    value:shelters.length-1,                                   icon:"🤝", color:"#7c3aed",      action:()=>setTab("network") },
              ].map(s=>(
                <div key={s.label} className="stat-card" onClick={s.action||undefined} style={{ cursor:s.action?"pointer":"default", transition:"box-shadow 0.18s" }}
                  onMouseEnter={e=>{ if(s.action) e.currentTarget.style.boxShadow="var(--shadow-md)"; }}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="var(--shadow-sm)"}>
                  <div className="stat-icon" style={{ background:"var(--cream)" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily:"'Inter',sans-serif", fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:12, color:"var(--slate-mid)", marginTop:3 }}>{s.label}</div>
                  </div>
                  {s.action && <div style={{ marginLeft:"auto", color:"var(--slate-light)", fontSize:18 }}>›</div>}
                </div>
              ))}
            </div>

            {/* ── Network Activity Feed ── */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <h2 style={{ fontSize:20 }}>Network Activity</h2>
                <button className="btn btn-ghost btn-sm" onClick={()=>setTab("chat")}>Open Chat →</button>
              </div>
              <div style={{ display:"grid", gap:10 }}>
                {/* Shelters needing help */}
                {shelters.filter(s=>s.needsHelp && s.id!==user.id).map(s=>(
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#fff5f5", border:"1px solid #fca5a5", borderRadius:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>{s.name}</span>
                      <span style={{ fontSize:13, color:"var(--slate-mid)" }}> is over capacity and seeking transfer help</span>
                      <div style={{ fontSize:12, color:"var(--slate-light)", marginTop:2 }}>📍 {s.city}, {s.state}</div>
                    </div>
                    <button className="btn btn-sm" style={{ background:"var(--coral)", color:"#fff", flexShrink:0 }} onClick={()=>setClaimTarget(s)}>Offer Help</button>
                  </div>
                ))}
                {/* Shelters with open space */}
                {shelters.filter(s=>s.availableSpace>20 && s.id!==user.id).slice(0,2).map(s=>(
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>✅</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>{s.name}</span>
                      <span style={{ fontSize:13, color:"var(--slate-mid)" }}> has <strong style={{ color:"#16a34a" }}>{s.availableSpace} open spaces</strong> available</span>
                      <div style={{ fontSize:12, color:"var(--slate-light)", marginTop:2 }}>📍 {s.city}, {s.state} · {s.canTake.join(", ")||"All animals"}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setClaimTarget(s)}>Request Space</button>
                  </div>
                ))}
                {/* Recent chat messages */}
                {messages.slice(-2).map(m=>(
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"var(--cream)", border:"1px solid var(--border)", borderRadius:12 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"var(--sage-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>💬</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{m.from}: </span>
                      <span style={{ fontSize:13, color:"var(--slate-mid)" }}>{m.text.length>80?m.text.slice(0,80)+"…":m.text}</span>
                      <div style={{ fontSize:11, color:"var(--slate-light)", marginTop:2 }}>{m.time}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setTab("chat")}>Reply</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Capacity Manager ── */}
            <div id="capacity-form" className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontSize:20, marginBottom:4 }}>Manage Your Capacity</h2>
                  <p style={{ color:"var(--slate-mid)", fontSize:14 }}>Keeps the whole network informed. Update whenever your space changes.</p>
                </div>
                {userShelter?.totalSpace > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--cream)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px" }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:capColor(userShelter), flexShrink:0 }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:capColor(userShelter) }}>
                      {capPct(userShelter) < 10 ? "Over Capacity" : capPct(userShelter) < 30 ? "Nearly Full" : "Has Space"}
                    </span>
                  </div>
                )}
              </div>
              <form onSubmit={submitCap}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                  <div><label className="label">Total Capacity</label><input className="input" type="number" min={0} placeholder={userShelter?.totalSpace||"e.g. 100"} value={capF.total} onChange={e=>setCapF(p=>({...p,total:e.target.value}))} /></div>
                  <div><label className="label">Available Right Now</label><input className="input" type="number" min={0} placeholder={userShelter?.availableSpace||"e.g. 30"} value={capF.available} onChange={e=>setCapF(p=>({...p,available:e.target.value}))} /></div>
                </div>

                <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:9, padding:"12px 16px", borderRadius:12, border:`2px solid ${capF.needsHelp?"var(--coral)":"var(--border)"}`, background:capF.needsHelp?"var(--coral-light)":"var(--cream)", cursor:"pointer", fontSize:14, fontWeight:500, transition:"all 0.18s" }}>
                    <input type="checkbox" style={{ display:"none" }} checked={capF.needsHelp} onChange={e=>setCapF(p=>({...p,needsHelp:e.target.checked}))} />
                    <span style={{ fontSize:18 }}>⚠️</span>
                    <span style={{ color:capF.needsHelp?"var(--coral)":"var(--slate-mid)" }}>We're over capacity — alert the network</span>
                  </label>
                </div>

                <div style={{ marginBottom:18 }}>
                  <label className="label">We can currently accept transfers of</label>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {[["canTakeDogs","🐕 Dogs"],["canTakeCats","🐈 Cats"],["canTakeSmall","🐾 Small Animals"]].map(([k,l])=>(
                      <label key={k} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, border:`1.5px solid ${capF[k]?"var(--sage)":"var(--border)"}`, background:capF[k]?"var(--sage-light)":"var(--cream)", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.18s" }}>
                        <input type="checkbox" style={{ display:"none" }} checked={capF[k]} onChange={e=>setCapF(p=>({...p,[k]:e.target.checked}))} />
                        {capF[k] && <span style={{ color:"var(--sage)" }}>{I.check}</span>} {l}
                      </label>
                    ))}
                  </div>
                </div>

                {userShelter?.totalSpace > 0 && (
                  <div style={{ marginBottom:18, background:"var(--cream)", borderRadius:12, padding:"14px 18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                      <span style={{ color:"var(--slate-mid)" }}>Current availability</span>
                      <span style={{ fontWeight:700, color:capColor(userShelter) }}>{userShelter.availableSpace} / {userShelter.totalSpace} open</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width:`${capPct(userShelter)}%`, background:capColor(userShelter) }}/></div>
                    <div style={{ fontSize:11, color:"var(--slate-light)", marginTop:6 }}>This is what other shelters see on the network board.</div>
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-md">Save & Broadcast to Network</button>
              </form>
            </div>

            {/* ── My Animals ── */}
            <div id="my-animals" className="card" style={{ padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <h2 style={{ fontSize:20 }}>Your Listed Animals</h2>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:13, color:"var(--slate-mid)" }}>{myAnimals.length} active</span>
                  <button className="btn btn-primary btn-sm" onClick={()=>setTab("post")}>{I.plus} Add Animal</button>
                </div>
              </div>
              {myAnimals.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px", background:"var(--cream)", borderRadius:12 }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🐾</div>
                  <div style={{ fontWeight:600, marginBottom:5, fontSize:16 }}>No animals listed yet</div>
                  <div style={{ fontSize:14, color:"var(--slate-mid)", marginBottom:18, maxWidth:320, margin:"0 auto 18px" }}>
                    Post an at-risk animal so adopters and partner shelters can help find them a placement.
                  </div>
                  <button className="btn btn-primary btn-md" onClick={()=>setTab("post")}>Post Your First Animal</button>
                </div>
              ) : (
                <div style={{ display:"grid", gap:10 }}>
                  {myAnimals.map(a=>(
                    <div key={a.id} style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 16px", background:a.status==="critical"?"#fff5f5":"var(--cream)", borderRadius:12, border:`1px solid ${a.status==="critical"?"#fca5a5":"var(--border)"}` }}>
                      <div style={{ width:56, height:56, borderRadius:10, overflow:"hidden", background:"var(--sand)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {a.photos?.[0] ? <img src={a.photos[0]} alt={a.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:26 }}>{a.species==="Dog"?"🐕":"🐈"}</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, marginBottom:2, fontSize:15 }}>{a.name}</div>
                        <div style={{ fontSize:13, color:"var(--slate-mid)" }}>{a.breed||a.species} · {a.age} · {a.sex}</div>
                        {a.status==="critical" && <div style={{ fontSize:12, color:"#dc2626", fontWeight:600, marginTop:3 }}>⚠ Needs placement urgently</div>}
                      </div>
                      <span className={`badge ${stateBadgeColor(a.status)}`}>{a.daysLeft} day{a.daysLeft!==1?"s":""} left</span>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setSelectedAnimal(a)}>View</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth gate */}
        {(tab==="post"||tab==="dashboard") && !isLoggedIn && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🔒</div>
            <h2 style={{ marginBottom:8 }}>Sign in required</h2>
            <p style={{ color:"var(--slate-mid)", marginBottom:22, fontSize:15 }}>Create a free shelter account to post animals and manage your profile.</p>
            <button className="btn btn-primary btn-lg" onClick={()=>{setAuthMode("login");setPage("login");}}>Sign In / Register</button>
          </div>
        )}
      </main>

      {/* ══ ANIMAL DETAIL MODAL ════════════════════════════ */}
      {selectedAnimal && (
        <div className="modal-backdrop" onClick={()=>setSelectedAnimal(null)}>
          <div className="modal" style={{ width:"100%", maxWidth:620 }} onClick={e=>e.stopPropagation()}>
            {/* Photo hero */}
            <div style={{ height:260, background:selectedAnimal.photos?.[0]?"transparent":`linear-gradient(135deg,${selectedAnimal.status==="critical"?"#fef2f2,#fee2e2":"#fffbeb,#fef3c7"})`, overflow:"hidden", borderRadius:"20px 20px 0 0", position:"relative" }}>
              {selectedAnimal.photos?.[0] ? <img src={selectedAnimal.photos[0]} alt={selectedAnimal.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:100 }}>{selectedAnimal.species==="Dog"?"🐕":selectedAnimal.species==="Cat"?"🐈":"🐾"}</div>}
              <button onClick={()=>setSelectedAnimal(null)} style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.45)", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>{I.x}</button>
              <div style={{ position:"absolute", top:14, left:14 }}><span className={`badge ${stateBadgeColor(selectedAnimal.status)}`}>{selectedAnimal.status==="critical"?"⚠ Critical":"⏱ Urgent"}</span></div>
              <div style={{ position:"absolute", bottom:14, right:14, background:"rgba(0,0,0,0.52)", color:"#fff", borderRadius:9, padding:"5px 13px", fontSize:13, fontWeight:700 }}>⏱ {selectedAnimal.daysLeft} day{selectedAnimal.daysLeft!==1?"s":""} left</div>
            </div>

            {/* Thumbnail strip */}
            {selectedAnimal.photos?.length > 1 && (
              <div style={{ display:"flex", gap:8, padding:"12px 24px 0", overflowX:"auto" }}>
                {selectedAnimal.photos.map((p,i)=><img key={i} src={p} alt="" style={{ width:60, height:60, borderRadius:8, objectFit:"cover", flexShrink:0, border:"2px solid var(--border)" }}/>)}
              </div>
            )}

            <div style={{ padding:"22px 28px 28px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:8 }}>
                <div>
                  <h2 style={{ fontSize:28, marginBottom:3 }}>{selectedAnimal.name}</h2>
                  <div style={{ fontSize:15, color:"var(--slate-mid)" }}>{selectedAnimal.breed} · {selectedAnimal.age} · {selectedAnimal.sex}</div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {selectedAnimal.weight && <div style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:9, padding:"8px 13px", fontSize:13, textAlign:"center" }}><div style={{ fontSize:10, color:"var(--slate-light)", fontWeight:700, textTransform:"uppercase" }}>Weight</div>{selectedAnimal.weight}</div>}
                  {selectedAnimal.fee && <div style={{ background:"var(--cream)", border:"1px solid var(--border)", borderRadius:9, padding:"8px 13px", fontSize:13, textAlign:"center" }}><div style={{ fontSize:10, color:"var(--slate-light)", fontWeight:700, textTransform:"uppercase" }}>Fee</div>{selectedAnimal.fee}</div>}
                </div>
              </div>

              <p style={{ fontSize:15, color:"var(--slate)", lineHeight:1.65, margin:"14px 0 16px" }}>{selectedAnimal.description}</p>

              {/* Traits */}
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:18 }}>
                {selectedAnimal.vaccinated  && <span className="trait-pill" style={{ background:"var(--sage-light)", color:"var(--sage-dark)" }}>💉 Vaccinated</span>}
                {selectedAnimal.neutered    && <span className="trait-pill" style={{ background:"#eff6ff", color:"#1d4ed8" }}>✂️ Altered</span>}
                {selectedAnimal.goodWithKids && <span className="trait-pill" style={{ background:"#fdf4ff", color:"#7e22ce" }}>👶 Good with Kids</span>}
                {selectedAnimal.goodWithDogs && <span className="trait-pill" style={{ background:"#fff7ed", color:"#c2410c" }}>🐕 Good with Dogs</span>}
                {selectedAnimal.goodWithCats && <span className="trait-pill" style={{ background:"#fdf2f8", color:"#9d174d" }}>🐈 Good with Cats</span>}
              </div>

              {/* Shelter info box */}
              <div style={{ background:"var(--cream)", borderRadius:12, padding:"15px 18px", marginBottom:20, border:"1px solid var(--border)" }}>
                <div style={{ fontWeight:600, marginBottom:6, fontSize:15 }}>📍 {selectedAnimal.shelterName}</div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13, color:"var(--slate-mid)" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:4 }}>{I.pin} {selectedAnimal.shelterCity}, {selectedAnimal.shelterState}</span>
                  {selectedAnimal.shelterPhone && <span style={{ display:"flex", alignItems:"center", gap:4 }}>{I.phone} {selectedAnimal.shelterPhone}</span>}
                  {selectedAnimal.shelterEmail && <span style={{ display:"flex", alignItems:"center", gap:4 }}>{I.mail} {selectedAnimal.shelterEmail}</span>}
                </div>
                {selectedAnimal.id_num && <div style={{ fontSize:12, color:"var(--slate-light)", marginTop:8 }}>Animal ID: {selectedAnimal.id_num}</div>}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <button className="btn btn-primary btn-md" style={{ padding:13 }} onClick={()=>{setApplyTarget(selectedAnimal);setApplyF(p=>({...p,type:"adopt"}));}}>🏠 Apply to Adopt</button>
                <button className="btn btn-secondary btn-md" style={{ padding:13 }} onClick={()=>{setApplyTarget(selectedAnimal);setApplyF(p=>({...p,type:"foster"}));}}>💚 Offer to Foster</button>
              </div>
              {isLoggedIn && (
                <button onClick={()=>{setClaimTarget(shelters.find(s=>s.id===selectedAnimal.shelterId));setSelectedAnimal(null);}} className="btn btn-ghost btn-md" style={{ width:"100%", marginTop:10, padding:12 }}>
                  🤝 Offer Transfer Space (Shelter Staff)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ ADOPT/FOSTER APPLICATION MODAL ════════════════ */}
      {applyTarget && (
        <div className="modal-backdrop" onClick={()=>setApplyTarget(null)}>
          <div className="modal" style={{ width:"100%", maxWidth:480, padding:"32px 36px" }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setApplyTarget(null)} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"var(--slate-mid)" }}>{I.x}</button>
            <h2 style={{ fontSize:22, marginBottom:4 }}>{applyF.type==="adopt"?"Adoption":"Foster"} Application</h2>
            <p style={{ color:"var(--slate-mid)", fontSize:14, marginBottom:22 }}>For <strong>{applyTarget.name}</strong> at {applyTarget.shelterName}</p>
            <div style={{ display:"grid", gap:13, marginBottom:18 }}>
              <div><label className="label">Your Name *</label><input className="input" required placeholder="Full name" value={applyF.name} onChange={e=>setApplyF(p=>({...p,name:e.target.value}))} /></div>
              <div><label className="label">Email *</label><input className="input" type="email" required placeholder="you@email.com" value={applyF.email} onChange={e=>setApplyF(p=>({...p,email:e.target.value}))} /></div>
              <div><label className="label">Phone</label><input className="input" type="tel" placeholder="(555) 000-0000" value={applyF.phone} onChange={e=>setApplyF(p=>({...p,phone:e.target.value}))} /></div>
              <div><label className="label">Tell them about yourself</label><textarea className="textarea" rows={4} placeholder={`Why do you want to ${applyF.type} ${applyTarget.name}? Tell the shelter about your home, experience, and lifestyle...`} value={applyF.message} onChange={e=>setApplyF(p=>({...p,message:e.target.value}))} /></div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary btn-md" style={{ flex:1, padding:13 }} onClick={()=>{setApplyTarget(null);setSelectedAnimal(null);showToast(`Application sent to ${applyTarget.shelterName}! They'll be in touch soon.`);}}>Submit Application</button>
              <button className="btn btn-ghost btn-md" onClick={()=>setApplyTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CLAIM SPACE MODAL ══════════════════════════════ */}
      {claimTarget && (
        <div className="modal-backdrop" onClick={()=>setClaimTarget(null)}>
          <div className="modal" style={{ width:"100%", maxWidth:460, padding:"32px 36px" }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setClaimTarget(null)} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"var(--slate-mid)" }}>{I.x}</button>
            <h2 style={{ fontSize:22, marginBottom:4 }}>Request Transfer Space</h2>
            <p style={{ color:"var(--slate-mid)", fontSize:14, marginBottom:22 }}>At <strong>{claimTarget.name}</strong> · <span style={{ color:"var(--sage-dark)", fontWeight:600 }}>{claimTarget.availableSpace} spaces available</span></p>
            <div style={{ display:"grid", gap:13, marginBottom:18 }}>
              {[["Your Organization","Your shelter name"],["Contact Email","coordinator@yourshelter.org"],["# of Animals","How many?"],["Species & Details","e.g. 2 dogs (small breeds), 1 cat — all vaccinated"]].map(([l,pl])=>(
                <div key={l}><label className="label">{l}</label><input className="input" placeholder={pl} /></div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary btn-md" style={{ flex:1, padding:13 }} onClick={()=>{setClaimTarget(null);showToast(`Transfer request sent to ${claimTarget.name}!`);}}>Send Request</button>
              <button className="btn btn-ghost btn-md" onClick={()=>setClaimTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
