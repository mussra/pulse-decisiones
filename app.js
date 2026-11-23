import { createStore } from "./store.js";
import { VOTERS as V0, STATUSES } from "./seed.js";
const VOTERS = JSON.parse(localStorage.getItem("pulse-voters")||"null")||V0;
const $=s=>document.querySelector(s), esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store = await createStore(); let data=[], unsubD=null;
$("#mode").textContent = store.mode==="local"?"modo local (sin base de datos)":"conectado";
$("#who").innerHTML = VOTERS.map(v=>`<option>${v}</option>`).join("");
$("#who").value = localStorage.getItem("pulse-who")||"Ant"; $("#who").onchange=e=>localStorage.setItem("pulse-who",e.target.value);
$("#filter").innerHTML += STATUSES.map(s=>`<option>${s}</option>`).join(""); $("#filter").onchange=render;
$("#names").onclick=()=>{const t=prompt("Nombres de quienes votan, separados por comas",VOTERS.join(", ")); if(t){localStorage.setItem("pulse-voters",JSON.stringify(t.split(",").map(x=>x.trim()).filter(Boolean)));location.reload();}};
$("#in").onclick=()=>store.login(); $("#out").onclick=()=>store.logout();
store.onAuth(async u=>{ $("#login").hidden=!!u; $("#app").hidden=!u; $("#out").hidden=!u||store.mode==="local";
  if(u&&!unsubD){ await store.seedIfEmpty(); unsubD=store.onDecisions(d=>{data=d;render()}); } });
$("#new").onclick=async()=>{ const t=prompt("Título de la decisión"); if(!t) return;
  await store.save({id:"D-"+Date.now().toString(36),title:t,description:"",status:"propuesta",options:[],votes:{}}); };
const open=new Set(), assetCache={};
const note=t=>{let n=$("#assetnote"); if(!n){n=document.createElement("div");n.id="assetnote";n.className="mut";n.style.padding="4px 12px";$("main").prepend(n);} n.textContent=t;};
let hyd=false;
async function hydrate(){
  if(store.mode!=="firebase"||hyd) return; hyd=true; try{ await hydrate1(); } finally { hyd=false; } }
async function hydrate1(){
  for(const im of document.querySelectorAll("img[data-asset]")){ const id=im.dataset.asset; if(assetCache[id]){im.src=assetCache[id];continue;}
    try{ let d=await store.getAsset(id);
      if(!d){ const b=await (await fetch(im.dataset.src)).blob(); d=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);}); await store.putAsset(id,d); }
      assetCache[id]=d; im.src=d; note("Láminas: guardadas en Firestore (privadas) ✓");
    }catch(e){ note("Láminas: no se pueden guardar/leer en Firestore ("+(e.code||e.message)+"). Falta publicar la regla de assets."); } } }
function render(){
  if(document.activeElement?.matches?.("[data-ans]")&&document.activeElement.value!==document.activeElement.defaultValue) return;
  const f=$("#filter").value, who=$("#who").value;
  $("#list").innerHTML = data.filter(d=>!f||d.status===f).sort((a,b)=>STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status)).map(d=>{
    const v=d.votes||{}, cnt=k=>Object.values(v).filter(x=>x===k).length, mine=v[who];
    return `<div class="card" data-id="${esc(d.id)}"><div class="row"><b style="flex:1">${esc(d.title)}</b><span class="tag ${d.status}">${esc(d.status)}</span></div>
    <div class="mut">${esc(d.id)}</div><p>${esc(d.description)}</p>${(d.images||[]).map(i=>`<figure><a href="#" data-zoom><img data-asset="${esc(i.src.replace(/^.*\//,"").replace(/\.jpg$/,""))}" data-src="${esc(i.src)}" src="${esc(assetCache[i.src.replace(/^.*\//,"").replace(/\.jpg$/,"")]||i.src)}" alt="${esc(i.caption)}" loading="lazy"></a><figcaption class="mut">${esc(i.caption)} (toca para ampliar)</figcaption></figure>`).join("")}
    <div class="row">${["si","no","dudo"].map(k=>`<button class="v ${k} ${mine===k?"on":""}" data-vote="${k}">${{si:"Sí",no:"No",dudo:"Dudo"}[k]} ${cnt(k)}</button>`).join("")}
    <span class="mut">${Object.entries(v).map(([n,x])=>n+": "+x).join(" · ")}</span></div>
    <div class="ans">${Object.entries(d.answers||{}).filter(([,t])=>t).map(([n,t])=>`<p class="a"><b>${esc(n)}</b>: ${esc(t)}</p>`).join("")}
    <textarea rows="2" data-ans placeholder="Tu respuesta o propuesta en texto libre (${esc(who)})">${esc((d.answers||{})[who]||"")}</textarea>
    <div class="row"><button class="p" data-saveans>Guardar respuesta</button></div></div>
    <div class="row"><select data-status>${STATUSES.map(s=>`<option ${s===d.status?"selected":""}>${s}</option>`).join("")}</select>
    <button data-edit>Editar</button><button data-cm>Comentarios</button></div><div class="cm"></div></div>`; }).join("");
  document.querySelectorAll(".card").forEach(c=>{ const id=c.dataset.id, d=data.find(x=>x.id===id);
    c.querySelectorAll("[data-vote]").forEach(b=>b.onclick=()=>store.save({id,votes:{...(d.votes||{}),[$("#who").value]:b.dataset.vote}}));
    c.querySelector("[data-saveans]").onclick=()=>store.save({id,answers:{...(d.answers||{}),[$("#who").value]:c.querySelector("[data-ans]").value}});
    c.querySelector("[data-status]").onchange=e=>store.save({id,status:e.target.value});
    c.querySelector("[data-edit]").onclick=()=>{const t=prompt("Título",d.title); if(t===null)return; const x=prompt("Descripción",d.description); store.save({id,title:t,description:x??d.description});};
    c.querySelector("[data-cm]").onclick=()=>showComments(c,id); });
  document.querySelectorAll("a[data-zoom]").forEach(z=>z.onclick=async e=>{ e.preventDefault(); const im=z.querySelector("img"); const r=await fetch(im.src); window.open(URL.createObjectURL(await r.blob()),"_blank"); });
  hydrate();
}
function showComments(c,id){ const box=c.querySelector(".cm");
  box.innerHTML=`<div class="list"></div><div class="row"><input type="text" placeholder="Comentario / motivo"><button>Añadir</button></div>`;
  store.onComments(id,l=>box.querySelector(".list").innerHTML=l.map(x=>`<p class="mut"><b>${esc(x.who)}</b>: ${esc(x.text)}</p>`).join(""));
  box.querySelector("button").onclick=()=>{const i=box.querySelector("input"); if(i.value) store.addComment(id,{who:$("#who").value,text:i.value}), i.value="";}; }
