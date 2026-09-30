import { useState, useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────
const SB_URL  = "https://dmbfawpmgemqpbzpsbdm.supabase.co";
const SB_KEY  = "sb_publishable__0eHRyn3NQ_5qG2YeWcdxA_Ijr29Ivq";
const VERSION = "1.0.0";
const GITHUB_RELEASE_URL = "https://api.github.com/repos/Pawlink26/Pawlink/releases/latest";

// ── Check for updates ──────────────────────────────────
async function checkForUpdates(setUpdateAvailable) {
  try {
    const res = await fetch(GITHUB_RELEASE_URL);
    if (!res.ok) return;
    const data = await res.json();
    const latest = data.tag_name?.replace("v","");
    if (latest && latest !== VERSION) {
      setUpdateAvailable({ version: latest, url: data.html_url });
    }
  } catch(e) { /* silent fail — no internet */ }
}

// ── Secure storage helpers ────────────────────────────
function lsSet(key, value) {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(value))));
    localStorage.setItem(key, encoded);
  } catch(e) { try { localStorage.setItem(key, String(value)); } catch(_){} }
}
function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // Try base64 decode first
    try {
      const decoded = decodeURIComponent(escape(atob(raw)));
      return JSON.parse(decoded);
    } catch(e) {}
    // Try plain JSON
    try { return JSON.parse(raw); } catch(e) {}
    // Return raw string as fallback
    return raw;
  } catch(e) { return null; }
}
function lsRemove(key) { try { localStorage.removeItem(key); } catch(e) {} }
const SESSION_MS = 8 * 60 * 60 * 1000;   // 8 hrs
const IDLE_MS    = 30 * 60 * 1000;        // 30 min

// ── Supabase ──────────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const token = lsGet("rpl_d_tok") || SB_KEY;
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SB_KEY, "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || (opts.method === "POST" ? "return=representation" : ""),
    }, ...opts,
  });
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}
async function sbAuth(email, pass) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  return r.json();
}

// ── Constants ─────────────────────────────────────────────
const SPECIES = ["Dogs","Cats","Small Animals","Birds","Reptiles","Livestock","Other"];

const STATUSES = [
  { k:"available",   l:"Available",       c:"#4a6b50", bg:"#eef4ef", b:"#c7dfc9" },
  { k:"hold",        l:"On Hold",         c:"#c47a1e", bg:"#fdf6ec", b:"#fde68a" },
  { k:"pending",     l:"Pending Adoption",c:"#2563eb", bg:"#eff6ff", b:"#bfdbfe" },
  { k:"adopted",     l:"Adopted",         c:"#16a34a", bg:"#f0fdf4", b:"#86efac" },
  { k:"foster",      l:"In Foster",       c:"#7c3aed", bg:"#f5f3ff", b:"#ddd6fe" },
  { k:"transferred", l:"Transferred Out", c:"#4e5449", bg:"#f4f4f2", b:"#e0e0de" },
  { k:"medical",     l:"Medical Hold",    c:"#c85a35", bg:"#fdf0eb", b:"#f0c4b4" },
  { k:"stray_hold",  l:"Stray Hold",      c:"#c47a1e", bg:"#fdf6ec", b:"#fde68a" },
  { k:"returned",    l:"Returned to Owner",c:"#c47a1e",bg:"#fdf6ec", b:"#fde68a" },
  { k:"euthanized",  l:"Euthanized",      c:"#9a9e95", bg:"#f4f4f2", b:"#e0e0de" },
  { k:"deceased",    l:"Deceased",        c:"#9a9e95", bg:"#f4f4f2", b:"#e0e0de" },
];

const INTAKE_SOURCES = [
  "Stray","Owner Surrender","Transfer In","Born in Shelter",
  "Confiscation","Court Hold","Bite Quarantine","Foster Return",
  "TNR","Rescue Pull","Field Services","Other",
];

const KENNEL_AREAS = [
  { id:"A", name:"A — Large Dogs",     color:"#6b8f71" },
  { id:"B", name:"B — Medium Dogs",    color:"#4a6b50" },
  { id:"C", name:"C — Small Dogs",     color:"#7c3aed" },
  { id:"D", name:"D — Small Animals",  color:"#c47a1e" },
  { id:"E", name:"E — Cats",           color:"#2563eb" },
  { id:"F", name:"F — Cats (2)",       color:"#0891b2" },
  { id:"G", name:"G — Isolation",      color:"#c85a35" },
  { id:"H", name:"H — Medical",        color:"#dc2626" },
  { id:"I", name:"I — Quarantine",     color:"#9a9e95" },
  { id:"J", name:"J — Intake",         color:"#16a34a" },
];

// ── Role definitions & permission matrix ─────────────────
const ROLES = ["Admin","Manager","Staff","Vet Tech","Foster Coordinator","Volunteer Coordinator","Field Officer","Counselor","Read Only"];

// What each role can do
const PERMISSIONS = {
  Admin: {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:true,
    canManageAdoptions:true, canApproveFoster:true, canViewMedical:true,
    canEditMedical:true, canManageStaff:true, canManageVolunteers:true,
    canViewReports:true, canExport:true, canImport:true,
    canViewDonations:true, canEditDonations:true, canManageFieldServices:true,
    canViewChat:true, canSendChat:true, canManageSettings:true,
    canDeleteRecords:true, canViewSensitive:true, canCheckout:true,
    canManageFoster:true, canViewAuditLog:true,
    label:"Full access — all features and settings",
    color:"#c85a35", bg:"#fdf0eb", border:"#f0c4b4",
  },
  Manager: {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:true,
    canManageAdoptions:true, canApproveFoster:true, canViewMedical:true,
    canEditMedical:true, canManageStaff:false, canManageVolunteers:true,
    canViewReports:true, canExport:true, canImport:true,
    canViewDonations:true, canEditDonations:true, canManageFieldServices:true,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:true, canViewSensitive:true, canCheckout:true,
    canManageFoster:true, canViewAuditLog:true,
    label:"Full operations — cannot manage staff or app settings",
    color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
  },
  Staff: {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:false,
    canManageAdoptions:true, canApproveFoster:false, canViewMedical:true,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:false,
    canViewReports:true, canExport:true, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:true,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:true,
    canManageFoster:true, canViewAuditLog:false,
    label:"Day-to-day shelter operations",
    color:"#4a6b50", bg:"#eef4ef", border:"#c7dfc9",
  },
  "Vet Tech": {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:false,
    canManageAdoptions:false, canApproveFoster:false, canViewMedical:true,
    canEditMedical:true, canManageStaff:false, canManageVolunteers:false,
    canViewReports:true, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:false,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:true, canCheckout:false,
    canManageFoster:false, canViewAuditLog:false,
    label:"Medical records and animal health only",
    color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe",
  },
  "Foster Coordinator": {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:false,
    canManageAdoptions:false, canApproveFoster:true, canViewMedical:true,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:false,
    canViewReports:false, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:false,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:false,
    canManageFoster:true, canViewAuditLog:false,
    label:"Foster families and animal placement only",
    color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
  },
  "Volunteer Coordinator": {
    canViewAll:true, canEditAnimals:false, canDeleteAnimals:false,
    canManageAdoptions:false, canApproveFoster:false, canViewMedical:false,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:true,
    canViewReports:false, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:false,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:false,
    canManageFoster:false, canViewAuditLog:false,
    label:"Volunteer scheduling and coordination only",
    color:"#c47a1e", bg:"#fdf6ec", border:"#fde68a",
  },
  "Field Officer": {
    canViewAll:true, canEditAnimals:true, canDeleteAnimals:false,
    canManageAdoptions:false, canApproveFoster:false, canViewMedical:false,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:false,
    canViewReports:false, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:true,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:false,
    canManageFoster:false, canViewAuditLog:false,
    label:"Field cases and animal control only",
    color:"#16a34a", bg:"#f0fdf4", border:"#86efac",
  },
  Counselor: {
    canViewAll:true, canEditAnimals:false, canDeleteAnimals:false,
    canManageAdoptions:true, canApproveFoster:false, canViewMedical:false,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:false,
    canViewReports:false, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:false,
    canViewChat:true, canSendChat:true, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:true,
    canManageFoster:false, canViewAuditLog:false,
    label:"Adoption applications and checkout only",
    color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc",
  },
  "Read Only": {
    canViewAll:true, canEditAnimals:false, canDeleteAnimals:false,
    canManageAdoptions:false, canApproveFoster:false, canViewMedical:false,
    canEditMedical:false, canManageStaff:false, canManageVolunteers:false,
    canViewReports:true, canExport:false, canImport:false,
    canViewDonations:false, canEditDonations:false, canManageFieldServices:false,
    canViewChat:true, canSendChat:false, canManageSettings:false,
    canDeleteRecords:false, canViewSensitive:false, canCheckout:false,
    canManageFoster:false, canViewAuditLog:false,
    label:"View only — no edits or actions",
    color:"#9a9e95", bg:"#f4f4f2", border:"#e0e0de",
  },
};

// Helper — get permissions for current user
function perms(role) { return PERMISSIONS[role] || PERMISSIONS["Read Only"]; }

const EMPTY_ANIMAL = {
  name:"", species:"Dogs", breed:"", mixedBreed:false,
  age:"", ageUnit:"years", sex:"Male", altered:false,
  weight:"", weightUnit:"lbs", sizeCategory:"Medium", energyLevel:"Medium",
  color:"", markings:"", microchip:"", rabiesTag:"", licenseTag:"",
  intakeDate: new Date().toISOString().slice(0,10),
  intakeSource:"Stray", intakeCondition:"Good",
  status:"available", kennel:"", room:"", locationNote:"",
  fee:"", listingType:"adopt", daysLeft:30,
  vaccinated:false, altered2:false, heartworm:false,
  fiv:false, felv:false, dewormed:false,
  goodWithKids:false, goodWithDogs:false, goodWithCats:false, goodWithSmallAnimals:false,
  description:"", behaviorNotes:"", medNotes:"", staffNotes:"", fosterNotes:"",
  photos:[], documents:[], medHistory:[], fosterHistory:[],
  originalOwner:"", originalOwnerPhone:"", originalOwnerEmail:"",
};

