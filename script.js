const cfg = window.APP_CONFIG || {};
const hasConfig = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR_PROJECT_REF")
  && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
const sb = hasConfig && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;

const state = JSON.parse(localStorage.getItem("birthdaySurpriseDraft") || "null") || {
  name:"", yourName:"", age:"", day:"", month:"", cake:"Midnight Chocolate",
  reasons:["","","","",""], photos:[], letter:""
};
let step=1, previewIndex=0, soundOn=true, isShared=false, sharedData=null;
const $=s=>document.querySelector(s);
const saveDraft=()=>localStorage.setItem("birthdaySurpriseDraft",JSON.stringify(state));
const toast=(m)=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const randomToken=()=>{const a=new Uint8Array(24);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")};
const functionUrl=name=>`${cfg.SUPABASE_URL}/functions/v1/${name}`;

function progress(){ $("#progress").innerHTML=[1,2,3,4,5].map(i=>`<span class="dot ${i<=step?"active":""}">${i<=step?"🎈":"⚪"}</span>`).join("") }
function stepLabel(){ $("#stepLabel").textContent=["🎈  Step 1 of 5 · The Star","🍰  Step 2 of 5 · The Cake","🎈  Step 3 of 5 · The Balloons","📸  Step 4 of 5 · The Memories","💌  Step 5 of 5 · The Letter"][step-1] }
function nav(back=true){return `<div class="nav ${back?"":"single"}">${back?'<button class="back" id="backBtn">←</button>':''}<button class="primary" id="nextBtn">${step===5?"Preview the surprise ✨":"Continue"}</button></div>`}

function render(){
  progress();stepLabel();const c=$("#stepContent");
  if(step===1)c.innerHTML=`
    <div class="hero-icon">🌟</div><h1>Who’s the birthday star?</h1>
    <p class="lead">You’re about to make someone’s day unforgettable 🎀</p>
    <div class="field"><label>Their name</label><input id="name" placeholder="e.g. Ananya" value="${esc(state.name)}"></div>
    <div class="field"><label>Your name</label><input id="yourName" placeholder="e.g. Rahul" value="${esc(state.yourName)}"></div>
    <div class="field"><label>Turning age <span style="color:#a99d97">(optional)</span></label><input id="age" type="number" min="1" max="120" placeholder="e.g. 19" value="${esc(state.age)}"></div>
    <div class="field"><label>Their birthday <span style="color:#a99d97">(optional)</span></label><div class="row">
      <select id="day"><option value="">Day —</option>${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${state.day==i+1?"selected":""}>${i+1}</option>`).join("")}</select>
      <select id="month"><option value="">Month —</option>${["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i)=>`<option value="${i+1}" ${state.month==i+1?"selected":""}>${m}</option>`).join("")}</select></div></div>
    <div class="save-note">☁️ Your draft is saved locally until you create the shareable surprise.</div>${nav(false)}`;
  if(step===2)c.innerHTML=`
    <div class="hero-icon">🎂</div><h1>Pick their cake</h1><p class="lead">${esc(state.name||"They")} will light it, wish on it, and cut it.</p>
    <div class="cake-list">${[["🍫","Midnight Chocolate","Rich, dark & dreamy"],["🍓","Strawberry Blush","Soft, sweet & rosy"],["🍦","Vanilla Gold","Classic, warm & glowing"]].map(x=>`<button class="cake ${state.cake===x[1]?"selected":""}" data-cake="${x[1]}"><span class="cake-emoji">${x[0]}</span><span><strong>${x[1]}</strong><small>${x[2]}</small></span></button>`).join("")}</div>${nav()}`;
  if(step===3)c.innerHTML=`
    <div class="hero-icon">🎈</div><h1>Fill the balloons</h1><p class="lead">Each balloon hides one reason they’re loved. They’ll pop them one by one.</p>
    <div class="balloon-fields">${state.reasons.map((r,i)=>`<div class="balloon-field"><span class="balloon">🎈</span><input maxlength="50" data-reason="${i}" placeholder="${["e.g. Your laugh is my...","e.g. You make bad days...","e.g. Nobody listens...","e.g. You inspire me...","e.g. Life with you is..."][i]}" value="${esc(r)}"><span class="count" id="count${i}">${r.length}/50</span></div>`).join("")}</div>
    <div class="sparks"><h3>NEED A SPARK? TAP TO USE</h3><div class="spark-grid">${["Your laugh is my favourite sound","You make ordinary days feel special","You believed in me when I didn’t","The world is kinder with you in it"].map(x=>`<button class="spark" data-spark="${x}">＋ ${x}</button>`).join("")}</div></div>${nav()}`;
  if(step===4)c.innerHTML=`
    <div class="hero-icon">📸</div><h1>Hang up some memories</h1><p class="lead">Up to 5 photos of ${esc(state.name||"them")}, strung on fairy lights.</p>
    <div class="upload"><div style="font-size:45px">🖼️</div><button id="uploadBtn">Add another (${state.photos.length}/5)</button><div style="color:#9a8d87;margin-top:7px">JPG or PNG · under 5MB each</div></div>
    <div class="photo-grid">${state.photos.map((p,i)=>`<div class="photo-card"><div style="position:relative"><img src="${p.data}"><button class="remove" data-remove="${i}">×</button></div><div class="photo-bottom"><input maxlength="60" data-caption="${i}" placeholder="Caption..." value="${esc(p.caption||"")}"></div></div>`).join("")}</div>
    <div style="text-align:center;margin:18px"><button class="secondary" id="skipPhotos">Skip photos for now</button></div>${nav()}`;
  if(step===5)c.innerHTML=`
    <div class="hero-icon">💌</div><h1>Write your birthday letter</h1><p class="lead">This is the part ${esc(state.name||"they")} will read twice — and remember forever.</p>
    <div class="field"><textarea id="letter" class="letter" maxlength="500" placeholder="My wish for your new year is...">${esc(state.letter)}</textarea><div style="text-align:right;color:#9d918a;margin-top:6px"><span id="letterCount">${state.letter.length}</span>/500</div></div>
    <div class="sparks"><h3>NEED A SPARK? TAP TO USE</h3><div class="spark-grid"><button class="spark" id="sparkLetter">＋ My wish for your new year is...</button><button class="spark" id="sparkLetter2">＋ Another year of you is my favourite gift...</button></div></div>${nav()}`;
  bind();
}

function bind(){
  $("#backBtn")?.addEventListener("click",()=>{step--;render()});
  $("#nextBtn")?.addEventListener("click",next);
  $("#name")?.addEventListener("input",e=>{state.name=e.target.value;saveDraft()});
  $("#yourName")?.addEventListener("input",e=>{state.yourName=e.target.value;saveDraft()});
  $("#age")?.addEventListener("input",e=>{state.age=e.target.value;saveDraft()});
  $("#day")?.addEventListener("change",e=>{state.day=e.target.value;saveDraft()});
  $("#month")?.addEventListener("change",e=>{state.month=e.target.value;saveDraft()});
  document.querySelectorAll("[data-cake]").forEach(b=>b.onclick=()=>{state.cake=b.dataset.cake;saveDraft();render()});
  document.querySelectorAll("[data-reason]").forEach(inp=>inp.oninput=e=>{state.reasons[+e.target.dataset.reason]=e.target.value;$("#count"+e.target.dataset.reason).textContent=e.target.value.length+"/50";saveDraft()});
  document.querySelectorAll("[data-spark]").forEach(b=>b.onclick=()=>{let i=state.reasons.findIndex(x=>!x);if(i<0)i=4;state.reasons[i]=b.dataset.spark;saveDraft();render()});
  $("#uploadBtn")?.addEventListener("click",()=>$("#photoInput").click());
  $("#skipPhotos")?.addEventListener("click",()=>{step=5;render()});
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.photos.splice(+b.dataset.remove,1);saveDraft();render()});
  document.querySelectorAll("[data-caption]").forEach(i=>i.oninput=e=>{state.photos[+e.target.dataset.caption].caption=e.target.value;saveDraft()});
  $("#letter")?.addEventListener("input",e=>{state.letter=e.target.value;$("#letterCount").textContent=e.target.value.length;saveDraft()});
  $("#sparkLetter")?.addEventListener("click",()=>{state.letter="My wish for your new year is...";saveDraft();render()});
  $("#sparkLetter2")?.addEventListener("click",()=>{state.letter="Another year of you is my favourite gift...";saveDraft();render()});
}

$("#photoInput").addEventListener("change",e=>{
  [...e.target.files].forEach(file=>{
    if(state.photos.length>=5)return toast("You can add up to 5 photos.");
    if(!["image/jpeg","image/png"].includes(file.type))return toast("Please choose JPG or PNG.");
    if(file.size>5*1024*1024)return toast("Photo too large. Please choose one under 5MB.");
    const reader=new FileReader();
    reader.onload=ev=>{state.photos.push({data:ev.target.result,caption:""});saveDraft();render()};
    reader.readAsDataURL(file);
  });e.target.value="";
});

async function next(){
  if(step===1&&!state.name.trim())return toast("Please enter their name.");
  if(step===3&&!state.reasons.some(Boolean))return toast("Add at least one reason first 💛");
  if(step===5){saveDraft();openPreview();return}
  step++;render();window.scrollTo({top:0,behavior:"smooth"});
}

async function openPreview(){
  if(!hasConfig){toast("Preview works, but Supabase is not configured yet.");$("#setupView").classList.add("hidden");$("#previewView").classList.remove("hidden");previewIndex=0;renderPreview();return}
  $("#setupView").classList.add("hidden");$("#previewView").classList.remove("hidden");previewIndex=0;renderPreview();
}

function renderPreview(){
  const c=$("#previewContent");
  if(isShared){renderShared(c);return}
  if(previewIndex===0)c.innerHTML=`<section class="preview-screen"><h2>A walk down memory lane</h2><p>Swipe through 📸</p><div class="memory-line"></div><div class="polaroids">${(state.photos.length?state.photos:[{data:"",caption:"💛"}]).map(p=>p.data?`<figure class="polaroid"><img src="${p.data}"><figcaption>${esc(p.caption||"💛")}</figcaption></figure>`:`<figure class="polaroid" style="display:grid;place-items:center;height:390px"><div style="font-size:100px">💛</div><figcaption>A memory waiting to be made</figcaption></figure>`).join("")}</div><button class="primary keep" id="keep">Keep going ✨</button></section>`;
  if(previewIndex===1)c.innerHTML=`<section class="preview-screen"><h2>For all the little things 🎈</h2><p>Pop each balloon to reveal a reason.</p><div class="balloon-show">${state.reasons.map((r,i)=>`<button class="big-balloon" data-pop="${i}">🎈</button>`).join("")}</div><div id="reasonReveal"></div><button class="primary keep" id="keep">Keep going ✨</button></section>`;
  if(previewIndex===2)c.innerHTML=`<section class="preview-screen"><div class="letter-card"><h3>Dear ${esc(state.name||"you")},</h3><div class="letter-text">${esc(state.letter||"My wish for your new year is... Another year of you is my favourite gift...")}</div><div class="signature">With all my love,<br>— ${esc(state.yourName||"Someone who cares")}</div></div><button class="primary keep" id="keep">Continue</button></section>`;
  if(previewIndex===3)c.innerHTML=`<section class="preview-screen final"><div class="celebrate">🎂</div><h1>HAPPY<br>BIRTHDAY</h1><div class="name">${esc(state.name||"You")}!</div><p class="from">Made with love, just for you — <strong>${esc(state.yourName||"Someone special")} 💛</strong></p><button class="primary" id="saveSurprise">☁️ Create shareable link</button><p>Save it online, then send the private link to the birthday person.</p></section>`;
  if(previewIndex<3)$("#keep")?.addEventListener("click",()=>{previewIndex++;renderPreview();if(previewIndex===3)confetti()});
  document.querySelectorAll("[data-pop]").forEach(b=>b.onclick=()=>{b.classList.add("popped");b.disabled=true;const i=+b.dataset.pop;$("#reasonReveal").innerHTML=`<div class="reason-card"><small>REASON NO. ${i+1}</small><strong>${esc(state.reasons[i]||"You make life brighter ✨")}</strong></div>`});
  $("#saveSurprise")?.addEventListener("click",createOnlineSurprise);
}

function renderShared(c){
  c.innerHTML=`<section class="preview-screen loading"><div><div class="spinner"></div><h2>Opening your surprise…</h2><p>Just a moment ✨</p></div></section>`;
  loadShared();
}

async function createOnlineSurprise(){
  if(!sb)return toast("Supabase is not configured. Fill supabase-config.js first.");
  const btn=$("#saveSurprise");btn.disabled=true;btn.textContent="Saving your surprise…";
  try{
    const shareToken=randomToken();
    const uploaded=[];
    for(let i=0;i<state.photos.length;i++){
      const p=state.photos[i];
      const blob=await (await fetch(p.data)).blob();
      const ext=blob.type==="image/png"?"png":"jpg";
      const path=`${shareToken}/${crypto.randomUUID()}.${ext}`;
      const form = new FormData();
      form.append("file", blob, path.split("/").pop());
      const uploadUrl = `${cfg.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(cfg.STORAGE_BUCKET)}/${path.split("/").map(encodeURIComponent).join("/")}`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "apikey": cfg.SUPABASE_PUBLISHABLE_KEY },
        body: form
      });
      if(!uploadRes.ok){
        let uploadError = {};
        try { uploadError = await uploadRes.json(); } catch {}
        throw new Error(`Photo upload failed: ${uploadError.message || uploadError.error || uploadRes.statusText}`);
      }
      uploaded.push({path,caption:p.caption||""});
    }

    const payload={
      share_token:shareToken,
      birthday_person:state.name.trim(),
      creator_name:state.yourName.trim()||null,
      age:state.age?Number(state.age):null,
      birthday:(state.day&&state.month)?`${new Date().getFullYear()}-${String(state.month).padStart(2,"0")}-${String(state.day).padStart(2,"0")}`:null,
      cake:state.cake,
      reasons:state.reasons.filter(Boolean),
      photos:uploaded,
      letter:state.letter.trim()
    };

    const res=await fetch(functionUrl(cfg.CREATE_FUNCTION),{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":cfg.SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify(payload)
    });
    const out=await res.json();
    if(!res.ok)throw new Error(out.error||"The server couldn't save your surprise.");

    const url=`${location.origin}/s/${shareToken}`;
    c.innerHTML=`<section class="preview-screen"><div class="celebrate">🎁</div><h2>Your surprise is ready!</h2><p>Anyone with this link can open the birthday experience.</p><input id="shareUrl" value="${esc(url)}" readonly><button class="primary" id="copyLink">Copy shareable link 🔗</button><button class="secondary" id="openLink">Open surprise</button></section>`;
    $("#copyLink").onclick=async()=>{await navigator.clipboard.writeText(url);toast("Link copied! 🎉")};
    $("#openLink").onclick=()=>location.href=url;
    localStorage.removeItem("birthdaySurpriseDraft");
  }catch(e){
    console.error(e);toast(e.message||"Couldn't save the surprise.");btn.disabled=false;btn.textContent="☁️ Create shareable link";
  }
}

async function loadShared(){
  const token=location.pathname.startsWith("/s/")?location.pathname.split("/s/")[1]:null;
  if(!token)return;
  if(!hasConfig){$("#previewContent").innerHTML=`<section class="preview-screen"><div class="error-box"><h2>Supabase isn't configured</h2><p>Add your project URL and publishable key to <code>supabase-config.js</code>.</p></div></section>`;return}
  try{
    const res=await fetch(functionUrl(cfg.GET_FUNCTION),{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":cfg.SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify({share_token:token})
    });
    const out=await res.json();
    if(!res.ok)throw new Error(out.error||"Surprise not found.");
    sharedData=out.surprise;isShared=true;renderSharedStages();
  }catch(e){
    $("#previewContent").innerHTML=`<section class="preview-screen"><div class="error-box"><h2>Oops 💔</h2><p>${esc(e.message)}</p></div></section>`;
  }
}

function renderSharedStages(){
  const d=sharedData;const photos=d.photos||[];const reasons=d.reasons||[];
  if(previewIndex===0)$("#previewContent").innerHTML=`<section class="preview-screen"><h2>A walk down memory lane</h2><p>Swipe through 📸</p><div class="memory-line"></div><div class="polaroids">${photos.length?photos.map(p=>`<figure class="polaroid"><img src="${p.url}" alt=""><figcaption>${esc(p.caption||"💛")}</figcaption></figure>`).join(""):`<figure class="polaroid" style="display:grid;place-items:center;height:390px"><div style="font-size:100px">💛</div><figcaption>A memory waiting to be made</figcaption></figure>`}</div><button class="primary keep" id="sharedKeep">Keep going ✨</button></section>`;
  if(previewIndex===1)$("#previewContent").innerHTML=`<section class="preview-screen"><h2>For all the little things 🎈</h2><p>Pop each balloon to reveal a reason.</p><div class="balloon-show">${reasons.map((r,i)=>`<button class="big-balloon" data-shared-pop="${i}">🎈</button>`).join("")}</div><div id="reasonReveal"></div><button class="primary keep" id="sharedKeep">Keep going ✨</button></section>`;
  if(previewIndex===2)$("#previewContent").innerHTML=`<section class="preview-screen"><div class="letter-card"><h3>Dear ${esc(d.birthday_person)},</h3><div class="letter-text">${esc(d.letter||"You deserve the happiest birthday.")}</div><div class="signature">With all my love,<br>— ${esc(d.creator_name||"Someone special")}</div></div><button class="primary keep" id="sharedKeep">Continue</button></section>`;
  if(previewIndex===3)$("#previewContent").innerHTML=`<section class="preview-screen final"><div class="celebrate">🎂</div><h1>HAPPY<br>BIRTHDAY</h1><div class="name">${esc(d.birthday_person)}!</div><p class="from">Made with love, just for you — <strong>${esc(d.creator_name||"Someone special")} 💛</strong></p><p>✨ You are loved. You are celebrated. Today is yours. ✨</p></section>`;
  $("#sharedKeep")?.addEventListener("click",()=>{previewIndex++;renderSharedStages();if(previewIndex===3)confetti()});
  document.querySelectorAll("[data-shared-pop]").forEach(b=>b.onclick=()=>{b.classList.add("popped");b.disabled=true;const i=+b.dataset.sharedPop;$("#reasonReveal").innerHTML=`<div class="reason-card"><small>REASON NO. ${i+1}</small><strong>${esc(reasons[i])}</strong></div>`});
}

$("#previewBack").onclick=()=>{if(isShared){location.href="/"}else{$("#previewView").classList.add("hidden");$("#setupView").classList.remove("hidden");step=5;render()}};
function confetti(){const box=document.createElement("div");box.className="confetti";for(let i=0;i<80;i++){const p=document.createElement("i");p.className="piece";p.style.left=Math.random()*100+"%";p.style.background=["#ffcb3d","#ff6d61","#59d6bd","#ff7bb7","#fff0a6"][i%5];p.style.animationDuration=(3+Math.random()*4)+"s";p.style.animationDelay=Math.random()*1.5+"s";box.appendChild(p)}document.body.appendChild(box);setTimeout(()=>box.remove(),8000)}
$("#soundBtn").onclick=()=>{soundOn=!soundOn;$("#soundBtn").textContent=soundOn?"🔊":"🔇";$("#soundBtn2").textContent=soundOn?"🔊":"🔇"};
$("#soundBtn2").onclick=()=>$("#soundBtn").click();

if(location.pathname.startsWith("/s/")){
  isShared=true;$("#setupView").classList.add("hidden");$("#previewView").classList.remove("hidden");previewIndex=0;renderPreview();
}else render();
