import { firebaseConfig } from "./firebase-config.js";
import { SEED } from "./seed.js";
const FB = "https://www.gstatic.com/firebasejs/13.4.0/";
// Interfaz: init(), user, login(), logout(), onDecisions(cb), save(d), addComment(id,c), onComments(id,cb)
export async function createStore(){
  if(!firebaseConfig) return localStore();
  const {initializeApp} = await import(FB+"firebase-app.js");
  const A = await import(FB+"firebase-auth.js");
  const F = await import(FB+"firebase-firestore.js");
  const app = initializeApp(firebaseConfig), auth = A.getAuth(app), db = F.getFirestore(app);
  const s = { mode:"firebase", user:null,
    onAuth(cb){ A.onAuthStateChanged(auth,u=>{s.user=u&&{email:u.email,name:u.displayName};cb(s.user)}); },
    login(){ return A.signInWithPopup(auth,new A.GoogleAuthProvider()); },
    logout(){ return A.signOut(auth); },
    onDecisions(cb){ return F.onSnapshot(F.collection(db,"decisions"),q=>cb(q.docs.map(d=>({...d.data(),id:d.id})))); },
    async save(d){ const {id,...rest}=d; await F.setDoc(F.doc(db,"decisions",id),{...rest,updatedAt:Date.now(),updatedBy:s.user?.email||""},{merge:true}); },
    async addComment(id,c){ await F.addDoc(F.collection(db,"decisions",id,"comments"),{...c,at:Date.now(),by:s.user?.email||""}); },
    onComments(id,cb){ return F.onSnapshot(F.query(F.collection(db,"decisions",id,"comments"),F.orderBy("at")),q=>cb(q.docs.map(d=>d.data()))); },
    async getAsset(id){ const d=await F.getDoc(F.doc(db,"assets",id)); return d.exists()?d.data().data:null; },
    async putAsset(id,data){ await F.setDoc(F.doc(db,"assets",id),{data,at:Date.now(),by:s.user?.email||""}); },
    async seedIfEmpty(){ const q=await F.getDocs(F.collection(db,"decisions")); const have=new Set(q.docs.map(d=>d.id)); const cur=new Map(q.docs.map(d=>[d.id,d.data()])); for(const d of SEED){ if(!have.has(d.id)) await s.save({...d,votes:{},answers:{}}); else if(d.images?.length && !cur.get(d.id).images) await s.save({id:d.id,images:d.images}); } }
  };
  return s;
}
function localStore(){
  const K="pulse-decisiones-v1", C="pulse-comentarios-v1", subs=new Set(), csubs=new Set();
  const load=()=>JSON.parse(localStorage.getItem(K)||"null")||SEED.map(d=>({...d,votes:{}}));
  const loadC=()=>JSON.parse(localStorage.getItem(C)||"{}");
  const push=()=>{const v=load();subs.forEach(f=>f(v));csubs.forEach(f=>f())};
  return { mode:"local", user:{email:"local",name:"Modo local"},
    onAuth(cb){cb(this.user)}, login(){}, logout(){},
    onDecisions(cb){subs.add(cb);cb(load());return()=>subs.delete(cb)},
    async save(d){const a=load();const i=a.findIndex(x=>x.id===d.id);if(i<0)a.push(d);else a[i]={...a[i],...d,updatedAt:Date.now()};localStorage.setItem(K,JSON.stringify(a));push()},
    async addComment(id,c){const m=loadC();(m[id]=m[id]||[]).push({...c,at:Date.now()});localStorage.setItem(C,JSON.stringify(m));push()},
    onComments(id,cb){const f=()=>cb(loadC()[id]||[]);csubs.add(f);f();return()=>csubs.delete(f)},
    async getAsset(){ return null; }, async putAsset(){},
    async seedIfEmpty(){}
  };
}