// ── CSS ───────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:#f4f6f4;color:#1a1c18;-webkit-font-smoothing:antialiased;font-size:13px;line-height:1.5}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#d0ddd1;border-radius:6px}
::-webkit-scrollbar-thumb:hover{background:#6b8f71}
::-webkit-scrollbar-track{background:transparent}

/* ── App shell ─────────────────────────────────── */
.app-shell{display:flex;height:100vh;overflow:hidden}

/* ── Sidebar ───────────────────────────────────── */
.sb{width:220px;height:100vh;background:#fff;border-right:1px solid #e8ede8;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-logo{padding:14px 16px;background:#6b8f71;display:flex;align-items:center;gap:10px;flex-shrink:0}
.sb-id{padding:10px 14px;background:#f8fbf8;border-bottom:1px solid #e8ede8;flex-shrink:0}
.sb-id-name{font-size:12px;font-weight:700;color:#1a1c18;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-id-sub{font-size:10px;color:#7a9e7e;margin-top:1px}
.nl{font-size:9px;font-weight:700;color:#b8ccb9;letter-spacing:.12em;text-transform:uppercase;padding:14px 14px 4px;flex-shrink:0}
.ni{display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:11.5px;font-weight:500;color:#5a7a5e;border:none;background:none;width:100%;text-align:left;cursor:pointer;border-left:3px solid transparent;transition:all .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ni:hover{background:#f2f7f2;color:#2e4a32;border-left-color:#c8ddc9}
.ni.on{background:#eaf4eb;color:#2e4a32;border-left-color:#6b8f71;font-weight:700}
.ni svg{flex-shrink:0;opacity:.7}
.ni.on svg{opacity:1}
.nb{margin-left:auto;background:#c85a35;color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;font-weight:700;flex-shrink:0}

/* ── Main area ─────────────────────────────────── */
.main-area{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

/* ── Topbar ────────────────────────────────────── */
.tb{height:50px;background:#fff;border-bottom:1px solid #e8ede8;display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0}
.tb-title{font-family:'Lora',Georgia,serif;font-size:16px;font-weight:700;color:#1a1c18;letter-spacing:-.2px}
.tb-search{display:flex;align-items:center;gap:6px;background:#f4f6f4;border:1px solid #e0e8e0;border-radius:8px;padding:5px 10px;font-size:12px;color:#7a9e7e;cursor:text;transition:all .15s;min-width:200px}
.tb-search:focus-within{border-color:#6b8f71;background:#fff;box-shadow:0 0 0 3px rgba(107,143,113,.1)}
.tb-search input{border:none;background:none;outline:none;font-family:inherit;font-size:12px;color:#1a1c18;width:100%}

/* ── Page content ──────────────────────────────── */
.pg{flex:1;overflow-y:auto;padding:20px 22px;background:#f4f6f4}

/* ── Cards ─────────────────────────────────────── */
.card{background:#fff;border:1px solid #e8ede8;border-radius:12px;padding:16px 18px}
.card-sm{background:#fff;border:1px solid #e8ede8;border-radius:10px;padding:12px 14px}
.card-inset{background:#f8fbf8;border:1px solid #e8ede8;border-radius:9px;padding:11px 13px}
.ct{font-size:9px;font-weight:700;color:#6b8f71;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}
.page-title{font-family:'Lora',Georgia,serif;font-size:19px;font-weight:700;color:#1a1c18;letter-spacing:-.25px;line-height:1.2}
.page-sub{font-size:11px;color:#9aae9b;margin-top:2px}

/* ── Stat cards ────────────────────────────────── */
.stat{background:#fff;border:1px solid #e8ede8;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;transition:box-shadow .15s}
.stat:hover{box-shadow:0 2px 12px rgba(107,143,113,.1)}
.stat-val{font-family:'Lora',Georgia,serif;font-size:26px;font-weight:700;line-height:1}
.stat-lbl{font-size:10px;font-weight:600;color:#9aae9b;text-transform:uppercase;letter-spacing:.08em}
.stat-bar{height:3px;border-radius:2px;margin-top:8px;background:#f0f4f0}
.stat-bar-fill{height:100%;border-radius:2px;background:#6b8f71;transition:width .4s ease}

/* ── Table ─────────────────────────────────────── */
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl thead th{text-align:left;font-size:9px;font-weight:700;color:#6b8f71;letter-spacing:.1em;text-transform:uppercase;padding:10px 14px;border-bottom:1.5px solid #e8ede8;background:#f8fbf8;white-space:nowrap;position:sticky;top:0;z-index:1}
.tbl tbody td{padding:11px 14px;border-bottom:1px solid #f0f4f0;vertical-align:middle;color:#2e3a2f}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .08s;cursor:pointer}
.tbl tbody tr:hover td{background:#f8fbf8}
.tbl tbody tr:hover td:first-child{border-left:3px solid #6b8f71}
.tbl tbody td:first-child{border-left:3px solid transparent}

/* ── Badges ────────────────────────────────────── */
.bdg{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;letter-spacing:.02em;white-space:nowrap;flex-shrink:0}
.bdg-green{background:#eaf4eb;color:#2e6b35}
.bdg-red{background:#fff0ee;color:#b83b22}
.bdg-blue{background:#eef3ff;color:#2952cc}
.bdg-purple{background:#f5f0ff;color:#6b35b8}
.bdg-orange{background:#fff6ee;color:#c45e1a}
.bdg-gray{background:#f0f4f0;color:#5a7a5e}
.bdg-teal{background:#eef9f7;color:#1a7a6b}
.bdg-yellow{background:#fffbee;color:#8a6b00}

/* ── Buttons ───────────────────────────────────── */
.btn{border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .12s;display:inline-flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap}
.bp{background:#6b8f71;color:#fff;border:1.5px solid #5a7a60}.bp:hover{background:#4a6b50;transform:translateY(-1px);box-shadow:0 3px 10px rgba(107,143,113,.3)}.bp:active{transform:none}
.bp:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}
.bg{background:#fff;color:#2e4a32;border:1.5px solid #d0ddd1}.bg:hover{background:#f8fbf8;border-color:#6b8f71}
.bd{background:#fff0ee;color:#c85a35;border:1.5px solid #f0c4b4}.bd:hover{background:#ffe8e4}
.bo{background:#c85a35;color:#fff;border:1.5px solid #a84526}.bo:hover{background:#a84526}
.bsm{padding:5px 10px;font-size:11px;border-radius:7px}
.blg{padding:10px 20px;font-size:13px;border-radius:10px}

/* ── Forms ─────────────────────────────────────── */
.inp{width:100%;border:1.5px solid #dde8de;border-radius:9px;padding:8px 12px;font-size:12px;font-family:inherit;color:#1a1c18;background:#fff;outline:none;transition:all .15s;line-height:1.4}
.inp:focus{border-color:#6b8f71;box-shadow:0 0 0 3px rgba(107,143,113,.1)}
.inp::placeholder{color:#b8ccb9}
textarea.inp{resize:vertical;min-height:72px;line-height:1.6}
.sel{width:100%;border:1.5px solid #dde8de;border-radius:9px;padding:8px 12px;font-size:12px;font-family:inherit;color:#1a1c18;background:#fff;outline:none;cursor:pointer;transition:border .15s;-webkit-appearance:none}
.sel:focus{border-color:#6b8f71}
.lbl{display:block;font-size:10px;font-weight:700;color:#6b8f71;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.form-row{display:grid;gap:12px}
.form-row.g2{grid-template-columns:1fr 1fr}
.form-row.g3{grid-template-columns:1fr 1fr 1fr}
input[type=checkbox]{width:14px;height:14px;accent-color:#6b8f71;cursor:pointer;flex-shrink:0;border-radius:3px}

/* ── Tab pills ─────────────────────────────────── */
.tp{padding:5px 14px;border-radius:20px;border:1.5px solid #dde8de;background:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#5a7a5e;transition:all .12s}
.tp:hover{border-color:#6b8f71;color:#2e4a32}
.tp.on{background:#6b8f71;border-color:#6b8f71;color:#fff;box-shadow:0 2px 8px rgba(107,143,113,.25)}

/* ── Modal ─────────────────────────────────────── */
.mb{position:fixed;inset:0;background:rgba(20,28,20,.5);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}
.md{background:#fff;border-radius:16px;width:100%;max-width:720px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(20,28,20,.2),0 4px 16px rgba(20,28,20,.1);border:1px solid #e8ede8}
.mdsm{max-width:460px}
.md-header{padding:18px 22px 14px;border-bottom:1px solid #e8ede8;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:1;border-radius:16px 16px 0 0}
.md-title{font-family:'Lora',Georgia,serif;font-size:17px;font-weight:700;color:#1a1c18}
.md-body{padding:20px 22px}

/* ── Kanban ────────────────────────────────────── */
.kb-col{background:#f8fbf8;border:1px solid #e8ede8;border-radius:12px;padding:12px;min-height:200px;flex:1;min-width:200px}
.kb-col-header{font-size:10px;font-weight:700;color:#6b8f71;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.kb-card{background:#fff;border:1px solid #e8ede8;border-radius:9px;padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:all .12s;border-left:3px solid transparent}
.kb-card:hover{box-shadow:0 3px 12px rgba(107,143,113,.12);border-left-color:#6b8f71;transform:translateY(-1px)}

/* ── Calendar ──────────────────────────────────── */
.cal-day{background:#fff;border:1px solid #e8ede8;border-radius:8px;padding:6px 8px;min-height:80px;cursor:pointer;transition:background .1s}
.cal-day:hover{background:#f8fbf8}
.cal-day.today{border-color:#6b8f71;background:#f0f9f1}
.cal-day.other-month{opacity:.4}
.cal-event{font-size:10px;background:#eaf4eb;color:#2e6b35;border-radius:4px;padding:2px 6px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.cal-event.medical{background:#fff0ee;color:#b83b22}
.cal-event.task{background:#eef3ff;color:#2952cc}

/* ── Upload ────────────────────────────────────── */
.upload-zone{border:2px dashed #c8ddc9;border-radius:12px;padding:28px 24px;text-align:center;cursor:pointer;transition:all .18s;background:#f8fbf8}
.upload-zone:hover{border-color:#6b8f71;background:#f0f9f1}

/* ── Chat ──────────────────────────────────────── */
.cb{border-radius:12px;padding:9px 13px;max-width:70%;font-size:12px;line-height:1.6}
.cm{background:#6b8f71;color:#fff;align-self:flex-end;border-bottom-right-radius:3px}
.co{background:#fff;color:#1a1c18;align-self:flex-start;border-bottom-left-radius:3px;border:1px solid #e8ede8}

/* ── Lock screen ───────────────────────────────── */
.ls{position:fixed;inset:0;background:linear-gradient(135deg,#f0f7f1,#e4f0e6);z-index:999;display:flex;align-items:center;justify-content:center}

/* ── Toast ─────────────────────────────────────── */
.toast{position:fixed;top:16px;right:16px;z-index:999;background:#1a1c18;color:#fff;padding:11px 18px;border-radius:10px;box-shadow:0 8px 24px rgba(20,28,20,.25);font-size:12px;font-weight:500;border:1px solid rgba(107,143,113,.25);animation:toastIn .22s ease;display:flex;align-items:center;gap:8px;max-width:340px}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}

/* ── Grid helpers ──────────────────────────────── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px}
.g6{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr;gap:8px}
.g8{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;gap:8px}

/* ── Misc ──────────────────────────────────────── */
.ab{padding:8px 20px;display:flex;align-items:center;justify-content:space-between;font-size:12px;flex-shrink:0;border-bottom:1px solid #e8ede8}
.divider{height:1px;background:#e8ede8;margin:14px 0}
.avatar{width:28px;height:28px;border-radius:50%;background:#eaf4eb;color:#2e6b35;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid #c8ddc9}
.tag{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:#f0f4f0;color:#5a7a5e;border:1px solid #e0e8e0}
.empty-state{text-align:center;padding:48px 24px;color:#9aae9b}
.empty-state svg{opacity:.3;margin:0 auto 12px;display:block}
.row-actions{display:flex;gap:4px;opacity:0;transition:opacity .12s}
.tbl tbody tr:hover .row-actions{opacity:1}
`;

// ── Icons (SVG) ───────────────────────────────────────────
function Ic({ n, s=14, c="currentColor" }) {
  const p = { width:s, height:s, fill:"none", stroke:c, strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round", viewBox:"0 0 24 24", flexShrink:0 };
  const d = {
    home:     <svg {...p}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><path d="M9 21v-8h6v8"/></svg>,
    paw:      <svg {...p}><circle cx="9" cy="7" r="2"/><circle cx="15" cy="7" r="2"/><circle cx="5" cy="14" r="2"/><circle cx="19" cy="14" r="2"/><path d="M12 21c-3 0-6-2-6-5s2-4 6-4 6 1 6 4-3 5-6 5z"/></svg>,
    heart:    <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    med:      <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    task:     <svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    users:    <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    xfer:     <svg {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    chat:     <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    chart:    <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    cog:      <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    out:      <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plus:     <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    srch:     <svg {...p}><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>,
    ed:       <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    x:        <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    warn:     <svg {...p}><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3H20.5a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill={c}/></svg>,
    doc:      <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    cal:      <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    grid:     <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    chip:     <svg {...p}><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M7 9H4M7 12H4M7 15H4M17 9h3M17 12h3M17 15h3M9 7V4M12 7V4M15 7V4M9 20v-3M12 20v-3M15 20v-3"/></svg>,
    box:      <svg {...p}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    truck:    <svg {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    dollar:   <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    map:      <svg {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    net:      <svg {...p}><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/></svg>,
    file:     <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    check:    <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    shield:   <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return d[n] || null;
}

// ── Status badge ──────────────────────────────────────────
const SB = ({ s }) => {
  const st = STATUSES.find(x => x.k === s) || STATUSES[0];
  return <span className="bdg" style={{ background:st.bg, color:st.c, border:`1px solid ${st.b}` }}>{st.l}</span>;
};

// ── Pill row ──────────────────────────────────────────────
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`tp ${active ? "on" : ""}`} style={{ padding:"4px 11px", fontSize:11 }}>{label}</button>
);

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [attempts, setAttempts] = useState(() => parseInt(lsGet("rpl_attempts") || "0"));
  const [lockUntil, setLockUntil] = useState(() => parseInt(lsGet("rpl_lock_until") || "0"));

  const isLocked = lockUntil > Date.now();
  const lockMins = isLocked ? Math.ceil((lockUntil - Date.now()) / 60000) : 0;

  async function submit(e) {
    e.preventDefault();
    if (isLocked) { setErr(`Account locked. Try again in ${lockMins} minute${lockMins !== 1 ? "s" : ""}.`); return; }
    setErr(""); setLoading(true);

    const r = await sbAuth(email.trim().toLowerCase(), pass);

    if (!r.access_token) {
      const na = attempts + 1;
      setAttempts(na); lsSet("rpl_attempts", na);
      if (na >= 5) {
        const until = Date.now() + 15 * 60 * 1000;
        setLockUntil(until); lsSet("rpl_lock_until", until);
        setErr("Too many failed attempts — account locked for 15 minutes.");
      } else {
        setErr(`Incorrect email or password. ${5 - na} attempt${5 - na !== 1 ? "s" : ""} remaining.`);
      }
      setLoading(false); return;
    }

    lsSet("rpl_d_tok", r.access_token);
    lsRemove("rpl_attempts"); lsRemove("rpl_lock_until");

    const sd = await sbFetch(`shelters?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`);
    if (!sd?.[0]) { setErr("No shelter profile found. Register at rescupawlink.com first."); setLoading(false); return; }

    const shelter = sd[0];
    lsSet("rpl_d_shelter", shelter);
    lsSet("rpl_d_login_time", Date.now().toString());
    lsSet("rpl_d_last_active", Date.now().toString());
    if (!lsGet("rpl_d_first_login")) lsSet("rpl_d_first_login", Date.now().toString());
    onLogin(shelter);
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f7f1 0%,#e8f0e8 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{G}</style>
      <div style={{width:440}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="https://i.imgur.com/Ek2yDNL.png" alt="RescuPawLink" style={{height:64,display:"block",margin:"0 auto 12px"}}/>
          <div style={{fontSize:11,color:"#7a9e7e",fontWeight:600,letterSpacing:".08em",textTransform:"uppercase"}}>Shelter Edition · v{VERSION}</div>
        </div>
        <div style={{background:"#fff",borderRadius:20,boxShadow:"0 20px 60px rgba(107,143,113,.15)",overflow:"hidden",border:"1px solid #dce9dd"}}>
        <div style={{background:"#6b8f71",padding:"20px 28px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:700}}>Shelter Sign In</div>
            <div style={{color:"rgba(255,255,255,.5)",fontSize:11}}>256-bit encrypted · Secure session</div>
          </div>
        </div>
        <div style={{padding:"24px 28px"}}>
          <div style={{fontSize:14,fontWeight:600,color:"#18211a",marginBottom:2}}>Welcome back</div>
          <div style={{fontSize:12,color:"#7a9e7e",marginBottom:18}}>Enter your shelter credentials to continue</div>
          {isLocked && <div style={{ background:"#fdf0eb", border:"1px solid #f0c4b4", borderRadius:8, padding:"9px 13px", fontSize:12, color:"#c85a35", marginBottom:14, display:"flex", gap:8 }}><Ic n="lock" s={13} c="#c85a35"/> Locked for {lockMins} more minute{lockMins !== 1 ? "s" : ""}</div>}
          {err && !isLocked && <div style={{ background:"#fdf0eb", border:"1px solid #f0c4b4", borderRadius:8, padding:"9px 13px", fontSize:12, color:"#c85a35", marginBottom:14, display:"flex", gap:8 }}><Ic n="warn" s={13} c="#c85a35"/> {err}</div>}
          <form onSubmit={submit}>
            <div style={{ marginBottom:12 }}><label className="lbl">Email address</label><input className="inp" type="email" required autoComplete="email" placeholder="admin@yourshelter.org" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div style={{ marginBottom:18, position:"relative" }}>
              <label className="lbl">Password</label>
              <input className="inp" type={showPw?"text":"password"} required autoComplete="current-password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} style={{ paddingRight:36 }}/>
              <button type="button" style={{ position:"absolute", right:10, bottom:9, background:"none", border:"none", cursor:"pointer", color:"#9a9e95", padding:0 }} onClick={()=>setShowPw(v=>!v)}><Ic n="eye" s={13}/></button>
            </div>
            <button className="btn bp" type="submit" style={{ width:"100%", padding:"12px", fontSize:14, justifyContent:"center" }} disabled={loading || isLocked}>{loading ? "Signing in…" : "Sign In →"}</button>
          </form>
          <div style={{ textAlign:"center", marginTop:16, fontSize:11, color:"#9a9e95" }}>Register your shelter at <strong style={{ color:"#6b8f71" }}>rescupawlink.com</strong></div>
        </div>
        <div style={{background:"#f5f9f5",padding:"10px 28px",borderTop:"1px solid #e4ebe5",display:"flex",justifyContent:"space-between",fontSize:10,color:"#7a9e7e"}}>
          <span>RescuPawLink v{VERSION}</span><span style={{display:"flex",alignItems:"center",gap:4}}>🔒 Secure connection</span>
        </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANIMAL MODAL — full 5-tab Shelterluv-style intake form
// ═══════════════════════════════════════════════════════════════
function AnimalModal({ animal, onSave, onClose }) {
  const [f, setF]   = useState(animal ? { ...EMPTY_ANIMAL, ...animal } : { ...EMPTY_ANIMAL });
  const [tab, setTab] = useState("basic");
  const U = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div className="mb" onClick={onClose}>
      <div className="md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #e8e8e6", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:10 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>{animal ? `Edit — ${animal.name}` : "Add New Animal"}</div>
          <button className="btn bg bsm" onClick={onClose}><Ic n="x" s={13}/></button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:6, padding:"10px 18px", borderBottom:"1px solid #e8e8e6", flexWrap:"wrap" }}>
          {[["basic","Basic Info"],["intake","Intake"],["medical","Medical"],["behavior","Behavior"],["foster","Foster & Docs"]].map(([k,l])=>(
            <button key={k} className={`tp ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:13 }}>

          {/* ── BASIC ── */}
          {tab==="basic" && <>
            <div className="g2">
              <div><label className="lbl">Name *</label><input className="inp" value={f.name} onChange={e=>U("name",e.target.value)} placeholder="Animal name"/></div>
              <div><label className="lbl">Species *</label><select className="sel" value={f.species} onChange={e=>U("species",e.target.value)}>{SPECIES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="lbl">Breed</label><input className="inp" value={f.breed} onChange={e=>U("breed",e.target.value)} placeholder="e.g. Labrador Mix"/></div>
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:18 }}><input type="checkbox" checked={f.mixedBreed} onChange={e=>U("mixedBreed",e.target.checked)}/><span style={{ fontSize:12 }}>Mixed breed</span></div>
            </div>
            <div className="g3">
              <div><label className="lbl">Age</label><div style={{ display:"flex", gap:5 }}><input className="inp" value={f.age} onChange={e=>U("age",e.target.value)} placeholder="2" style={{ flex:1 }}/><select className="sel" value={f.ageUnit} onChange={e=>U("ageUnit",e.target.value)} style={{ width:88 }}><option>days</option><option>weeks</option><option>months</option><option>years</option></select></div></div>
              <div><label className="lbl">Sex</label><select className="sel" value={f.sex} onChange={e=>U("sex",e.target.value)}><option>Male</option><option>Female</option><option>Unknown</option></select></div>
              <div><label className="lbl">Altered / Fixed</label><select className="sel" value={f.altered?"yes":"no"} onChange={e=>U("altered",e.target.value==="yes")}><option value="yes">Yes</option><option value="no">No — Intact</option></select></div>
            </div>
            <div className="g3">
              <div><label className="lbl">Weight</label><div style={{ display:"flex", gap:5 }}><input className="inp" value={f.weight} onChange={e=>U("weight",e.target.value)} placeholder="45" style={{ flex:1 }}/><select className="sel" value={f.weightUnit} onChange={e=>U("weightUnit",e.target.value)} style={{ width:68 }}><option>lbs</option><option>kg</option></select></div></div>
              <div><label className="lbl">Size</label><select className="sel" value={f.sizeCategory} onChange={e=>U("sizeCategory",e.target.value)}><option>Tiny</option><option>Small</option><option>Medium</option><option>Large</option><option>XL</option></select></div>
              <div><label className="lbl">Energy Level</label><select className="sel" value={f.energyLevel} onChange={e=>U("energyLevel",e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></div>
            </div>
            <div className="g2">
              <div><label className="lbl">Primary color</label><input className="inp" value={f.color} onChange={e=>U("color",e.target.value)} placeholder="e.g. Black & white"/></div>
              <div><label className="lbl">Markings</label><input className="inp" value={f.markings||""} onChange={e=>U("markings",e.target.value)} placeholder="e.g. White blaze on chest"/></div>
            </div>
            <div>
              <label className="lbl" style={{ marginBottom:8 }}>Status</label>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {STATUSES.map(s=><button key={s.k} type="button" onClick={()=>U("status",s.k)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${f.status===s.k?s.c:"#e0e0de"}`, background:f.status===s.k?s.bg:"#fff", color:f.status===s.k?s.c:"#4e5449", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{s.l}</button>)}
              </div>
            </div>
            <div>
              <label className="lbl" style={{ marginBottom:8 }}>Listing type</label>
              <div style={{ display:"flex", gap:8 }}>
                {[["adopt","For Adoption"],["foster","Foster Needed"],["both","Adopt or Foster"],["none","Internal Only"]].map(([v,l])=>(
                  <button key={v} type="button" onClick={()=>U("listingType",v)} style={{ padding:"5px 12px", borderRadius:8, border:`2px solid ${f.listingType===v?"#6b8f71":"#e0e0de"}`, background:f.listingType===v?"#eef4ef":"#fff", color:f.listingType===v?"#4a6b50":"#4e5449", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            </div>
            <div className="g2">
              <div><label className="lbl">Adoption fee</label><input className="inp" value={f.fee} onChange={e=>U("fee",e.target.value)} placeholder="e.g. $75 or Waived"/></div>
              <div><label className="lbl">Days in shelter (target)</label><input className="inp" type="number" min={1} value={f.daysLeft} onChange={e=>U("daysLeft",parseInt(e.target.value)||30)}/></div>
            </div>
            <div><label className="lbl">Public bio / description</label><textarea className="inp" rows={3} value={f.description} onChange={e=>U("description",e.target.value)} placeholder="Write a compelling bio for potential adopters…"/></div>
          </>}

          {/* ── INTAKE ── */}
          {tab==="intake" && <>
            <div className="g3">
              <div><label className="lbl">Intake date</label><input className="inp" type="date" value={f.intakeDate} onChange={e=>U("intakeDate",e.target.value)}/></div>
              <div><label className="lbl">Intake source</label><select className="sel" value={f.intakeSource} onChange={e=>U("intakeSource",e.target.value)}>{INTAKE_SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="lbl">Condition on intake</label><select className="sel" value={f.intakeCondition||"Good"} onChange={e=>U("intakeCondition",e.target.value)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Critical</option></select></div>
            </div>
            <div className="g3">
              <div><label className="lbl">Kennel / Cage #</label><input className="inp" value={f.kennel} onChange={e=>U("kennel",e.target.value)} placeholder="e.g. B-7"/></div>
              <div><label className="lbl">Area / Room</label><select className="sel" value={f.room||""} onChange={e=>U("room",e.target.value)}><option value="">Select area</option>{KENNEL_AREAS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="lbl">Location note</label><input className="inp" value={f.locationNote||""} onChange={e=>U("locationNote",e.target.value)} placeholder="e.g. Bottom left kennel"/></div>
            </div>
            <div className="g3">
              <div><label className="lbl">Microchip #</label><input className="inp" value={f.microchip} onChange={e=>U("microchip",e.target.value)} placeholder="15-digit ISO number"/></div>
              <div><label className="lbl">Rabies tag #</label><input className="inp" value={f.rabiesTag||""} onChange={e=>U("rabiesTag",e.target.value)}/></div>
              <div><label className="lbl">License tag #</label><input className="inp" value={f.licenseTag||""} onChange={e=>U("licenseTag",e.target.value)}/></div>
            </div>
            <div style={{ borderTop:"1px solid #e8e8e6", paddingTop:12 }}>
              <label className="lbl" style={{ marginBottom:8 }}>Original owner (if surrender / stray)</label>
              <div className="g3">
                <div><label className="lbl">Name</label><input className="inp" value={f.originalOwner||""} onChange={e=>U("originalOwner",e.target.value)}/></div>
                <div><label className="lbl">Phone</label><input className="inp" value={f.originalOwnerPhone||""} onChange={e=>U("originalOwnerPhone",e.target.value)}/></div>
                <div><label className="lbl">Email</label><input className="inp" type="email" value={f.originalOwnerEmail||""} onChange={e=>U("originalOwnerEmail",e.target.value)}/></div>
              </div>
            </div>
            <div><label className="lbl">Internal staff notes (not public)</label><textarea className="inp" rows={3} value={f.staffNotes||""} onChange={e=>U("staffNotes",e.target.value)}/></div>
          </>}

          {/* ── MEDICAL ── */}
          {tab==="medical" && <>
            <div>
              <label className="lbl" style={{ marginBottom:8 }}>Health status</label>
              <div className="g3">
                {[["vaccinated","💉 Vaccinated"],["altered","✂ Spayed/Neutered"],["heartworm","⚠ Heartworm+"],["fiv","⚠ FIV+"],["felv","⚠ FeLV+"],["dewormed","✓ Dewormed"]].map(([k,l])=>(
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, background:"#f8f8f6", padding:"8px 10px", borderRadius:8, border:"1px solid #e8e8e6", cursor:"pointer" }}>
                    <input type="checkbox" checked={!!f[k]} onChange={e=>U(k,e.target.checked)}/>{l}
                  </label>
                ))}
              </div>
            </div>
            <div><label className="lbl">Medical notes / medications / conditions</label><textarea className="inp" rows={4} value={f.medNotes||""} onChange={e=>U("medNotes",e.target.value)} placeholder="Vaccinations given, medications, upcoming procedures, health conditions…"/></div>
            <div style={{ background:"#f8fdf8", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#4a6b50", marginBottom:6 }}>Medical history log</div>
              {(f.medHistory||[]).length===0 ? <div style={{ fontSize:12, color:"#9a9e95" }}>No medical history recorded yet.</div> : (f.medHistory||[]).map((h,i)=><div key={i} style={{ padding:"5px 0", borderBottom:"1px solid #c7dfc9", fontSize:12 }}>{h.date} — {h.note}</div>)}
            </div>
          </>}

          {/* ── BEHAVIOR ── */}
          {tab==="behavior" && <>
            <div>
              <label className="lbl" style={{ marginBottom:8 }}>Compatibility</label>
              <div className="g4">
                {[["goodWithKids","👶 Good w/ Kids"],["goodWithDogs","🐕 Good w/ Dogs"],["goodWithCats","🐈 Good w/ Cats"],["goodWithSmallAnimals","🐹 Good w/ Small Animals"]].map(([k,l])=>(
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, background:"#f8f8f6", padding:"9px 10px", borderRadius:8, border:"1px solid #e8e8e6", cursor:"pointer" }}>
                    <input type="checkbox" checked={!!f[k]} onChange={e=>U(k,e.target.checked)}/>{l}
                  </label>
                ))}
              </div>
            </div>
            <div><label className="lbl">Behavior assessment notes</label><textarea className="inp" rows={5} value={f.behaviorNotes||""} onChange={e=>U("behaviorNotes",e.target.value)} placeholder="Leash manners, triggers, training progress, temperament in shelter, interaction with people and other animals…"/></div>
          </>}

          {/* ── FOSTER ── */}
          {tab==="foster" && <>
            <div><label className="lbl">Foster notes (visible to foster parent)</label><textarea className="inp" rows={4} value={f.fosterNotes||""} onChange={e=>U("fosterNotes",e.target.value)} placeholder="Feeding schedule, routine, special needs, medications to administer…"/></div>
            <div style={{ background:"#f8fdf8", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#4a6b50", marginBottom:6 }}>Foster placement history</div>
              {(f.fosterHistory||[]).length===0 ? <div style={{ fontSize:12, color:"#9a9e95" }}>No foster history recorded yet.</div> : (f.fosterHistory||[]).map((h,i)=><div key={i} style={{ padding:"5px 0", borderBottom:"1px solid #c7dfc9", fontSize:12 }}>{h.family} — {h.from} to {h.to||"present"}</div>)}
            </div>
          </>}

          <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:"1px solid #e8e8e6" }}>
            <button className="btn bp" style={{ flex:1, padding:"11px", justifyContent:"center" }} onClick={()=>onSave(f)} disabled={!f.name.trim()}>{animal?"Save Changes":"Add Animal"}</button>
            <button className="btn bg" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SUBSCRIPTION MODAL
// ═══════════════════════════════════════════════════════════════
function SubModal({ shelter, subscription, onClose }) {
  const expired = subscription?.daysLeft === 0;
  function subscribe(plan) {
    const sub = plan === "monthly"
      ? "RescuPawLink Desktop Monthly Plan — $29/month"
      : "RescuPawLink Desktop Annual Plan — $249/year";
    window.open(`mailto:rescupawlink@gmail.com?subject=${encodeURIComponent(sub+" — "+shelter.name)}&body=${encodeURIComponent("Hi,\n\nI'd like to subscribe to "+sub+" for "+shelter.name+".\n\nShelter: "+shelter.name+"\nCity: "+shelter.city+", "+shelter.state+"\nEmail: "+shelter.email+"\n\nPlease send payment details.\n\nThank you!")}`, "_blank");
    if (!expired) onClose();
  }
  return (
    <div className="mb" onClick={expired?null:onClose}>
      <div className="md mdsm" onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"24px 26px 0", textAlign:"center" }}>
          <img src="https://i.imgur.com/Ek2yDNL.png" alt="RescuPawLink" style={{ height:38, marginBottom:12 }}/>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:5 }}>{expired?"Your trial has ended":"Choose your plan"}</div>
          <div style={{ fontSize:12, color:"#9a9e95", marginBottom:20 }}>
            {expired?"Subscribe to continue managing your shelter.": `${subscription?.daysLeft} day${subscription?.daysLeft!==1?"s":""} remaining in your free trial.`}
          </div>
        </div>
        <div style={{ padding:"0 26px 24px" }}>
          <div className="g2" style={{ marginBottom:14 }}>
            {/* Monthly */}
            <div style={{ border:"1px solid #e0e0de", borderRadius:12, padding:"18px 16px", cursor:"pointer", transition:"border-color .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="#6b8f71"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e0e0de"}>
              <div style={{ fontSize:9, fontWeight:700, color:"#9a9e95", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Monthly</div>
              <div style={{ fontSize:26, fontWeight:700, color:"#1a1c18", lineHeight:1 }}>$29</div>
              <div style={{ fontSize:11, color:"#9a9e95", marginBottom:14 }}>/month · billed monthly</div>
              <button className="btn bg bsm" style={{ width:"100%", justifyContent:"center" }} onClick={()=>subscribe("monthly")}>Subscribe Monthly</button>
            </div>
            {/* Annual */}
            <div style={{ border:"2px solid #6b8f71", borderRadius:12, padding:"18px 16px", background:"#eef4ef", cursor:"pointer", position:"relative" }}>
              <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"#6b8f71", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 11px", borderRadius:20, whiteSpace:"nowrap" }}>BEST VALUE — Save 28%</div>
              <div style={{ fontSize:9, fontWeight:700, color:"#4a6b50", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Annual</div>
              <div style={{ fontSize:26, fontWeight:700, color:"#1a1c18", lineHeight:1 }}>$249</div>
              <div style={{ fontSize:11, color:"#4a6b50", marginBottom:14 }}>/year · only $20.75/mo</div>
              <button className="btn bp bsm" style={{ width:"100%", justifyContent:"center" }} onClick={()=>subscribe("annual")}>Subscribe Annually</button>
            </div>
          </div>
          <div style={{ background:"#f8f8f6", borderRadius:8, padding:"10px 13px", fontSize:11, color:"#4e5449", lineHeight:1.9, marginBottom:12 }}>
            ✅ Unlimited animals &nbsp;·&nbsp; ✅ All 17 features &nbsp;·&nbsp; ✅ Coordinator chat &nbsp;·&nbsp; ✅ CSV export &nbsp;·&nbsp; ✅ All future updates &nbsp;·&nbsp; ✅ Email support
          </div>
          <div style={{ textAlign:"center", fontSize:11, color:"#9a9e95", marginBottom:12 }}>Contact <strong>rescupawlink@gmail.com</strong> to subscribe or with questions.</div>
          {!expired && <button className="btn bg bsm" style={{ width:"100%", justifyContent:"center" }} onClick={onClose}>Continue trial ({subscription?.daysLeft} day{subscription?.daysLeft!==1?"s":""} left)</button>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  // ── Core state ────────────────────────────────────────
  const [shelter, setShelter]   = useState(null);
  const [tab, setTab]           = useState("dashboard");
  const [animals, setAnimals]   = useState([]);
  const [locked, setLocked]     = useState(false);
  const [lockPin, setLockPin]   = useState("");
  const [lockErr, setLockErr]   = useState("");
  const [toast, setToast]       = useState("");
  const [sub, setSub]           = useState(null);
  const [showSub, setShowSub]   = useState(false);
  const [showAnimal, setShowAnimal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [actLog, setActLog]     = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // { name, role, pin } — logged-in staff member
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [contracts, setContracts]       = useState([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractF, setContractF]       = useState({type:"Adoption",petName:"",adopterName:"",adopterEmail:"",adopterPhone:"",date:"",notes:"",signed:false});
  const [transports, setTransports]     = useState([]);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [transportF, setTransportF]     = useState({petName:"",fromAddr:"",toAddr:"",driver:"",date:"",distance:"",cost:"",notes:"",status:"Scheduled"});
  const [eventsData, setEventsData]     = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventF, setEventF]             = useState({title:"",type:"Adoption Event",date:"",time:"",location:"",description:"",capacity:"",public:true,status:"Upcoming"});
  const [donors, setDonors]             = useState([]);
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [donorF, setDonorF]             = useState({name:"",email:"",phone:"",totalGiven:"",lastGift:"",notes:"",recurring:false});
  const idleRef = useRef(null);

  // ── Filters ───────────────────────────────────────────
  const [spFilter, setSpFilter]   = useState("All");
  const [stFilter, setStFilter]   = useState("all");
  const [search, setSearch]       = useState("");

  // ── Staff & Volunteers ────────────────────────────────
  const [staff, setStaff] = useState([
    { id:1, name:"Dr. Maria Martinez", role:"Vet Tech",            email:"dr.m@clinic.com",  phone:"(520) 555-0102", pin:"1234", active:true },
    { id:2, name:"Sarah Johnson",       role:"Staff",              email:"sarah@shelter.com", phone:"(520) 555-0101", pin:"5678", active:true },
    { id:3, name:"Tom Chen",            role:"Foster Coordinator", email:"tom@shelter.com",   phone:"(520) 555-0103", pin:"9012", active:true },
  ]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name:"", role:"Staff", email:"", phone:"", pin:"" });

  const [vols, setVols] = useState([
    { id:1, name:"Emily Torres",  email:"emily@email.com", phone:"(520) 555-0201", skills:"Dog walking, Transport", hours:32, shift:"Weekend AM" },
    { id:2, name:"Jake Williams", email:"jake@email.com",  phone:"(520) 555-0202", skills:"Cat care, Photography", hours:18, shift:"Weekday PM" },
  ]);
  const [showVolForm, setShowVolForm] = useState(false);
  const [newVol, setNewVol] = useState({ name:"", email:"", phone:"", skills:"", shift:"" });

  // ── Foster families ───────────────────────────────────
  const [fosters, setFosters] = useState([
    { id:1, name:"The Williams Family", email:"williams@email.com", phone:"(520) 555-0301", address:"1234 Oak St, Tucson AZ", capacity:"2 dogs or 3 cats", currentCount:1, approved:true, notes:"Great with senior dogs. Huge backyard.", available:true },
    { id:2, name:"Jessica Park",         email:"jpark@email.com",   phone:"(520) 555-0302", address:"567 Maple Ave, Tucson AZ", capacity:"1 cat or small dog", currentCount:0, approved:true, notes:"Experienced with bottle babies.", available:true },
  ]);
  const [showFosterForm, setShowFosterForm] = useState(false);
  const [newFoster, setNewFoster] = useState({ name:"", email:"", phone:"", address:"", capacity:"", notes:"" });
  const [fosterSearch, setFosterSearch] = useState("");

  // ── Tasks ─────────────────────────────────────────────
  const [tasks, setTasks] = useState([
    { id:1, text:"Morning feeding — all kennels", done:false, priority:"high",   assignee:"All Staff",    due:new Date().toISOString().slice(0,10) },
    { id:2, text:"Administer medication — Kennel D-4", done:false, priority:"high", assignee:"Dr. Martinez", due:new Date().toISOString().slice(0,10) },
    { id:3, text:"Clean and sanitize intake kennels", done:false, priority:"medium", assignee:"Volunteers",  due:new Date().toISOString().slice(0,10) },
    { id:4, text:"Review pending adoption applications", done:false, priority:"medium", assignee:"Admin",    due:new Date().toISOString().slice(0,10) },
    { id:5, text:"Update animal photos for website", done:true, priority:"low",   assignee:"Sarah J.",     due:new Date().toISOString().slice(0,10) },
  ]);
  const [newTask, setNewTask]   = useState("");
  const [newTaskPri, setNewTaskPri] = useState("medium");
  const [newTaskWho, setNewTaskWho] = useState("");

  // ── Appointments ──────────────────────────────────────
  const [appts, setAppts] = useState([
    { id:1, animal:"Luna",  type:"Spay surgery",   date:"2026-09-27", time:"09:00", vet:"Dr. Martinez",     status:"scheduled", notes:"Fasted overnight. Pre-op bloodwork clear." },
    { id:2, animal:"Buddy", type:"Annual vaccines", date:"2026-09-28", time:"14:00", vet:"Sunrise Vet Clinic",status:"scheduled", notes:"" },
    { id:3, animal:"Mochi", type:"Dental cleaning", date:"2026-10-02", time:"10:00", vet:"Dr. Martinez",     status:"scheduled", notes:"Senior cat — bloodwork done." },
  ]);
  const [showApptForm, setShowApptForm] = useState(false);
  const [newAppt, setNewAppt] = useState({ animal:"", type:"", date:"", time:"", vet:"", notes:"" });

  // ── Applications ──────────────────────────────────────
  const [apps, setApps] = useState([
    { id:1, name:"James & Karen Lee",  email:"lees@email.com",      phone:"(520) 555-0401", animal:"Buddy", type:"adopt",  date:"2026-09-24", status:"pending", notes:"Fenced yard, no other pets, work from home." },
    { id:2, name:"Maria Gonzalez",      email:"m.gonzalez@email.com",phone:"(520) 555-0402", animal:"Mochi", type:"foster", date:"2026-09-23", status:"pending", notes:"Has fostered 3 cats before. Very experienced." },
  ]);

  // ── Donations ─────────────────────────────────────────
  const [donations, setDonations] = useState([
    { id:1, donor:"Anonymous",         amount:50,  date:"2026-09-24", type:"General",  note:"" },
    { id:2, donor:"Sarah Thompson",    amount:100, date:"2026-09-23", type:"Adoption", note:"Donated at checkout for Luna" },
    { id:3, donor:"Tucson Pet Supply", amount:250, date:"2026-09-20", type:"Sponsor",  note:"Food donation sponsorship" },
    { id:4, donor:"James & Karen Lee", amount:25,  date:"2026-09-19", type:"Adoption", note:"Donated at adoption checkout" },
  ]);
  const [showDonForm, setShowDonForm] = useState(false);
  const [newDon, setNewDon] = useState({ donor:"", amount:"", type:"General", note:"" });
  const totalDon = donations.reduce((s,d)=>s+d.amount,0);

  // ── Field services ────────────────────────────────────
  const [cases, setCases] = useState([
    { id:1, caseNum:"FS-2026-001", type:"Stray Report",    address:"1234 N Oracle Rd, Tucson AZ", officer:"Tom Chen", status:"open",    date:"2026-09-25", notes:"Black lab, no collar." },
    { id:2, caseNum:"FS-2026-002", type:"Bite Quarantine", address:"567 E Broadway, Tucson AZ",  officer:"Tom Chen", status:"active",  date:"2026-09-24", notes:"10-day quarantine period." },
    { id:3, caseNum:"FS-2026-003", type:"Cruelty Report",  address:"890 W Speedway, Tucson AZ",  officer:"Sarah J.", status:"pending", date:"2026-09-23", notes:"Anonymous tip. Investigation ongoing." },
  ]);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [newCase, setNewCase] = useState({ type:"Stray Report", address:"", officer:"", notes:"" });

  // ── Chat ──────────────────────────────────────────────
  const [chatCh, setChatCh]       = useState("all");
  const [chatInput, setChatInput] = useState("");
  const [msgs, setMsgs] = useState([
    { id:1, from:"System",              ch:"all",       text:"Welcome to RescuPawLink Coordinator Chat!", time:"System", sys:true },
    { id:2, from:"Austin Animal Center",ch:"urgent",    text:"⚠ 4 dogs at critical deadline Friday 5pm. Any TX shelters with space?", time:"9:15 AM", fid:"s1" },
    { id:3, from:"Houston SPCA",        ch:"urgent",    text:"We can take 2 small dogs. Sending DM now.", time:"9:22 AM", fid:"s2" },
    { id:4, from:"Denver Rescue",       ch:"transport", text:"Transport run Phoenix → Denver Saturday. 8 spots. DM to reserve.", time:"8:30 AM", fid:"s3" },
    { id:5, from:"Phoenix Humane",      ch:"medical",   text:"Anyone have emergency vet contact for FIV+ cat in Phoenix?", time:"Yesterday", fid:"s4" },
  ]);
  const chatEnd = useRef(null);

  // ── Microchip ─────────────────────────────────────────
  const [chipQ, setChipQ]     = useState("");
  const [chipRes, setChipRes] = useState(null);

  // ── Reports ───────────────────────────────────────────
  const [reportTab, setReportTab] = useState("population");

  // ── Session / security ────────────────────────────────
  useEffect(()=>{
    const saved     = lsGet("rpl_d_shelter");
    const loginTime = parseInt(lsGet("rpl_d_login_time")||"0");
    const subSaved  = lsGet("rpl_d_sub");

    if (saved && Date.now()-loginTime < SESSION_MS) {
      const s = (typeof saved === "string") ? JSON.parse(saved) : saved;
      setShelter(s);
      loadAnimals(s.id);
      setCurrentUser({ name:s.name, role:"Admin", pin:"" }); // Shelter owner = Admin by default
    } else if (saved) {
      lsRemove("rpl_d_tok");
      lsRemove("rpl_d_shelter");
    }

    if (subSaved) { setSub((typeof subSaved === "string") ? JSON.parse(subSaved) : subSaved); }
    else {
      const first = parseInt(lsGet("rpl_d_first_login")||Date.now());
      const daysLeft = Math.max(0, 14 - Math.floor((Date.now()-first)/86400000));
      const trial = { plan:"trial", daysLeft, expiresAt:new Date(first+14*86400000).toLocaleDateString() };
      setSub(trial); lsSet("rpl_d_sub", trial);
      if (daysLeft===0) setTimeout(()=>setShowSub(true), 1000);
    }

    // Listen for lock from native menu
    if (window.electron?.onLockScreen) {
      window.electron.onLockScreen(()=>setLocked(true));
      return ()=>window.electron.removeLockListener?.();
    }
  },[]);

  // Idle auto-lock
  useEffect(()=>{
    if (!shelter) return;
    const reset = ()=>{ lsSet("rpl_d_last_active",Date.now()); clearTimeout(idleRef.current); idleRef.current=setTimeout(()=>setLocked(true),IDLE_MS); };
    ["mousemove","keydown","click","touchstart"].forEach(ev=>window.addEventListener(ev,reset));
    reset();
    return ()=>{ clearTimeout(idleRef.current); ["mousemove","keydown","click","touchstart"].forEach(ev=>window.removeEventListener(ev,reset)); };
  },[shelter]);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs,chatCh]);

  // ── Helpers ───────────────────────────────────────────
  function toast2(msg){ setToast(msg); setTimeout(()=>setToast(""),3200); }
  function log(action){ setActLog(p=>[{id:Date.now(),action,time:new Date().toLocaleTimeString(),user:shelter?.name||"Admin"},...p].slice(0,100)); }

  async function loadAnimals(shelterId){
    try {
      const data = await sbFetch(`animals?shelter_id=eq.${shelterId}&order=name`);
      if (data?.length) setAnimals(data.map(a=>({
        ...EMPTY_ANIMAL, ...a,
        species:      a.species||"Dogs",
        status:       a.status||"available",
        intakeDate:   a.intake_date||"",
        intakeSource: a.intake_source||"Stray",
        medNotes:     a.med_notes||"",
        behaviorNotes:a.behavior_notes||"",
        staffNotes:   a.notes||"",
        goodWithKids: a.good_with_kids??false,
        goodWithDogs: a.good_with_dogs??false,
        goodWithCats: a.good_with_cats??false,
        altered:      a.neutered??false,
        listingType:  a.listing_type||"adopt",
      })));
    } catch(e){ console.error("Load animals:",e); }
  }

  async function saveAnimal(f){
    const payload = {
      name:f.name, species:f.species, breed:f.breed, age:f.age, sex:f.sex,
      weight:f.weight, color:f.color, microchip:f.microchip||"",
      intake_date:f.intakeDate, intake_source:f.intakeSource, status:f.status,
      kennel:f.kennel, fee:f.fee||"", description:f.description,
      vaccinated:f.vaccinated, neutered:f.altered,
      good_with_kids:f.goodWithKids, good_with_dogs:f.goodWithDogs,
      good_with_cats:f.goodWithCats, heartworm:f.heartworm||false,
      med_notes:f.medNotes, behavior_notes:f.behaviorNotes, notes:f.staffNotes,
      photos:f.photos||[], listing_type:f.listingType,
      shelter_id:shelter.id, shelter_name:shelter.name,
      shelter_city:shelter.city, shelter_state:shelter.state, days_left:f.daysLeft||30,
    };
    if (f.id && !String(f.id).startsWith("local_")) {
      setAnimals(p=>p.map(a=>a.id===f.id?{...a,...f}:a));
      try { await sbFetch(`animals?id=eq.${f.id}`,{method:"PATCH",body:JSON.stringify(payload)}); } catch(e){}
    } else {
      try {
        const res = await sbFetch("animals",{method:"POST",body:JSON.stringify(payload)});
        setAnimals(p=>[...p,{...f,id:res?.[0]?.id||`local_${Date.now()}`}]);
      } catch(e){ setAnimals(p=>[...p,{...f,id:`local_${Date.now()}`}]); }
    }
    setShowAnimal(false); setEditAnimal(null);
    toast2("✅ Animal saved!"); log(`Saved animal: ${f.name}`);
  }

  async function delAnimal(id,name){
    if (!window.confirm(`Remove ${name} from records?`)) return;
    setAnimals(p=>p.filter(a=>a.id!==id));
    try { await sbFetch(`animals?id=eq.${id}`,{method:"DELETE"}); } catch(e){}
    toast2("🗑 Removed"); log(`Deleted: ${name}`);
  }

  function exportCSV(){
    const h=["Name","Species","Breed","Age","Sex","Altered","Weight","Color","Microchip","Intake Date","Intake Source","Status","Kennel","Fee","Vaccinated","Good w/Kids","Good w/Dogs","Good w/Cats","Description"];
    const rows=animals.map(a=>[a.name,a.species,a.breed,a.age,a.sex,a.altered?"Yes":"No",a.weight,a.color,a.microchip,a.intakeDate,a.intakeSource,a.status,a.kennel,a.fee,a.vaccinated?"Yes":"No",a.goodWithKids?"Yes":"No",a.goodWithDogs?"Yes":"No",a.goodWithCats?"Yes":"No",a.description].map(v=>`"${(v||"").toString().replace(/"/g,'""')}"`));
    const csv=[h.join(","),...rows.map(r=>r.join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`${(shelter.name||"shelter").replace(/\s/g,"_")}_animals_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast2("✅ CSV exported!"); log("Exported animal CSV");
  }

  function importCSV(e){
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=evt=>{
      const lines=evt.target.result.trim().split("\n");
      const headers=lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/[^a-z_]/g,""));
      const imported=lines.slice(1).filter(l=>l.trim()).map(line=>{
        const vals=line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
        const o={}; headers.forEach((h,i)=>o[h]=vals[i]||"");
        return {...EMPTY_ANIMAL, id:`local_${Date.now()}_${Math.random()}`,
          name:o.name, species:o.species||"Dogs", breed:o.breed, age:o.age, sex:o.sex||"Unknown",
          altered:["yes","true","1"].includes((o.altered||"").toLowerCase()),
          weight:o.weight, color:o.color, microchip:o.microchip,
          intakeDate:o.intake_date||o.intakedate||"", intakeSource:o.intake_source||"Other",
          status:o.status||"available", kennel:o.kennel, fee:o.fee,
          vaccinated:["yes","true","1"].includes((o.vaccinated||"").toLowerCase()),
          goodWithKids:["yes","true","1"].includes((o.good_with_kids||"").toLowerCase()),
          goodWithDogs:["yes","true","1"].includes((o.good_with_dogs||"").toLowerCase()),
          goodWithCats:["yes","true","1"].includes((o.good_with_cats||"").toLowerCase()),
          description:o.description,
          shelter_id:shelter.id, shelter_name:shelter.name,
        };
      }).filter(a=>a.name);
      setAnimals(p=>[...p,...imported]);
      toast2(`✅ Imported ${imported.length} animal${imported.length!==1?"s":""}!`);
      log(`Imported ${imported.length} animals from CSV`);
    };
    reader.readAsText(file);
    e.target.value="";
  }

  function signOut(){
    log("Signed out");
    lsRemove("rpl_d_tok"); lsRemove("rpl_d_shelter"); lsRemove("rpl_d_login_time");
    setShelter(null); setAnimals([]);
  }

  function sendChat(){
    if (!chatInput.trim()) return;
    setMsgs(p=>[...p,{ id:Date.now(), from:shelter.name, fid:shelter.id, ch:chatCh, text:chatInput.trim(), time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }]);
    setChatInput("");
  }

  if (!shelter) return <LoginScreen onLogin={s=>{setShelter(s);loadAnimals(s.id);}}/>;

  // ── Computed ──────────────────────────────────────────
  const filtered = animals.filter(a=>{
    if (spFilter!=="All"&&a.species!==spFilter) return false;
    if (stFilter!=="all"&&a.status!==stFilter) return false;
    if (search){
      const q=search.toLowerCase();
      if(!a.name?.toLowerCase().includes(q)&&!a.breed?.toLowerCase().includes(q)&&!a.microchip?.includes(search)) return false;
    }
    return true;
  });

  const ST = {
    total:     animals.length,
    available: animals.filter(a=>a.status==="available").length,
    pending:   animals.filter(a=>a.status==="pending").length,
    foster:    animals.filter(a=>a.status==="foster").length,
    adopted:   animals.filter(a=>a.status==="adopted").length,
    medical:   animals.filter(a=>a.status==="medical").length,
    hold:      animals.filter(a=>a.status==="stray_hold").length,
    urgent:    animals.filter(a=>["available","stray_hold"].includes(a.status)&&(a.daysLeft||30)<=5).length,
  };

  const CHAT_CHANNELS = [
    {k:"all",       l:"# All Shelters",    d:"Network-wide"},
    {k:"urgent",    l:"⚠ Urgent",          d:"Time-critical"},
    {k:"transport", l:"🚗 Transport",       d:"Drivers & routes"},
    {k:"medical",   l:"💊 Medical",         d:"Vet assistance"},
    {k:"dogs",      l:"🐶 Dogs",            d:"Dog-specific"},
    {k:"cats",      l:"🐱 Cats",            d:"Cat-specific"},
    ...(shelter.state?[{k:`state_${shelter.state}`,l:`📍 ${shelter.state}`,d:"Your state"}]:[]),
  ];

  const NAV = [
    { s:"Animals", items:[
      {id:"dashboard", l:"Dashboard",         i:"home"},
      {id:"animals",   l:"Animal Records",    i:"paw",   badge:ST.available||null, bc:"#4a6b50", bb:"#eef4ef"},
      {id:"visual",    l:"Visual Shelter",    i:"grid"},
      {id:"intake",    l:"Intake & Outcome",  i:"dl"},
    ]},
    { s:"Care & People", items:[
      {id:"adoptions", l:"Adoptions",         i:"heart", badge:apps.filter(a=>a.status==="pending").length||null, bc:"#2563eb", bb:"#eff6ff"},
      {id:"foster",    l:"Foster Program",    i:"home"},
      {id:"medical",   l:"Medical Records",   i:"med",   badge:ST.medical||null, bc:"#c85a35", bb:"#fdf0eb"},
      {id:"volunteers",l:"Volunteers",        i:"users"},
      {id:"field",     l:"Field Services",    i:"map"},
    ]},
    { s:"Operations", items:[
      {id:"tasks",     l:"Tasks",             i:"task",  badge:tasks.filter(t=>!t.done&&t.priority==="High").length||null, bc:"#c85a35", bb:"#fdf0eb"},
      {id:"events",    l:"Events",            i:"cal"},
      {id:"transport", l:"Transport",         i:"truck"},
      {id:"chat",      l:"Coordinator Chat",  i:"chat",  badge:msgs.filter(m=>m.fid&&m.fid!==shelter.id&&!m.sys).length>0?"●":null, bc:"#c85a35", bb:"#fdf0eb"},
    ]},
    { s:"Tools", items:[
      {id:"inventory", l:"Inventory",         i:"box"},
      {id:"contracts", l:"Contracts",         i:"file"},
      {id:"microchip", l:"Microchip Lookup",  i:"chip"},
      {id:"reports",   l:"Reports",           i:"chart"},
      {id:"network",   l:"RPL Network",       i:"net"},
      {id:"staff",     l:"Staff & Security",  i:"shield", perm:"canManageStaff"},
      {id:"settings",  l:"Settings",          i:"cog"},
    ]},
  ];

  // ── Current user permissions shorthand ──────────────────
  const P = perms(currentUser?.role || "Read Only");

  const curLabel = NAV.flatMap(s=>s.items).find(n=>n.id===tab)?.l || "Dashboard";

  // ── LOCK SCREEN ───────────────────────────────────────
  if (locked) return (
    <div className="ls">
      <style>{G}</style>
      <div style={{ textAlign:"center", padding:32 }}>
        <div style={{ color:"#fff", marginBottom:16 }}><Ic n="lock" s={36} c="#fff"/></div>
        <img src="https://i.imgur.com/Ek2yDNL.png" alt="RescuPawLink" style={{ height:38, marginBottom:14, display:"block", margin:"0 auto 14px" }}/>
        <div style={{fontFamily:"Lora,Georgia,serif",color:"#1a1c18",fontSize:22,fontWeight:700,marginBottom:4,letterSpacing:"-.3px"}}>Screen locked</div>
        <div style={{ color:"rgba(255,255,255,.7)", fontSize:12, marginBottom:22 }}>Enter your 4-digit PIN to continue</div>
        <input className="inp" type="password" maxLength={4} placeholder="PIN" value={lockPin}
          onChange={e=>{ const v=e.target.value.replace(/\D/g,""); setLockPin(v); if(v.length===4){ const ok=staff.find(s=>s.pin===v); if(ok){setLocked(false);setLockPin("");setLockErr("");setCurrentUser({name:ok.name,role:ok.role,pin:ok.pin});log(`Unlocked by ${ok.name} (${ok.role})`);}else{setLockErr("Incorrect PIN");setLockPin("");} }}}
          style={{textAlign:"center",fontSize:24,letterSpacing:"0.4em",width:180,marginBottom:8,border:"2px solid #dce9dd",background:"#fff",color:"#1a1c18",borderRadius:12,padding:"12px"}}/>
        {lockErr && <div style={{ color:"#ffccaa", fontSize:12, marginBottom:12 }}>{lockErr}</div>}
        <div style={{ marginTop:8 }}>
          <button className="btn bg bsm" onClick={()=>{setLocked(false);setLockPin("");setLockErr("");}}>Use password →</button>
        </div>
        <div style={{ color:"rgba(255,255,255,.35)", fontSize:11, marginTop:20 }}>{shelter.name} · Auto-locked after 30 min idle</div>
      </div>
    </div>
  );

  // ── FULL APP ──────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <style>{G}</style>

      {/* Toast */}
      {toast && <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:"#1a1c18", color:"#fff", borderRadius:10, padding:"9px 18px", fontSize:12, fontWeight:600, zIndex:999, boxShadow:"0 6px 20px rgba(0,0,0,.25)", whiteSpace:"nowrap", pointerEvents:"none" }}>{toast}</div>}

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside className="sb">
        <div className="sb-logo">
          <img src="https://i.imgur.com/Ek2yDNL.png" alt="RescuPawLink" style={{height:28,display:"block",filter:"brightness(0) invert(1)",opacity:.92}}/>
        </div>

        <div className="sb-id" style={{padding:"14px 16px 14px",borderBottom:"1px solid rgba(255,255,255,.07)",background:"rgba(255,255,255,.04)"}}>
          <div style={{ fontSize:9, fontWeight:700, color:"#4a6b50", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>Signed in as</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1c18", marginBottom:2 }}>🏠 {shelter.name}</div>
          <div style={{ fontSize:10, color:"#4e5449" }}>{shelter.city}, {shelter.state} · {shelter.type}</div>
          <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
            <span className="bdg" style={{ background:shelter.verified?"#eef4ef":"#fdf0eb", color:shelter.verified?"#4a6b50":"#c85a35", border:`1px solid ${shelter.verified?"#c7dfc9":"#f0c4b4"}`, fontSize:9 }}>{shelter.verified?"✓ Verified":"⏳ Pending"}</span>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
          {NAV.map(section=>(
            <div key={section.s}>
              <div className="nl">{section.s}</div>
              {section.items.filter(item=>!item.perm||P[item.perm]).map(item=>(
                <button key={item.id} className={`ni ${tab===item.id?"on":""}`} onClick={()=>setTab(item.id)}>
                  <span style={{ color:tab===item.id?"#6b8f71":"#9a9e95" }}><Ic n={item.i} s={13}/></span>
                  {item.l}
                  {item.badge ? <span className="nb" style={{ background:item.bb, color:item.bc, border:`1px solid ${item.bc}44` }}>{item.badge}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Subscription status */}
        <div style={{borderTop:"1px solid #dce9dd",padding:"10px 16px",cursor:"pointer",background:"#f5faf5"}} onClick={()=>setShowSub(true)}>
          <div style={{fontSize:9,fontWeight:700,color:"#6b8f71",textTransform:"uppercase",letterSpacing:".12em",marginBottom:3}}>Subscription</div>
          <div style={{fontSize:11,fontWeight:700,color:sub?.daysLeft===0?"#c85a35":sub?.plan==="trial"?"#c47a1e":"#4a6b50"}}>
            {sub?.plan==="trial"?(sub.daysLeft===0?"⚠ Trial expired":`⏱ Trial — ${sub.daysLeft}d left`):"✓ Active plan"}
          </div>
        </div>
        <a href="mailto:rescupawlink@gmail.com" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderTop:"1px solid #dce9dd",fontSize:11,color:"#7a9e7e",textDecoration:"none",background:"#f5faf5",fontFamily:"inherit"}}>
          <Ic n="mail" s={13}/> Contact Support
        </a>
        <div style={{borderTop:"1px solid #dce9dd",display:"flex"}}>
          <button className="ni" style={{color:"#7a9e7e",flex:1,justifyContent:"center"}} onClick={()=>setLocked(true)}>><span style={{color:"#7a9e7e"}}><Ic n="lock" s={13}/></span>Lock</button>
          <button className="ni" style={{color:"#c85a35",flex:1,justifyContent:"center"}} onClick={signOut}><span style={{color:"#c85a35"}}><Ic n="out" s={13}/></span>Sign out</button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        {updateAvailable&&(
      <div style={{background:"#c85a35",color:"#fff",padding:"8px 20px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span>🎉 RescuPawLink v{updateAvailable.version} is available!</span>
        <div style={{display:"flex",gap:8}}>
          <a href={updateAvailable.url} target="_blank" rel="noopener noreferrer" style={{color:"#fff",fontWeight:700,textDecoration:"underline"}}>Download update</a>
          <button onClick={()=>setUpdateAvailable(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕ Dismiss</button>
        </div>
      </div>
    )}
    <div className="tb">
          <div style={{fontFamily:"Lora,Georgia,serif",fontSize:16,fontWeight:700,color:"#18211a",letterSpacing:"-.2px"}}>{curLabel}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {ST.urgent>0 && <div style={{ background:"#fdf0eb", color:"#c85a35", border:"1px solid #f0c4b4", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}><Ic n="warn" s={12} c="#c85a35"/> {ST.urgent} urgent</div>}
            <div style={{ fontSize:11, color:"#9a9e95" }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
            <span className="bdg" style={{ background:"#eef4ef", color:"#4a6b50", border:"1px solid #c7dfc9", fontSize:11 }}>{ST.available} available</span>
            {ST.medical>0&&<span className="bdg" style={{ background:"#fdf0eb", color:"#c85a35", border:"1px solid #f0c4b4", fontSize:11 }}>{ST.medical} medical</span>}
            {tab==="animals"&&P.canEditAnimals&&<button className="btn bp bsm" onClick={()=>{setEditAnimal(null);setShowAnimal(true);}}><Ic n="plus" s={12} c="#fff"/> Add Animal</button>}
            <button className="btn bg bsm" onClick={()=>setLocked(true)} title="Lock screen"><Ic n="lock" s={12}/></button>
          </div>
        </div>

        {/* Trial banner */}
        {sub?.plan==="trial" && sub.daysLeft<=7 && (
          <div className="ab" style={{ background:sub.daysLeft===0?"#fdf0eb":"#fdf6ec", borderColor:sub.daysLeft===0?"#f0c4b4":"#fde68a", color:sub.daysLeft===0?"#c85a35":"#92400e" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:600 }}><Ic n="warn" s={13} c="currentColor"/> {sub.daysLeft===0?"Trial expired. Subscribe to keep access.":`${sub.daysLeft} day${sub.daysLeft!==1?"s":""} left in your free trial.`}</div>
            <button className="btn bsm" style={{ background:sub.daysLeft===0?"#c85a35":"#c47a1e", color:"#fff", border:"none" }} onClick={()=>setShowSub(true)}>Subscribe Now</button>
          </div>
        )}

        {/* Permission denied overlay for blocked tabs */}
        {(
          (tab==="staff"&&!P.canManageStaff) ||
          (tab==="donations"&&!P.canViewDonations) ||
          (tab==="donors"&&!P.canViewDonations) ||
          (tab==="reports"&&!P.canViewReports)
        ) && (
          <div style={{ position:"absolute", inset:0, background:"rgba(248,248,246,.95)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
            <div style={{ fontSize:32 }}>🔒</div>
            <div style={{ fontSize:17, fontWeight:700, color:"#1a1c18" }}>Access restricted</div>
            <div style={{ fontSize:13, color:"#9a9e95", maxWidth:320, textAlign:"center", lineHeight:1.6 }}>
              Your current role (<strong style={{ color:"#4a6b50" }}>{currentUser?.role||"Staff"}</strong>) does not have permission to access this section.
            </div>
            <div style={{ fontSize:12, color:"#4e5449", background:"#fff", border:"1px solid #e8e8e6", borderRadius:10, padding:"12px 18px", maxWidth:340, textAlign:"center" }}>
              Contact your shelter Admin to change your role, or switch to an authorized user.
            </div>
            {P.canManageStaff && <button className="btn bp bsm" onClick={()=>setShowRoleSwitch(true)}>Switch User</button>}
          </div>
        )}
        <div className="pg">

          {/* ═══════════ DASHBOARD ════════════════════════ */}
          {tab==="dashboard" && (<div>
            {/* Welcome row */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Lora',Georgia,serif",fontSize:22,fontWeight:700,color:"#1a1c18",letterSpacing:"-.3px",marginBottom:3}}>
                  {new Date().getHours()<12?"Good morning":new Date().getHours()<17?"Good afternoon":"Good evening"} 👋
                </div>
                <div style={{fontSize:12,color:"#9aae9b"}}>
                  {shelter.name} · {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn bg bsm" onClick={()=>setTab("animals")}><Ic n="paw" s={12}/> Add Animal</button>
                <button className="btn bp bsm" onClick={()=>setTab("tasks")}><Ic n="task" s={12} c="#fff"/> New Task</button>
              </div>
            </div>

            <div className="g4" style={{marginBottom:18}}>
              {[
                {l:"Available", v:ST.available, c:"#4a6b50", bdg:"bdg-green", k:"available"},
                {l:"In Foster",  v:ST.foster,    c:"#7c3aed", bdg:"bdg-purple", k:"foster"},
                {l:"Medical",   v:ST.medical,   c:"#c85a35", bdg:"bdg-red", k:"medical"},
                {l:"Adopted ✓", v:ST.adopted,   c:"#16a34a", bdg:"bdg-teal", k:"adopted"},
                {l:"Medical",   v:ST.medical,   c:"#c85a35", e:"⚕️", k:"medical"},
                {l:"Stray Hold",v:ST.hold,      c:"#c47a1e", e:"🔎", k:"stray_hold"},
                {l:"Urgent",    v:ST.urgent,    c:"#c85a35", e:"⚠️", k:"__"},
              ].map(s=>(
                <div key={s.l} className="st" style={{ borderColor:s.v>0&&(s.c==="#c85a35")?"#f0c4b4":"#e8e8e6" }} onClick={()=>{setTab("animals");if(s.k!=="all"&&s.k!=="__")setStFilter(s.k);}}>
                  <div style={{fontSize:18,marginBottom:4,lineHeight:1}}>{s.e}</div>
                  <div style={{fontFamily:"Lora,Georgia,serif",fontSize:22,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{ fontSize:10, color:"#9a9e95", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="g3" style={{ marginBottom:12 }}>
              {/* Species */}
              <div className="card">
                <div className="ct">By species</div>
                {SPECIES.map(sp=>{ const c=animals.filter(a=>a.species===sp).length; return c>0?(
                  <div key={sp} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                    <div style={{ width:78, fontSize:11, color:"#4e5449" }}>{sp}</div>
                    <div style={{ flex:1, height:5, background:"#f0f0ee", borderRadius:3, overflow:"hidden" }}><div style={{ width:`${animals.length?(c/animals.length)*100:0}%`, height:"100%", background:"#6b8f71", borderRadius:3 }}/></div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#4a6b50", width:18, textAlign:"right" }}>{c}</div>
                  </div>
                ):null; })}
                {!animals.length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No animals yet</div>}
              </div>

              {/* Tasks */}
              <div className="card">
                <div className="ct" style={{ display:"flex", justifyContent:"space-between" }}>Today's tasks <span style={{ cursor:"pointer", color:"#6b8f71" }} onClick={()=>setTab("tasks")}>All →</span></div>
                {tasks.filter(t=>!t.done).slice(0,4).map(t=>(
                  <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                    <input type="checkbox" style={{ marginTop:1 }} onChange={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:true}:x))}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, lineHeight:1.35 }}>{t.text}</div>
                      <div style={{ fontSize:10, color:"#9a9e95" }}>{t.assignee}</div>
                    </div>
                    {t.priority==="high"&&<span className="bdg" style={{ background:"#fdf0eb", color:"#c85a35", border:"1px solid #f0c4b4", fontSize:9 }}>!</span>}
                  </div>
                ))}
                <button className="btn bg bsm" style={{ width:"100%", justifyContent:"center", marginTop:4, fontSize:11 }} onClick={()=>setTab("tasks")}>+ Add task</button>
              </div>

              {/* Appointments */}
              <div className="card">
                <div className="ct" style={{ display:"flex", justifyContent:"space-between" }}>Appointments <span style={{ cursor:"pointer", color:"#6b8f71" }} onClick={()=>setTab("medical")}>All →</span></div>
                {appts.slice(0,3).map(a=>(
                  <div key={a.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:"1px solid #f0f0ee" }}>
                    <div style={{ fontSize:11, fontWeight:700 }}>{a.animal} — {a.type}</div>
                    <div style={{ fontSize:10, color:"#4e5449" }}>{a.date} · {a.time}</div>
                    <div style={{ fontSize:10, color:"#9a9e95" }}>{a.vet}</div>
                  </div>
                ))}
                <button className="btn bg bsm" style={{ width:"100%", justifyContent:"center", fontSize:11 }} onClick={()=>{setTab("medical");setShowApptForm(true);}}>+ Schedule</button>
              </div>
            </div>

            {/* Recent animals */}
            <div className="card">
              <div className="ct" style={{ display:"flex", justifyContent:"space-between" }}>Recent animals <span style={{ cursor:"pointer", color:"#6b8f71" }} onClick={()=>setTab("animals")}>View all →</span></div>
              {animals.length===0
                ? <div style={{ textAlign:"center", padding:"20px 0", color:"#9a9e95" }}>No animals yet. <button className="btn bg bsm" style={{ marginLeft:8 }} onClick={()=>{setTab("animals");setShowAnimal(true);}}>Add first animal</button></div>
                : <div className="g4">{animals.slice(0,4).map(a=>(
                    <div key={a.id} style={{background:"#fff",border:"1px solid #e4ebe5",borderRadius:14,padding:12,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.04)",transition:"all .18s"}} onClick={()=>{setEditAnimal(a);setShowAnimal(true);setTab("animals");}}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ fontSize:12, fontWeight:700 }}>{a.name}</div>
                        <SB s={a.status}/>
                      </div>
                      <div style={{ fontSize:10, color:"#4e5449" }}>{a.species} · {a.breed||"—"}</div>
                      <div style={{ fontSize:10, color:"#9a9e95" }}>{a.age} · {a.sex} · Kennel {a.kennel||"—"}</div>
                      <div style={{ display:"flex", gap:3, marginTop:5, flexWrap:"wrap" }}>
                        {a.vaccinated&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>💉</span>}
                        {a.altered&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>✂</span>}
                        {(a.heartworm||a.fiv||a.felv)&&<span className="tag" style={{ fontSize:9, padding:"1px 5px", background:"#fdf0eb", color:"#c85a35" }}>⚕</span>}
                      </div>
                    </div>
                  ))}</div>}
            </div>
          </div>)}

          {/* ═══════════ ANIMALS ══════════════════════════ */}
          {tab==="animals" && (<div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div className="page-title">Animal Records</div>
                <div style={{ fontSize:11, color:"#9a9e95" }}>{animals.length} total · {ST.available} available</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {P.canExport&&<button className="btn bg bsm" onClick={exportCSV}><Ic n="dl" s={12}/> Export CSV</button>}
                {P.canImport&&<label className="btn bg bsm" style={{ cursor:"pointer" }}><Ic n="dl" s={12}/> Import CSV<input type="file" accept=".csv" style={{ display:"none" }} onChange={importCSV}/></label>}
                {P.canEditAnimals&&<button className="btn bp bsm" onClick={()=>{setEditAnimal(null);setShowAnimal(true);}}><Ic n="plus" s={12} c="#fff"/> Add Animal</button>}
              </div>
            </div>

            <div className="card" style={{ marginBottom:12, padding:12, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#9a9e95" }}><Ic n="srch" s={12}/></span>
                <input style={{ border:"1px solid #e0e0de", borderRadius:8, padding:"7px 11px 7px 28px", fontSize:12, fontFamily:"inherit", outline:"none", width:220 }} placeholder="Name, breed, or chip #…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {["All",...SPECIES].map(s=><Pill key={s} label={s} active={spFilter===s} onClick={()=>setSpFilter(s)}/>)}
              </div>
              <select className="sel" style={{ width:170, fontSize:12 }} value={stFilter} onChange={e=>setStFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                {STATUSES.map(s=><option key={s.k} value={s.k}>{s.l}</option>)}
              </select>
              {(search||spFilter!=="All"||stFilter!=="all")&&<button className="btn bg bsm" onClick={()=>{setSearch("");setSpFilter("All");setStFilter("all");}}>Clear</button>}
              <div style={{ marginLeft:"auto", fontSize:11, color:"#9a9e95" }}>{filtered.length} result{filtered.length!==1?"s":""}</div>
            </div>

            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <table className="tbl">
                <thead><tr><th>Animal</th><th>Species</th><th>Kennel</th><th>Microchip</th><th>Intake</th><th>Status</th><th>Listing</th><th>Health</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(a=>(
                    <tr key={a.id} onClick={()=>{setEditAnimal(a);setShowAnimal(true);}}>
                      <td style={{width:46,paddingRight:4}}>
                        {a.photo
                          ? <img src={a.photo} alt={a.name} style={{width:34,height:34,borderRadius:7,objectFit:"cover",border:"1px solid #e4ede4",display:"block"}}/>
                          : <div style={{width:34,height:34,borderRadius:7,background:"#f0f4f0",border:"1px solid #e4ede4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{a.species==="Cat"?"🐈":"🐕"}</div>
                        }
                      </td>
                      <td><div style={{ fontWeight:700, fontSize:12 }}>{a.name}</div><div style={{ fontSize:10, color:"#9a9e95" }}>{a.breed||"—"} · {a.age} · {a.sex}</div></td>
                      <td><span className="tag" style={{ fontSize:10 }}>{a.species}</span></td>
                      <td style={{ fontWeight:700, color:"#4a6b50", fontSize:12 }}>{a.kennel||"—"}</td>
                      <td style={{ fontFamily:"monospace", fontSize:11, color:"#4e5449" }}>{a.microchip||"—"}</td>
                      <td><div style={{ fontSize:11 }}>{a.intakeDate||"—"}</div><div style={{ fontSize:10, color:"#9a9e95" }}>{a.intakeSource}</div></td>
                      <td><SB s={a.status}/></td>
                      <td><span className="bdg" style={{ background:a.listingType==="foster"?"#f0fdf4":a.listingType==="none"?"#f4f4f2":"#eff6ff", color:a.listingType==="foster"?"#16a34a":a.listingType==="none"?"#4e5449":"#2563eb", border:"1px solid", borderColor:a.listingType==="foster"?"#86efac":a.listingType==="none"?"#e0e0de":"#bfdbfe", fontSize:10 }}>{a.listingType==="foster"?"Foster":a.listingType==="none"?"Internal":a.listingType==="both"?"Both":"Adopt"}</span></td>
                      <td><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                        {a.vaccinated&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>💉</span>}
                        {a.altered&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>✂</span>}
                        {(a.heartworm||a.fiv||a.felv)&&<span className="tag" style={{ fontSize:9, padding:"1px 5px", background:"#fdf0eb", color:"#c85a35" }}>⚕</span>}
                        {a.goodWithKids&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>👶</span>}
                        {a.goodWithDogs&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>🐕</span>}
                        {a.goodWithCats&&<span className="tag" style={{ fontSize:9, padding:"1px 5px" }}>🐈</span>}
                      </div></td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button className="btn bg bsm" onClick={()=>{setEditAnimal(a);setShowAnimal(true);}}><Ic n="ed" s={11}/></button>
                          <button className="btn bd bsm" onClick={()=>delAnimal(a.id,a.name)}><Ic n="x" s={11}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length===0&&(
                <div style={{ textAlign:"center", padding:"48px 24px" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🐾</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#4e5449", marginBottom:6 }}>{animals.length===0?"No animals yet":"No animals match your filters"}</div>
                  {animals.length===0&&<button className="btn bp bsm" style={{ marginTop:8 }} onClick={()=>{setShowAnimal(true);}}><Ic n="plus" s={12} c="#fff"/> Add First Animal</button>}
                </div>
              )}
            </div>
          </div>)}

          {/* ═══════════ VISUAL SHELTER ═══════════════════ */}
          {tab==="visual" && (<div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>Visual Shelter</div>
            <div style={{ fontSize:12, color:"#9a9e95", marginBottom:14 }}>Color-coded map of your physical space. Click any kennel to view or edit that animal.</div>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              {STATUSES.slice(0,6).map(s=><div key={s.k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}><div style={{ width:11, height:11, borderRadius:3, background:s.bg, border:`1px solid ${s.b}` }}/><span style={{ color:"#4e5449" }}>{s.l}</span></div>)}
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}><div style={{ width:11, height:11, borderRadius:3, background:"#f8f8f6", border:"1px dashed #e0e0de" }}/><span style={{ color:"#9a9e95" }}>Empty</span></div>
            </div>
            {KENNEL_AREAS.map(area=>{
              const areaAnimals = animals.filter(a=>a.room===area.id);
              return (
                <div key={area.id} className="card" style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:area.color }}/>
                    <div className="ct" style={{ margin:0 }}>{area.name}</div>
                    <div style={{ fontSize:10, color:"#9a9e95", marginLeft:"auto" }}>{areaAnimals.length} animal{areaAnimals.length!==1?"s":""}</div>
                  </div>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {Array.from({length:8},(_,i)=>{
                      const kn=`${area.id}-${i+1}`;
                      const an=animals.find(a=>a.kennel===kn);
                      const st=an?(STATUSES.find(x=>x.k===an.status)||STATUSES[0]):null;
                      return (
                        <div key={kn} style={{ width:82, minHeight:74, border:`1px solid ${st?st.b:"#e0e0de"}`, borderRadius:8, background:st?st.bg:"#f8f8f6", padding:8, cursor:an?"pointer":"default", transition:"box-shadow .15s" }}
                          onClick={()=>{ if(an){setEditAnimal(an);setShowAnimal(true);setTab("animals");} }}
                          onMouseEnter={e=>{ if(an) e.currentTarget.style.boxShadow="0 2px 8px rgba(107,143,113,.2)"; }}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                          <div style={{ fontSize:9, color:"#9a9e95", fontWeight:700 }}>{kn}</div>
                          {an ? (<>
                            <div style={{ fontSize:11, fontWeight:700, color:"#1a1c18", marginTop:4, lineHeight:1.2 }}>{an.name}</div>
                            <div style={{ fontSize:9, color:"#4e5449", marginTop:2 }}>{an.species}</div>
                            <span className="bdg" style={{ background:st?.bg, color:st?.c, border:`1px solid ${st?.b}`, fontSize:8, marginTop:4 }}>{st?.l}</span>
                          </>) : <div style={{ fontSize:9, color:"#c0c0bb", marginTop:10 }}>Empty</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>)}

          {/* ═══════════ INTAKE / OUTCOME ════════════════ */}
          {tab==="intake" && (<div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>Intake & Outcome</div>
            <div className="g2">
              <div className="card">
                <div className="ct">Quick intake</div>
                <button className="btn bp" style={{ width:"100%", justifyContent:"center", marginBottom:8 }} onClick={()=>{setEditAnimal({...EMPTY_ANIMAL,intakeDate:new Date().toISOString().slice(0,10)});setShowAnimal(true);}}>
                  <Ic n="plus" s={12} c="#fff"/> New Animal Intake
                </button>
                <div style={{ fontSize:11, color:"#9a9e95", textAlign:"center" }}>Opens the full 5-tab intake form</div>
              </div>
              <div className="card">
                <div className="ct">Recent intakes (30 days)</div>
                {animals.filter(a=>{ const d=new Date(a.intakeDate); return !isNaN(d)&&(Date.now()-d.getTime())<30*86400000; }).slice(0,6).map(a=>(
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f0ee", fontSize:12 }}>
                    <div><span style={{ fontWeight:700 }}>{a.name}</span><span style={{ color:"#9a9e95", marginLeft:8 }}>{a.species} · {a.intakeSource}</span></div>
                    <span style={{ color:"#9a9e95", fontSize:11 }}>{a.intakeDate}</span>
                  </div>
                ))}
                {!animals.filter(a=>{ const d=new Date(a.intakeDate); return !isNaN(d)&&(Date.now()-d.getTime())<30*86400000; }).length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No intakes in last 30 days.</div>}
              </div>
              <div className="card">
                <div className="ct">Recent outcomes</div>
                {animals.filter(a=>["adopted","transferred","returned","euthanized"].includes(a.status)).slice(0,6).map(a=>(
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f0ee", fontSize:12, alignItems:"center" }}>
                    <div><span style={{ fontWeight:700 }}>{a.name}</span><span style={{ color:"#9a9e95", marginLeft:8 }}>{a.species}</span></div>
                    <SB s={a.status}/>
                  </div>
                ))}
                {!animals.filter(a=>["adopted","transferred","returned","euthanized"].includes(a.status)).length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No recorded outcomes yet.</div>}
              </div>
              <div className="card">
                <div className="ct">Import animals from CSV</div>
                <div style={{ fontSize:12, color:"#4e5449", marginBottom:10, lineHeight:1.6 }}>Upload your existing animal records. Download the template to see the required format.</div>
                <button className="btn bg bsm" style={{ marginBottom:10 }} onClick={()=>{
                  const h=["name","species","breed","age","sex","altered","weight","color","microchip","intake_date","intake_source","status","kennel","fee","vaccinated","neutered","good_with_kids","good_with_dogs","good_with_cats","description"];
                  const ex="Buddy,Dogs,Lab Mix,2 years,Male,Yes,45,Black,985112345678,2026-01-15,Stray,available,A-1,75,Yes,Yes,Yes,Yes,No,Friendly dog loves everyone";
                  const csv=[h.join(","),ex].join("\n");
                  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="RPL_Import_Template.csv"; a.click();
                  toast2("✅ Template downloaded!");
                }}><Ic n="dl" s={11}/> Download template</button>
                <div style={{ border:"2px dashed #c7dfc9", borderRadius:10, padding:"22px", textAlign:"center" }}>
                  <div style={{ fontSize:12, color:"#9a9e95", marginBottom:8 }}>Drag & drop CSV here or click to choose file</div>
                  <label className="btn bg bsm" style={{ cursor:"pointer", display:"inline-flex" }}><Ic n="dl" s={11}/> Choose CSV file<input type="file" accept=".csv" style={{ display:"none" }} onChange={importCSV}/></label>
                </div>
              </div>
            </div>
          </div>)}

          {/* ═══════════ ADOPTIONS ════════════════════════ */}
          {tab==="adoptions" && (<div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>Adoption Management</div>
            <div className="g3" style={{ marginBottom:14 }}>
              {[{l:"Pending Review",v:apps.filter(a=>a.status==="pending").length,c:"#c47a1e",bg:"#fdf6ec"},{l:"Approved",v:apps.filter(a=>a.status==="approved").length,c:"#16a34a",bg:"#f0fdf4"},{l:"Completed",v:ST.adopted,c:"#6b8f71",bg:"#eef4ef"}].map(s=>(
                <div key={s.l} className="card" style={{ background:s.bg, border:`1px solid ${s.c}33` }}>
                  <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11, color:"#4e5449", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom:12 }}>
              <div className="ct">Pending applications</div>
              {apps.filter(a=>a.status==="pending").map(a=>(
                <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #f0f0ee", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{a.name}</div>
                    <div style={{ fontSize:11, color:"#4e5449" }}>Applying for <strong>{a.animal}</strong> · {a.type==="foster"?"Foster":"Adoption"} · {a.date}</div>
                    <div style={{ fontSize:11, color:"#9a9e95" }}>{a.email} · {a.phone}</div>
                    {a.notes&&<div style={{ fontSize:11, color:"#4e5449", marginTop:3, fontStyle:"italic" }}>"{a.notes}"</div>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    {P.canManageAdoptions&&<button className="btn bp bsm" onClick={()=>{ setApps(p=>p.map(x=>x.id===a.id?{...x,status:"approved"}:x)); toast2(`✅ ${a.name} approved!`); log(`Approved: ${a.name}`); }}>Approve</button>}
                    <button className="btn bg bsm">Follow Up</button>
                    {P.canManageAdoptions&&<button className="btn bd bsm" onClick={()=>{ setApps(p=>p.map(x=>x.id===a.id?{...x,status:"denied"}:x)); toast2("Application denied."); }}>Deny</button>}
                  </div>
                </div>
              ))}
              {!apps.filter(a=>a.status==="pending").length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No pending applications.</div>}
            </div>

            <div className="card">
              <div className="ct">Mobile checkout — adoptable animals</div>
              <div style={{ fontSize:12, color:"#4e5449", marginBottom:10, lineHeight:1.6 }}>Start digital paperless checkout for any available animal. Adopters are automatically prompted to donate — 71% of adopters give $20+.</div>
              {animals.filter(a=>a.status==="available").slice(0,6).map(a=>(
                <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:"#f8fdf8", borderRadius:10, border:"1px solid #c7dfc9", marginBottom:6 }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:12 }}>{a.name}</span>
                    <span style={{ color:"#9a9e95", fontSize:11, marginLeft:8 }}>{a.breed} · {a.age} · Kennel {a.kennel||"N/A"}</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="btn bp bsm" onClick={()=>{ setAnimals(p=>p.map(x=>x.id===a.id?{...x,status:"pending"}:x)); setDonations(prev=>[{id:Date.now(),donor:"Checkout prompt",amount:0,date:new Date().toISOString().slice(0,10),type:"Adoption",note:`Checkout started for ${a.name} — donation prompt enabled`},...prev]); toast2(`📋 ${a.name} checkout started! Donation prompt enabled.`); log(`Checkout started: ${a.name}`); }}>Start Checkout</button>
                    <button className="btn bg bsm" onClick={()=>window.open("https://rescupawlink.com","_blank")}>Post to Network</button>
                  </div>
                </div>
              ))}
              {!animals.filter(a=>a.status==="available").length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No available animals right now.</div>}
            </div>
          </div>)}

          {/* ═══════════ FOSTER ═══════════════════════════ */}
          {tab==="foster" && (<div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="page-title">Foster Program</div>
              {P.canManageFoster&&<button className="btn bp bsm" onClick={()=>setShowFosterForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> Add Foster Family</button>}
            </div>

            {showFosterForm&&(
              <div className="card" style={{ marginBottom:12 }}>
                <div className="ct">New foster family</div>
                <div className="g2" style={{ marginBottom:10 }}>
                  {[["name","Full Name *"],["email","Email *"],["phone","Phone"],["address","Address"],["capacity","Capacity (e.g. 2 dogs or 3 cats)"]].map(([k,l])=>(
                    <div key={k}><label className="lbl">{l}</label><input className="inp" value={newFoster[k]||""} onChange={e=>setNewFoster(p=>({...p,[k]:e.target.value}))}/></div>
                  ))}
                  <div><label className="lbl">Notes / Preferences</label><input className="inp" value={newFoster.notes||""} onChange={e=>setNewFoster(p=>({...p,notes:e.target.value}))}/></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn bp bsm" disabled={!newFoster.name} onClick={()=>{ setFosters(p=>[...p,{...newFoster,id:Date.now(),approved:true,currentCount:0,available:true}]); setNewFoster({name:"",email:"",phone:"",address:"",capacity:"",notes:""}); setShowFosterForm(false); toast2("✅ Foster family added!"); }}>Add</button>
                  <button className="btn bg bsm" onClick={()=>setShowFosterForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="g2">
              <div className="card">
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                  <div className="ct" style={{ margin:0 }}>Foster families ({fosters.length})</div>
                  <input style={{ border:"1px solid #e0e0de", borderRadius:7, padding:"4px 9px", fontSize:11, fontFamily:"inherit", outline:"none", width:130 }} placeholder="Search…" value={fosterSearch} onChange={e=>setFosterSearch(e.target.value)}/>
                </div>
                {fosters.filter(f=>f.name.toLowerCase().includes(fosterSearch.toLowerCase())).map(f=>(
                  <div key={f.id} style={{ padding:"11px 0", borderBottom:"1px solid #f0f0ee" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <div style={{ fontWeight:700, fontSize:12 }}>{f.name}</div>
                      <span className="bdg" style={{ background:f.available?"#f0fdf4":"#fdf6ec", color:f.available?"#16a34a":"#c47a1e", border:`1px solid ${f.available?"#86efac":"#fde68a"}`, fontSize:9 }}>{f.available?"Available":"Full"}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#4e5449" }}>{f.email} · {f.phone}</div>
                    <div style={{ fontSize:11, color:"#9a9e95" }}>Capacity: {f.capacity}</div>
                    {f.notes&&<div style={{ fontSize:11, color:"#4e5449", marginTop:3, fontStyle:"italic" }}>{f.notes}</div>}
                    <button className="btn bd bsm" style={{ marginTop:7 }} onClick={()=>setFosters(p=>p.filter(x=>x.id!==f.id))}>Remove</button>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="ct">Animals in foster ({animals.filter(a=>a.status==="foster").length})</div>
                {animals.filter(a=>a.status==="foster").map(a=>(
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f0f0ee" }}>
                    <div><div style={{ fontWeight:700, fontSize:12 }}>{a.name}</div><div style={{ fontSize:11, color:"#9a9e95" }}>{a.species} · {a.breed}</div></div>
                    <button className="btn bg bsm" onClick={()=>{ setAnimals(p=>p.map(x=>x.id===a.id?{...x,status:"available"}:x)); toast2(`${a.name} returned from foster`); }}>Return</button>
                  </div>
                ))}
                {!animals.filter(a=>a.status==="foster").length&&<div style={{ fontSize:12, color:"#9a9e95", marginBottom:12 }}>No animals currently in foster.</div>}

                <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f0f0ee" }}>
                  <div className="ct">Place animal in foster</div>
                  <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                    <select className="sel" id="fa-sel" style={{ flex:1, fontSize:11 }}>
                      <option value="">Select animal</option>
                      {animals.filter(a=>["available","hold"].includes(a.status)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <select className="sel" id="ff-sel" style={{ flex:1, fontSize:11 }}>
                      <option value="">Select foster family</option>
                      {fosters.filter(f=>f.available).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button className="btn bp bsm" onClick={()=>{
                      const aId=document.getElementById("fa-sel").value;
                      if(aId){ setAnimals(p=>p.map(x=>x.id===aId?{...x,status:"foster"}:x)); toast2("✅ Animal placed in foster!"); log("Placed animal in foster"); }
                    }}>Place</button>
                  </div>
                </div>
              </div>
            </div>
          </div>)}

          {/* ═══════════ MEDICAL ══════════════════════════ */}
          {tab==="medical" && (<div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="page-title">Medical Records</div>
              {P.canEditMedical&&<button className="btn bp bsm" onClick={()=>setShowApptForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> Schedule Appointment</button>}
            </div>

            {showApptForm&&(
              <div className="card" style={{ marginBottom:12 }}>
                <div className="ct">New appointment</div>
                <div className="g3" style={{ marginBottom:10 }}>
                  <div><label className="lbl">Animal</label><select className="sel" value={newAppt.animal} onChange={e=>setNewAppt(p=>({...p,animal:e.target.value}))}><option value="">Select animal</option>{animals.map(a=><option key={a.id}>{a.name}</option>)}</select></div>
                  <div><label className="lbl">Type</label><input className="inp" value={newAppt.type} onChange={e=>setNewAppt(p=>({...p,type:e.target.value}))} placeholder="e.g. Spay, Vaccines, Exam"/></div>
                  <div><label className="lbl">Vet / Clinic</label><input className="inp" value={newAppt.vet} onChange={e=>setNewAppt(p=>({...p,vet:e.target.value}))}/></div>
                  <div><label className="lbl">Date</label><input className="inp" type="date" value={newAppt.date} onChange={e=>setNewAppt(p=>({...p,date:e.target.value}))}/></div>
                  <div><label className="lbl">Time</label><input className="inp" type="time" value={newAppt.time} onChange={e=>setNewAppt(p=>({...p,time:e.target.value}))}/></div>
                  <div><label className="lbl">Notes</label><input className="inp" value={newAppt.notes} onChange={e=>setNewAppt(p=>({...p,notes:e.target.value}))}/></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn bp bsm" disabled={!newAppt.animal||!newAppt.type||!newAppt.date} onClick={()=>{ setAppts(p=>[...p,{...newAppt,id:Date.now(),status:"scheduled"}]); setNewAppt({animal:"",type:"",date:"",time:"",vet:"",notes:""}); setShowApptForm(false); toast2("✅ Appointment scheduled!"); }}>Schedule</button>
                  <button className="btn bg bsm" onClick={()=>setShowApptForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="g2">
              <div className="card">
                <div className="ct">Upcoming appointments</div>
                {appts.filter(a=>a.status!=="completed").map(a=>(
                  <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid #f0f0ee" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <div style={{ fontWeight:700, fontSize:12 }}>{a.animal} — {a.type}</div>
                      <span className="bdg" style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", fontSize:9 }}>{a.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#4e5449" }}>{a.date} · {a.time||"—"} · {a.vet}</div>
                    {a.notes&&<div style={{ fontSize:10, color:"#9a9e95", marginTop:2, fontStyle:"italic" }}>{a.notes}</div>}
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <button className="btn bg bsm" onClick={()=>{ setAppts(p=>p.map(x=>x.id===a.id?{...x,status:"completed"}:x)); toast2("Appointment completed"); }}>Mark Complete</button>
                      <button className="btn bd bsm" onClick={()=>setAppts(p=>p.filter(x=>x.id!==a.id))}>Cancel</button>
                    </div>
                  </div>
                ))}
                {!appts.filter(a=>a.status!=="completed").length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No upcoming appointments.</div>}
              </div>

              <div className="card">
                <div className="ct">Medical hold animals</div>
                {animals.filter(a=>a.status==="medical").map(a=>(
                  <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid #f0f0ee" }}>
                    <div style={{ fontWeight:700, fontSize:12, marginBottom:3 }}>{a.name} <SB s={a.status}/></div>
                    <div style={{ fontSize:11, color:"#4e5449" }}>{a.medNotes||"No notes"}</div>
                    <button className="btn bg bsm" style={{ marginTop:6 }} onClick={()=>{ setAnimals(p=>p.map(x=>x.id===a.id?{...x,status:"available"}:x)); toast2(`${a.name} cleared from medical hold`); }}>Clear Hold</button>
                  </div>
                ))}
                {!animals.filter(a=>a.status==="medical").length&&<div style={{ fontSize:12, color:"#9a9e95" }}>No animals on medical hold.</div>}
              </div>
            </div>
          </div>)}

          {/* ═══════════ VOLUNTEERS ═══════════════════════ */}
          {tab==="volunteers" && (<div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="page-title">Volunteer Management</div>
              {P.canManageVolunteers&&<button className="btn bp bsm" onClick={()=>setShowVolForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> Add Volunteer</button>}
            </div>
            {showVolForm&&(
              <div className="card" style={{ marginBottom:12 }}>
                <div className="ct">New volunteer</div>
                <div className="g3" style={{ marginBottom:10 }}>
                  {[["name","Full Name *"],["email","Email"],["phone","Phone"],["skills","Skills / Areas"],["shift","Preferred Shift"]].map(([k,l])=>(
                    <div key={k}><label className="lbl">{l}</label><input className="inp" value={newVol[k]||""} onChange={e=>setNewVol(p=>({...p,[k]:e.target.value}))}/></div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn bp bsm" disabled={!newVol.name} onClick={()=>{ setVols(p=>[...p,{...newVol,id:Date.now(),hours:0,status:"active"}]); setNewVol({name:"",email:"",phone:"",skills:"",shift:""}); setShowVolForm(false); toast2("✅ Volunteer added!"); }}>Add</button>
                  <button className="btn bg bsm" onClick={()=>setShowVolForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <table className="tbl">
                <thead><tr><th>Name</th><th>Skills / Areas</th><th>Contact</th><th>Shift</th><th>Hours</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {vols.map(v=>(
                    <tr key={v.id}>
                      <td style={{ fontWeight:700 }}>{v.name}</td>
                      <td style={{ fontSize:11, color:"#4e5449" }}>{v.skills}</td>
                      <td><div style={{ fontSize:11 }}>{v.email}</div><div style={{ fontSize:10, color:"#9a9e95" }}>{v.phone}</div></td>
                      <td style={{ fontSize:11 }}>{v.shift||"—"}</td>
                      <td style={{ fontWeight:700, color:"#4a6b50" }}>{v.hours}h</td>
                      <td><span className="bdg" style={{ background:"#f0fdf4", color:"#16a34a", border:"1px solid #86efac", fontSize:9 }}>Active</span></td>
                      <td><button className="btn bd bsm" onClick={()=>setVols(p=>p.filter(x=>x.id!==v.id))}><Ic n="x" s={11}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!vols.length&&<div style={{ textAlign:"center", padding:"32px", color:"#9a9e95", fontSize:12 }}>No volunteers yet.</div>}
            </div>
          </div>)}

          {/* ═══════════ FIELD SERVICES ═══════════════════ */}
          {tab==="field" && (<div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="page-title">Field Services</div>
              {P.canManageFieldServices&&<button className="btn bp bsm" onClick={()=>setShowCaseForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> New Case</button>}
            </div>
            {showCaseForm&&(
              <div className="card" style={{ marginBottom:12 }}>
                <div className="ct">New field case</div>
                <div className="g2" style={{ marginBottom:10 }}>
                  <div><label className="lbl">Case type</label><select className="sel" value={newCase.type} onChange={e=>setNewCase(p=>({...p,type:e.target.value}))}>{["Stray Report","Bite Quarantine","Cruelty Report","Welfare Check","TNR Request","License Compliance","Abandon Report","Dead Animal","Owner Surrender","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label className="lbl">Address *</label><input className="inp" value={newCase.address} onChange={e=>setNewCase(p=>({...p,address:e.target.value}))} placeholder="Full address including city, state"/></div>
                  <div><label className="lbl">Assigned officer</label><input className="inp" value={newCase.officer} onChange={e=>setNewCase(p=>({...p,officer:e.target.value}))}/></div>
                  <div><label className="lbl">Notes</label><input className="inp" value={newCase.notes} onChange={e=>setNewCase(p=>({...p,notes:e.target.value}))}/></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn bp bsm" disabled={!newCase.address} onClick={()=>{ const n=`FS-${new Date().getFullYear()}-${String(cases.length+1).padStart(3,"0")}`; setCases(p=>[...p,{...newCase,id:Date.now(),caseNum:n,status:"open",date:new Date().toISOString().slice(0,10)}]); setNewCase({type:"Stray Report",address:"",officer:"",notes:""}); setShowCaseForm(false); toast2("✅ Case created!"); }}>Create Case</button>
                  <button className="btn bg bsm" onClick={()=>setShowCaseForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <table className="tbl">
                <thead><tr><th>Case #</th><th>Type</th><th>Address</th><th>Officer</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {cases.map(c=>{
                    const sc = c.status==="closed"?{bg:"#f0fdf4",c:"#16a34a",b:"#86efac"}:c.status==="active"?{bg:"#eff6ff",c:"#2563eb",b:"#bfdbfe"}:{bg:"#fdf6ec",c:"#c47a1e",b:"#fde68a"};
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight:700, fontFamily:"monospace", fontSize:11 }}>{c.caseNum}</td>
                        <td><span className="tag">{c.type}</span></td>
                        <td style={{ fontSize:11, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.address}</td>
                        <td style={{ fontSize:11 }}>{c.officer||"—"}</td>
                        <td style={{ fontSize:11 }}>{c.date}</td>
                        <td><span className="bdg" style={{ background:sc.bg, color:sc.c, border:`1px solid ${sc.b}`, fontSize:10 }}>{c.status}</span></td>
                        <td>
                          <div style={{ display:"flex", gap:4 }}>
                            <button className="btn bg bsm" onClick={()=>setCases(p=>p.map(x=>x.id===c.id?{...x,status:"active"}:x))}>Activate</button>
                            <button className="btn bg bsm" onClick={()=>setCases(p=>p.map(x=>x.id===c.id?{...x,status:"closed"}:x))}>Close</button>
                            <button className="btn bd bsm" onClick={()=>setCases(p=>p.filter(x=>x.id!==c.id))}><Ic n="x" s={10}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!cases.length&&<div style={{ textAlign:"center", padding:"32px", color:"#9a9e95", fontSize:12 }}>No field cases yet.</div>}
            </div>
          </div>)}

          {/* ═══════════ TASKS ════════════════════════════ */}
          {tab==="tasks" && (<div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div className="page-title">Task Board</div>
                <div className="page-sub">{taskList.filter(t=>!t.done).length} open tasks</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="inp" style={{width:220}} placeholder="New task…" value={newTask} onChange={e=>setNewTask(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newTask.trim()){setTasks(p=>[...p,{id:Date.now(),text:newTask.trim(),done:false,priority:newTaskPri,assignee:newTaskWho,due:new Date().toISOString().slice(0,10)}]);setNewTask("");}}}/>
                <select className="sel" style={{width:100}} value={newTaskPri} onChange={e=>setNewTaskPri(e.target.value)}>
                  {["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
                </select>
                <button className="btn bp bsm" onClick={()=>{if(!newTask.trim())return;setTasks(p=>[...p,{id:Date.now(),text:newTask.trim(),done:false,priority:newTaskPri,assignee:newTaskWho,due:new Date().toISOString().slice(0,10)}]);setNewTask("");}}>
                  <Ic n="plus" s={12} c="#fff"/> Add
                </button>
              </div>
            </div>
            {/* Kanban board */}
            <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
              {[
                {label:"High Priority", color:"#c85a35", bg:"#fff0ee", border:"#f5c4b0", filter:(t)=>!t.done&&t.priority==="High"},
                {label:"Medium",        color:"#c47a1e", bg:"#fffbee", border:"#f5dfa0", filter:(t)=>!t.done&&t.priority==="Medium"},
                {label:"Low",           color:"#6b8f71", bg:"#f0f9f1", border:"#c8ddc9", filter:(t)=>!t.done&&t.priority==="Low"},
                {label:"Completed",     color:"#4e5449", bg:"#f4f6f4", border:"#dde8de", filter:(t)=>t.done},
              ].map(col=>{
                const colTasks = taskList.filter(col.filter);
                return (
                  <div key={col.label} style={{flex:"0 0 240px",background:col.bg,border:`1px solid ${col.border}`,borderRadius:12,padding:12,minHeight:300}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{fontSize:10,fontWeight:700,color:col.color,textTransform:"uppercase",letterSpacing:".1em"}}>{col.label}</div>
                      <span style={{background:col.color,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>{colTasks.length}</span>
                    </div>
                    {colTasks.length===0&&(
                      <div style={{textAlign:"center",padding:"24px 0",color:"#b8ccb9",fontSize:11}}>No tasks</div>
                    )}
                    {colTasks.map(t=>(
                      <div key={t.id} style={{background:"#fff",border:"1px solid #e8ede8",borderRadius:9,padding:"10px 12px",marginBottom:8,cursor:"pointer",transition:"all .12s",borderLeft:`3px solid ${col.color}`}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 3px 12px rgba(0,0,0,.08)";e.currentTarget.style.transform="translateY(-1px)"}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none"}}>
                        <div style={{fontSize:12,color:"#1a1c18",marginBottom:6,fontWeight:500,lineHeight:1.4}}>{t.text}</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{fontSize:10,color:"#9aae9b"}}>{t.assignee||"Unassigned"}</div>
                          <div style={{display:"flex",gap:4}}>
                            {!t.done&&<button className="btn bsm" style={{padding:"2px 7px",fontSize:10,background:"#eaf4eb",color:"#2e6b35",border:"1px solid #c8ddc9"}}
                              onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:true}:x))}>Done</button>}
                            <button className="btn bd bsm" style={{padding:"2px 7px",fontSize:10}}
                              onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))}>✕</button>
                          </div>
                        </div>
                        {t.due&&<div style={{fontSize:10,color:"#9aae9b",marginTop:4}}>Due {t.due}</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
      )}

      {/* ── DONATIONS TAB ─────────────────────────── */}
      {tab==="DISABLED_donations" && P.canViewDonations && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Fundraising</div><div className="page-sub">Track donations and fundraising campaigns</div></div>
            {P.canEditDonations&&<button className="btn bp bsm" onClick={()=>setShowDonForm(true)}><Ic n="plus" s={12} c="#fff"/> Add Donation</button>}
          </div>
          <div className="g4" style={{marginBottom:16}}>
            {[["Total Raised",`$${donations.reduce((s,d)=>s+(+d.amount||0),0).toLocaleString()}`,"#4a6b50"],
              ["This Month",`$${donations.filter(d=>d.date?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,d)=>s+(+d.amount||0),0).toLocaleString()}`,"#6b8f71"],
              ["Donations",donations.length,"#2563eb"],
              ["Avg Gift",donations.length?`$${(donations.reduce((s,d)=>s+(+d.amount||0),0)/donations.length).toFixed(0)}`:"$0","#7c3aed"]
            ].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table className="tbl">
              <thead><tr><th>Type</th><th>Amount</th><th>Donor</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                {donations.length===0&&<tr><td colSpan={5} className="empty-state">No donations recorded yet.</td></tr>}
                {donations.map(d=>(
                  <tr key={d.id}>
                    <td><span className="bdg bdg-green">{d.type||"General"}</span></td>
                    <td style={{fontWeight:700,color:"#4a6b50"}}>${(+d.amount||0).toLocaleString()}</td>
                    <td>{d.donor||"Anonymous"}</td>
                    <td style={{color:"#9aae9b"}}>{d.date||"—"}</td>
                    <td style={{color:"#9aae9b",fontSize:11}}>{d.notes||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MICROCHIP TAB ─────────────────────────── */}
      {tab==="microchip" && (
        <div style={{maxWidth:600}}>
          <div className="page-title" style={{marginBottom:4}}>Microchip Lookup</div>
          <div className="page-sub" style={{marginBottom:20}}>Search your shelter records by chip number</div>
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:"flex",gap:10}}>
              <input className="inp" style={{flex:1}} placeholder="Enter microchip number…" value={chipQ} onChange={e=>setChipQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setChipResult(animals.filter(a=>a.chip?.includes(chipQ)))}/>
              <button className="btn bp" onClick={()=>setChipResult(animals.filter(a=>a.chip?.includes(chipQ)))}><Ic n="srch" s={14} c="#fff"/> Search</button>
            </div>
          </div>
          {chipResult&&(
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <table className="tbl">
                <thead><tr><th>Name</th><th>Species</th><th>Chip #</th><th>Status</th></tr></thead>
                <tbody>
                  {chipResult.length===0&&<tr><td colSpan={4} style={{textAlign:"center",padding:24,color:"#9aae9b"}}>No animals found with that chip number.</td></tr>}
                  {chipResult.map(a=>(
                    <tr key={a.id}>
                      <td style={{fontWeight:700}}>{a.name}</td>
                      <td>{a.species}</td>
                      <td style={{fontFamily:"monospace",fontSize:11}}>{a.chip}</td>
                      <td><span className={`bdg bdg-${a.status==="Available"?"green":a.status==="Adopted"?"teal":a.status==="Medical"?"red":"gray"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT TAB ─────────────────────────────── */}
      {tab==="chat" && (
        <div style={{display:"flex",gap:14,height:"calc(100vh - 130px)"}}>
          <div style={{width:180,flexShrink:0}}>
            <div className="ct">Channels</div>
            {["General","Medical Team","Foster Network","Volunteers","Transport","State RPL","Lost & Found"].map(ch=>(
              <div key={ch} onClick={()=>setChatCh(ch)} style={{padding:"8px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",fontSize:12,fontWeight:chatCh===ch?700:400,background:chatCh===ch?"#eaf4eb":"transparent",color:chatCh===ch?"#2e4a32":"#5a7a5e",borderLeft:`3px solid ${chatCh===ch?"#6b8f71":"transparent"}`,transition:"all .1s"}}>
                # {ch}
              </div>
            ))}
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",background:"#fff",borderRadius:12,border:"1px solid #e8ede8",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #e8ede8",display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontWeight:700,fontSize:14,color:"#1a1c18"}}># {chatCh}</div>
              <span className="bdg bdg-gray">{shelter.state}</span>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
              {(chatMsgs[chatCh]||[]).length===0&&<div style={{textAlign:"center",color:"#b8ccb9",padding:"32px 0",fontSize:12}}>No messages yet. Start the conversation!</div>}
              {(chatMsgs[chatCh]||[]).map((m,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.mine?"flex-end":"flex-start",gap:3}}>
                  {!m.mine&&<div style={{fontSize:10,color:"#9aae9b",marginLeft:4}}>{m.from}</div>}
                  <div className={`cb ${m.mine?"cm":"co"}`}>{m.text}</div>
                  <div style={{fontSize:10,color:"#b8ccb9"}}>{m.time}</div>
                </div>
              ))}
            </div>
            <div style={{padding:12,borderTop:"1px solid #e8ede8",display:"flex",gap:8}}>
              <input className="inp" style={{flex:1}} placeholder={`Message #${chatCh}…`} value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&chatInput.trim()){const msg={text:chatInput.trim(),mine:true,from:currentUser?.name||shelter.name,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};setChatMsgs(p=>({...p,[chatCh]:[...(p[chatCh]||[]),msg]}));setChatInput("");}}}/>
              <button className="btn bp bsm" onClick={()=>{if(!chatInput.trim())return;const msg={text:chatInput.trim(),mine:true,from:currentUser?.name||shelter.name,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};setChatMsgs(p=>({...p,[chatCh]:[...(p[chatCh]||[]),msg]}));setChatInput("");}}>
                <Ic n="send" s={12} c="#fff"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ─────────────────────────── */}
      {tab==="reports" && P.canViewReports && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Reports & Analytics</div><div className="page-sub">Shelter performance and outcomes</div></div>
            <button className="btn bg bsm" onClick={exportCSV}><Ic n="dl" s={12}/> Export CSV</button>
          </div>
          <div className="g3" style={{marginBottom:16}}>
            {[["Total Animals",ST.total,"#6b8f71"],["Available",ST.available,"#4a6b50"],["Adopted",ST.adopted,"#16a34a"],["Medical",ST.medical,"#c85a35"],["Foster",ST.foster,"#7c3aed"],["Pending",ST.pending,"#2563eb"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{width:ST.total?`${Math.round(v/ST.total*100)}%`:"0%",background:c}}/></div>
              </div>
            ))}
          </div>
          <div className="g2">
            <div className="card">
              <div className="ct">By Species</div>
              {["Dog","Cat","Bird","Rabbit","Reptile","Other"].map(sp=>{
                const n = animals.filter(a=>a.species===sp).length;
                return n>0?(
                  <div key={sp} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f4f0",fontSize:12}}>
                    <span>{sp}</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:80,height:6,background:"#f0f4f0",borderRadius:3}}>
                        <div style={{width:ST.total?`${Math.round(n/ST.total*100)}%`:"0%",height:"100%",background:"#6b8f71",borderRadius:3}}/>
                      </div>
                      <span style={{fontWeight:700,color:"#2e4a32",minWidth:20,textAlign:"right"}}>{n}</span>
                    </div>
                  </div>
                ):null;
              })}
            </div>
            <div className="card">
              <div className="ct">By Status</div>
              {["Available","Pending","Adopted","Foster","Medical","Returned","Stray","Hold"].map(st=>{
                const n = animals.filter(a=>a.status===st).length;
                return n>0?(
                  <div key={st} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f4f0",fontSize:12}}>
                    <span>{st}</span>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:80,height:6,background:"#f0f4f0",borderRadius:3}}>
                        <div style={{width:ST.total?`${Math.round(n/ST.total*100)}%`:"0%",height:"100%",background:"#6b8f71",borderRadius:3}}/>
                      </div>
                      <span style={{fontWeight:700,color:"#2e4a32",minWidth:20,textAlign:"right"}}>{n}</span>
                    </div>
                  </div>
                ):null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NETWORK TAB ─────────────────────────── */}
      {tab==="network" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">RPL Network</div><div className="page-sub">Shelters connected across the country</div></div>
            <button className="btn bg bsm" onClick={()=>setPage("app")}><Ic n="net" s={12}/> View Public Network</button>
          </div>
          <div className="g4" style={{marginBottom:16}}>
            {[["Network Shelters",shelters.length,"#6b8f71"],["Available Animals",shelters.reduce((s,sh)=>s+(sh.available||0),0),"#4a6b50"],["Urgent",shelters.reduce((s,sh)=>s+(sh.urgent||0),0),"#c85a35"],["States Covered",new Set(shelters.map(s=>s.state)).size,"#2563eb"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table className="tbl">
              <thead><tr><th>Shelter</th><th>Location</th><th>Type</th><th>Available</th><th>Urgent</th><th>Status</th></tr></thead>
              <tbody>
                {shelters.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:24,color:"#9aae9b"}}>No shelters in the network yet.</td></tr>}
                {shelters.map((s,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:700}}>{s.name}</td>
                    <td style={{color:"#9aae9b"}}>{s.city}, {s.state}</td>
                    <td><span className="bdg bdg-gray">{s.type}</span></td>
                    <td style={{fontWeight:700,color:"#4a6b50"}}>{s.available||0}</td>
                    <td style={{fontWeight:700,color:"#c85a35"}}>{s.urgent||0}</td>
                    <td><span className={`bdg ${s.verified?"bdg-green":"bdg-gray"}`}>{s.verified?"Verified":"Pending"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ─────────────────────────── */}
      {tab==="settings" && (
        <div style={{maxWidth:580}}>
          <div className="page-title" style={{marginBottom:4}}>Settings</div>
          <div className="page-sub" style={{marginBottom:20}}>Manage your shelter profile and preferences</div>
          <div className="card" style={{marginBottom:14}}>
            <div className="ct">Shelter Profile</div>
            <div className="form-row g2" style={{marginBottom:10}}>
              <div><label className="lbl">Shelter Name</label><input className="inp" defaultValue={shelter.name}/></div>
              <div><label className="lbl">Type</label><input className="inp" defaultValue={shelter.type}/></div>
              <div><label className="lbl">City</label><input className="inp" defaultValue={shelter.city}/></div>
              <div><label className="lbl">State</label><input className="inp" defaultValue={shelter.state}/></div>
              <div style={{gridColumn:"span 2"}}><label className="lbl">Email</label><input className="inp" defaultValue={shelter.email}/></div>
            </div>
            <button className="btn bp bsm">Save Changes</button>
          </div>
          <div className="card" style={{marginBottom:14}}>
            <div className="ct">Subscription</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{sub?.plan==="monthly"?"Monthly Plan":sub?.plan==="annual"?"Annual Plan":"Free Trial"}</div>
                <div style={{fontSize:11,color:"#9aae9b",marginTop:2}}>{sub?.daysLeft>0?`${sub.daysLeft} days remaining`:"Subscription active"}</div>
              </div>
              <button className="btn bp bsm" onClick={()=>setShowSub(true)}>Manage</button>
            </div>
          </div>
          <div className="card">
            <div className="ct">About</div>
            <div style={{fontSize:12,color:"#5a7a5e",lineHeight:1.8}}>
              <div>RescuPawLink Shelter Edition</div>
              <div style={{color:"#9aae9b"}}>Version {VERSION}</div>
              <div style={{color:"#9aae9b",marginTop:8}}>© 2026 RescuPawLink · <a href="mailto:rescupawlink@gmail.com" style={{color:"#6b8f71"}}>rescupawlink@gmail.com</a></div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRACTS TAB ─────────────────────────── */}

      {/* ── INVENTORY TAB ─────────────────────────── */}
      {tab==="inventory" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Inventory</div><div className="page-sub">Supplies, food, and medications</div></div>
            <button className="btn bp bsm" onClick={()=>{const name=prompt("Item name:");if(!name)return;const qty=prompt("Quantity:");const cat=prompt("Category (Food/Medicine/Supplies/Cleaning):")||"Supplies";setInventory(p=>[...p,{id:Date.now(),name,qty:+qty||0,minQty:5,category:cat,unit:"units",expires:"",notes:""}]);}}><Ic n="plus" s={12} c="#fff"/> Add Item</button>
          </div>
          <div className="g4" style={{marginBottom:14}}>
            {[["Total Items",inventory.length,"#6b8f71"],["Low Stock",inventory.filter(i=>i.qty<=i.minQty).length,"#c85a35"],["Expiring Soon",inventory.filter(i=>i.expires&&new Date(i.expires)<new Date(Date.now()+14*864e5)).length,"#c47a1e"],["Categories",new Set(inventory.map(i=>i.category)).size,"#2563eb"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          {inventory.length===0&&(
            <div className="card" style={{textAlign:"center",padding:40,color:"#9aae9b"}}>
              <div style={{fontSize:32,marginBottom:12}}>📦</div>
              <div style={{fontWeight:600,marginBottom:4}}>No inventory items yet</div>
              <div style={{fontSize:11}}>Add food, medicine, and supplies to track your stock levels.</div>
            </div>
          )}
          {inventory.length>0&&(
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <table className="tbl">
                <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Stock Level</th><th>Unit</th><th>Expires</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {inventory.map(item=>{
                    const pct = Math.min(100, Math.round((item.qty/(item.minQty*4||20))*100));
                    const low = item.qty <= item.minQty;
                    const expiring = item.expires && new Date(item.expires) < new Date(Date.now()+14*864e5);
                    return (
                      <tr key={item.id}>
                        <td style={{fontWeight:700}}>{item.name}</td>
                        <td><span className={`bdg bdg-${item.category==="Medicine"?"purple":item.category==="Food"?"green":item.category==="Cleaning"?"blue":"gray"}`}>{item.category}</span></td>
                        <td style={{fontWeight:700,color:low?"#c85a35":"#1a1c18"}}>{item.qty}</td>
                        <td><div style={{height:8,background:"#f0f4f0",borderRadius:4,overflow:"hidden",minWidth:80}}><div style={{height:"100%",borderRadius:4,background:low?"#c85a35":pct>60?"#6b8f71":"#c47a1e",width:`${pct}%`}}/></div></td>
                        <td style={{color:"#9aae9b"}}>{item.unit}</td>
                        <td style={{color:expiring?"#c85a35":"#9aae9b"}}>{item.expires||"—"}</td>
                        <td>{low?<span className="bdg bdg-red">Low Stock</span>:expiring?<span className="bdg bdg-orange">Expiring</span>:<span className="bdg bdg-green">In Stock</span>}</td>
                        <td style={{display:"flex",gap:4}}>
                          <button className="btn bg bsm" onClick={()=>{const qty=prompt(`Update quantity for ${item.name}:`,item.qty);if(qty!==null)setInventory(p=>p.map(x=>x.id===item.id?{...x,qty:+qty||0}:x));}}>Edit</button>
                          <button className="btn bd bsm" onClick={()=>setInventory(p=>p.filter(x=>x.id!==item.id))}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        
      )}

tab==="contracts" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Contracts & Agreements</div><div className="page-sub">Adoption, foster, and volunteer contracts</div></div>
            {P.canManageAdoptions&&<button className="btn bp bsm" onClick={()=>setShowContractForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> New Contract</button>}
          </div>
          {showContractForm&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="ct">New Contract</div>
              <div className="form-row g2" style={{marginBottom:10}}>
                <div><label className="lbl">Type</label><select className="sel" value={contractF.type} onChange={e=>setContractF(p=>({...p,type:e.target.value}))}>{["Adoption","Foster","Volunteer","Surrender","Return"].map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="lbl">Pet Name</label><input className="inp" placeholder="Animal name" value={contractF.petName} onChange={e=>setContractF(p=>({...p,petName:e.target.value}))}/></div>
                <div><label className="lbl">Person Name</label><input className="inp" placeholder="Full name" value={contractF.adopterName} onChange={e=>setContractF(p=>({...p,adopterName:e.target.value}))}/></div>
                <div><label className="lbl">Email</label><input className="inp" type="email" value={contractF.adopterEmail} onChange={e=>setContractF(p=>({...p,adopterEmail:e.target.value}))}/></div>
                <div><label className="lbl">Phone</label><input className="inp" value={contractF.adopterPhone} onChange={e=>setContractF(p=>({...p,adopterPhone:e.target.value}))}/></div>
                <div><label className="lbl">Date</label><input className="inp" type="date" value={contractF.date} onChange={e=>setContractF(p=>({...p,date:e.target.value}))}/></div>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Notes</label><textarea className="inp" rows={2} value={contractF.notes} onChange={e=>setContractF(p=>({...p,notes:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={contractF.signed} onChange={e=>setContractF(p=>({...p,signed:e.target.checked}))}/> Mark as signed</label>
                <button className="btn bp bsm" onClick={()=>{if(!contractF.petName||!contractF.adopterName)return;setContracts(p=>[...p,{...contractF,id:Date.now(),createdAt:new Date().toLocaleDateString()}]);setContractF({type:"Adoption",petName:"",adopterName:"",adopterEmail:"",adopterPhone:"",date:"",notes:"",signed:false});setShowContractForm(false);log(`Contract: ${contractF.type} — ${contractF.petName}`);}}>Save</button>
                <button className="btn bg bsm" onClick={()=>setShowContractForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table className="tbl">
              <thead><tr><th>Type</th><th>Pet</th><th>Person</th><th>Email</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {contracts.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:24,color:"#9aae9b"}}>No contracts yet.</td></tr>}
                {contracts.map(c=>(
                  <tr key={c.id}>
                    <td><span className="bdg bdg-green">{c.type}</span></td>
                    <td style={{fontWeight:700}}>{c.petName}</td>
                    <td>{c.adopterName}</td>
                    <td style={{color:"#9aae9b",fontSize:11}}>{c.adopterEmail}</td>
                    <td style={{color:"#9aae9b"}}>{c.date||c.createdAt}</td>
                    <td><span className={`bdg ${c.signed?"bdg-green":"bdg-orange"}`}>{c.signed?"✓ Signed":"Pending"}</span></td>
                    <td style={{display:"flex",gap:4}}><button className="btn bg bsm" onClick={()=>setContracts(p=>p.map(x=>x.id===c.id?{...x,signed:!x.signed}:x))}>{c.signed?"Unsign":"Sign"}</button><button className="btn bd bsm" onClick={()=>setContracts(p=>p.filter(x=>x.id!==c.id))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRANSPORT TAB ─────────────────────────── */}
      {tab==="transport" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Transport Coordination</div><div className="page-sub">Plan and track animal relocations</div></div>
            <button className="btn bp bsm" onClick={()=>setShowTransportForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> New Transport</button>
          </div>
          {showTransportForm&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="ct">New Transport Mission</div>
              <div className="form-row g2" style={{marginBottom:10}}>
                <div><label className="lbl">Pet(s)</label><input className="inp" placeholder="e.g. Luna, Buddy" value={transportF.petName} onChange={e=>setTransportF(p=>({...p,petName:e.target.value}))}/></div>
                <div><label className="lbl">Driver</label><input className="inp" placeholder="Driver name" value={transportF.driver} onChange={e=>setTransportF(p=>({...p,driver:e.target.value}))}/></div>
                <div><label className="lbl">From</label><input className="inp" placeholder="Pickup location" value={transportF.fromAddr} onChange={e=>setTransportF(p=>({...p,fromAddr:e.target.value}))}/></div>
                <div><label className="lbl">To</label><input className="inp" placeholder="Drop-off location" value={transportF.toAddr} onChange={e=>setTransportF(p=>({...p,toAddr:e.target.value}))}/></div>
                <div><label className="lbl">Date</label><input className="inp" type="date" value={transportF.date} onChange={e=>setTransportF(p=>({...p,date:e.target.value}))}/></div>
                <div><label className="lbl">Status</label><select className="sel" value={transportF.status} onChange={e=>setTransportF(p=>({...p,status:e.target.value}))}>{["Scheduled","In Transit","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="lbl">Miles</label><input className="inp" type="number" value={transportF.distance} onChange={e=>setTransportF(p=>({...p,distance:e.target.value}))}/></div>
                <div><label className="lbl">Cost ($)</label><input className="inp" type="number" value={transportF.cost} onChange={e=>setTransportF(p=>({...p,cost:e.target.value}))}/></div>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Notes</label><textarea className="inp" rows={2} value={transportF.notes} onChange={e=>setTransportF(p=>({...p,notes:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn bp bsm" onClick={()=>{if(!transportF.petName)return;setTransports(p=>[...p,{...transportF,id:Date.now()}]);setTransportF({petName:"",fromAddr:"",toAddr:"",driver:"",date:"",distance:"",cost:"",notes:"",status:"Scheduled"});setShowTransportForm(false);log(`Transport: ${transportF.petName}`);}}>Save</button>
                <button className="btn bg bsm" onClick={()=>setShowTransportForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="g4" style={{marginBottom:14}}>
            {[["Missions",transports.length,"#6b8f71"],["Scheduled",transports.filter(t=>t.status==="Scheduled").length,"#2563eb"],["In Transit",transports.filter(t=>t.status==="In Transit").length,"#c47a1e"],["Miles",transports.reduce((s,t)=>s+(+t.distance||0),0),"#4a6b50"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table className="tbl">
              <thead><tr><th>Pet(s)</th><th>From</th><th>To</th><th>Driver</th><th>Date</th><th>Miles</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {transports.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:24,color:"#9aae9b"}}>No transports yet.</td></tr>}
                {transports.map(t=>(
                  <tr key={t.id}>
                    <td style={{fontWeight:700}}>{t.petName}</td>
                    <td style={{fontSize:11,color:"#9aae9b"}}>{t.fromAddr}</td>
                    <td style={{fontSize:11,color:"#9aae9b"}}>{t.toAddr}</td>
                    <td>{t.driver}</td>
                    <td style={{color:"#9aae9b"}}>{t.date}</td>
                    <td>{t.distance?`${t.distance} mi`:"—"}</td>
                    <td><span className={`bdg ${t.status==="Completed"?"bdg-green":t.status==="In Transit"?"bdg-orange":t.status==="Cancelled"?"bdg-red":"bdg-blue"}`}>{t.status}</span></td>
                    <td><button className="btn bd bsm" onClick={()=>setTransports(p=>p.filter(x=>x.id!==t.id))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ─────────────────────────── */}
      {tab==="events" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Events</div><div className="page-sub">Adoption events, fundraisers, and community outreach</div></div>
            <button className="btn bp bsm" onClick={()=>setShowEventForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> New Event</button>
          </div>
          {showEventForm&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="ct">New Event</div>
              <div className="form-row g2" style={{marginBottom:10}}>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Title</label><input className="inp" placeholder="Event title" value={eventF.title} onChange={e=>setEventF(p=>({...p,title:e.target.value}))}/></div>
                <div><label className="lbl">Type</label><select className="sel" value={eventF.type} onChange={e=>setEventF(p=>({...p,type:e.target.value}))}>{["Adoption Event","Fundraiser","Volunteer Day","Community Outreach","Training","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="lbl">Status</label><select className="sel" value={eventF.status} onChange={e=>setEventF(p=>({...p,status:e.target.value}))}>{["Upcoming","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="lbl">Date</label><input className="inp" type="date" value={eventF.date} onChange={e=>setEventF(p=>({...p,date:e.target.value}))}/></div>
                <div><label className="lbl">Time</label><input className="inp" type="time" value={eventF.time} onChange={e=>setEventF(p=>({...p,time:e.target.value}))}/></div>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Location</label><input className="inp" placeholder="Venue or address" value={eventF.location} onChange={e=>setEventF(p=>({...p,location:e.target.value}))}/></div>
                <div><label className="lbl">Capacity</label><input className="inp" type="number" value={eventF.capacity} onChange={e=>setEventF(p=>({...p,capacity:e.target.value}))}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:22}}><label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={eventF.public} onChange={e=>setEventF(p=>({...p,public:e.target.checked}))}/> Public event</label></div>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Description</label><textarea className="inp" rows={2} value={eventF.description} onChange={e=>setEventF(p=>({...p,description:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn bp bsm" onClick={()=>{if(!eventF.title)return;setEventsData(p=>[...p,{...eventF,id:Date.now(),createdAt:new Date().toLocaleDateString()}]);setEventF({title:"",type:"Adoption Event",date:"",time:"",location:"",description:"",capacity:"",public:true,status:"Upcoming"});setShowEventForm(false);log(`Event: ${eventF.title}`);}}>Save Event</button>
                <button className="btn bg bsm" onClick={()=>setShowEventForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="g4" style={{marginBottom:14}}>
            {[["Total",eventsData.length,"#6b8f71"],["Upcoming",eventsData.filter(e=>e.status==="Upcoming").length,"#2563eb"],["Completed",eventsData.filter(e=>e.status==="Completed").length,"#4a6b50"],["Public",eventsData.filter(e=>e.public).length,"#7c3aed"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {eventsData.length===0&&<div className="card" style={{gridColumn:"span 3",textAlign:"center",color:"#9aae9b",padding:32}}>No events yet. Create your first above.</div>}
            {eventsData.map(ev=>(
              <div key={ev.id} className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{ev.title}</div><div style={{fontSize:11,color:"#9aae9b"}}>{ev.type}</div></div>
                  <span className={`bdg ${ev.status==="Completed"?"bdg-green":ev.status==="Cancelled"?"bdg-red":ev.status==="In Progress"?"bdg-orange":"bdg-blue"}`}>{ev.status}</span>
                </div>
                <div style={{fontSize:12,color:"#5a7a5e",lineHeight:1.7}}>
                  {ev.date&&<div>📅 {ev.date}{ev.time&&` · ${ev.time}`}</div>}
                  {ev.location&&<div>📍 {ev.location}</div>}
                  {ev.capacity&&<div>👥 Capacity: {ev.capacity}</div>}
                  {ev.public&&<div style={{color:"#6b8f71",fontWeight:600,fontSize:11}}>🌐 Public</div>}
                </div>
                <button className="btn bd bsm" style={{marginTop:10,fontSize:10}} onClick={()=>setEventsData(p=>p.filter(x=>x.id!==ev.id))}>Remove</button>
              </div>
            ))}
          </div>
        </div>

      )}

      {/* ── DONORS TAB ─────────────────────────── */}
      {tab==="DISABLED_donors" && P.canViewDonations && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div className="page-title">Donor Management</div><div className="page-sub">Track and manage your donor relationships</div></div>
            {P.canEditDonations&&<button className="btn bp bsm" onClick={()=>setShowDonorForm(p=>!p)}><Ic n="plus" s={12} c="#fff"/> Add Donor</button>}
          </div>
          {showDonorForm&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="ct">Add Donor</div>
              <div className="form-row g2" style={{marginBottom:10}}>
                <div><label className="lbl">Full Name</label><input className="inp" placeholder="Donor name" value={donorF.name} onChange={e=>setDonorF(p=>({...p,name:e.target.value}))}/></div>
                <div><label className="lbl">Email</label><input className="inp" type="email" value={donorF.email} onChange={e=>setDonorF(p=>({...p,email:e.target.value}))}/></div>
                <div><label className="lbl">Phone</label><input className="inp" value={donorF.phone} onChange={e=>setDonorF(p=>({...p,phone:e.target.value}))}/></div>
                <div><label className="lbl">Total Given ($)</label><input className="inp" type="number" value={donorF.totalGiven} onChange={e=>setDonorF(p=>({...p,totalGiven:e.target.value}))}/></div>
                <div><label className="lbl">Last Gift</label><input className="inp" type="date" value={donorF.lastGift} onChange={e=>setDonorF(p=>({...p,lastGift:e.target.value}))}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:22}}><label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={donorF.recurring} onChange={e=>setDonorF(p=>({...p,recurring:e.target.checked}))}/> Recurring donor</label></div>
                <div style={{gridColumn:"span 2"}}><label className="lbl">Notes</label><textarea className="inp" rows={2} value={donorF.notes} onChange={e=>setDonorF(p=>({...p,notes:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn bp bsm" onClick={()=>{if(!donorF.name)return;setDonors(p=>[...p,{...donorF,id:Date.now()}]);setDonorF({name:"",email:"",phone:"",totalGiven:"",lastGift:"",notes:"",recurring:false});setShowDonorForm(false);log(`Donor: ${donorF.name}`);}}>Save Donor</button>
                <button className="btn bg bsm" onClick={()=>setShowDonorForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="g4" style={{marginBottom:14}}>
            {[["Donors",donors.length,"#6b8f71"],["Recurring",donors.filter(d=>d.recurring).length,"#7c3aed"],["Total Raised",`$${donors.reduce((s,d)=>s+(+d.totalGiven||0),0).toLocaleString()}`,"#4a6b50"],["Avg Gift",donors.length?`$${(donors.reduce((s,d)=>s+(+d.totalGiven||0),0)/donors.length).toFixed(0)}`:"$0","#c47a1e"]].map(([l,v,c])=>(
              <div key={l} className="stat"><div className="stat-val" style={{color:c}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Total Given</th><th>Last Gift</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {donors.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:24,color:"#9aae9b"}}>No donors yet.</td></tr>}
                {donors.map(d=>(
                  <tr key={d.id}>
                    <td style={{fontWeight:700}}>{d.name}</td>
                    <td style={{fontSize:11,color:"#9aae9b"}}>{d.email}</td>
                    <td style={{fontSize:11}}>{d.phone}</td>
                    <td style={{fontWeight:700,color:"#4a6b50"}}>{d.totalGiven?`$${(+d.totalGiven).toLocaleString()}`:"—"}</td>
                    <td style={{color:"#9aae9b"}}>{d.lastGift||"—"}</td>
                    <td><span className={`bdg ${d.recurring?"bdg-purple":"bdg-gray"}`}>{d.recurring?"Recurring":"One-time"}</span></td>
                    <td><button className="btn bd bsm" onClick={()=>setDonors(p=>p.filter(x=>x.id!==d.id))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAnimal&&<AnimalModal animal={editAnimal} onSave={saveAnimal} onClose={()=>{setShowAnimal(false);setEditAnimal(null);}} shelter={shelter} allAnimals={animals}/>}
      {showSub&&<SubModal shelter={shelter} subscription={sub} onClose={()=>setShowSub(false)}/>}
      {showRoleSwitch&&(
        <div className="mb" onClick={()=>setShowRoleSwitch(false)}>
          <div className="md mdsm" onClick={e=>e.stopPropagation()}>
            <div className="md-header"><div className="md-title">Switch User</div><button className="btn bg bsm" onClick={()=>setShowRoleSwitch(false)}>✕</button></div>
            <div className="md-body">
              <p style={{fontSize:12,color:"#5a7a5e",marginBottom:14}}>Select a staff member to switch to:</p>
              {STAFF_ROLES.map(r=>(
                <div key={r.role} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f0f4f0",cursor:"pointer"}}
                  onClick={()=>{setCurrentUser({name:r.name,role:r.role,pin:r.pin});setShowRoleSwitch(false);showToast(`Switched to ${r.name}`);}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{r.name}</div>
                    <div style={{fontSize:11,color:"#9aae9b"}}>{r.role}</div>
                  </div>
                  <span className="bdg bdg-gray">{r.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {updateAvailable&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:999,background:"#1a1c18",color:"#fff",padding:"14px 18px",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,.25)",fontSize:12,border:"1px solid rgba(107,143,113,.3)",maxWidth:320}}>
          <div style={{fontWeight:700,marginBottom:6}}>🎉 Update Available — v{updateAvailable.version}</div>
          <div style={{color:"rgba(255,255,255,.6)",marginBottom:12,fontSize:11}}>A new version of RescuPawLink is ready to download.</div>
          <div style={{display:"flex",gap:8}}>
            <a href={updateAvailable.url} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"#6b8f71",color:"#fff",textDecoration:"none",padding:"8px 12px",borderRadius:8,fontWeight:700,fontSize:11,textAlign:"center"}}>Download Update</a>
            <button onClick={()=>setUpdateAvailable(null)} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Later</button>
          </div>
        </div>
      )}
      {updateAvailable&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:999,background:"#1a1c18",color:"#fff",padding:"14px 18px",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,.25)",fontSize:12,border:"1px solid rgba(107,143,113,.3)",maxWidth:320}}>
          <div style={{fontWeight:700,marginBottom:6}}>🎉 Update Available</div>
          <div style={{color:"rgba(255,255,255,.6)",marginBottom:12,fontSize:11}}>A new version of RescuPawLink is ready.</div>
          <div style={{display:"flex",gap:8}}>
            <a href={updateAvailable.url} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"#6b8f71",color:"#fff",textDecoration:"none",padding:"8px 12px",borderRadius:8,fontWeight:700,fontSize:11,textAlign:"center"}}>Download Update</a>
            <button onClick={()=>setUpdateAvailable(null)} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Later</button>
          </div>
        </div>

      )}
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
  );
}
