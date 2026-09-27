const KEY="banxxgram_posts_v3";
const users=[
 {u:"anold.banxx",i:"AB",l:"Kampala, Uganda"},
 {u:"lynda.banxx",i:"LB",l:"Kampala"},
 {u:"sarah.styles",i:"SS",l:"Mityana"},
 {u:"john.daily",i:"JD",l:"Entebbe"},
 {u:"kato.ug",i:"KU",l:"Uganda"},
 {u:"queen_bee",i:"QB",l:"Kampala"}
];
const demo=[
 {id:"1",u:"anold.banxx",i:"AB",l:"Kampala, Uganda",text:"Welcome to Banxxgram! 🚀 Share • Connect • Be You.",likes:24,liked:false,c:[["lynda.banxx","This is fire 🔥"],["kato.ug","Nice design!"]],label:"BANXX",theme:""},
 {id:"2",u:"sarah.styles",i:"SS",l:"Mityana",text:"New week, new designs ✨",likes:51,liked:false,c:[],label:"STYLE",theme:"theme2"},
 {id:"3",u:"john.daily",i:"JD",l:"Entebbe",text:"Good vibes only 😎",likes:87,liked:false,c:[],label:"VIBES",theme:"theme3"}
];
let posts=JSON.parse(localStorage.getItem(KEY)||"null")||demo;
let preview=null;

function save(){localStorage.setItem(KEY,JSON.stringify(posts))}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function idesc(v){return esc(v).replace(/'/g,"&#39;")}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2200)}

function showSection(id){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 document.getElementById(id)?.classList.add("active");
 document.querySelectorAll("[data-section]").forEach(x=>x.classList.toggle("active",x.dataset.section===id));
 if(id==="profile")renderProfile();
 window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));

function renderStories(){
 const people=[users[0],...users.slice(1,5)];
 document.getElementById("stories").innerHTML=people.map(x=>`<div class="story"><div class="avatar">${esc(x.i)}</div>${esc(x.u.split(".")[0])}</div>`).join("");
}
function renderFeed(){
 const feed=document.getElementById("feed");
 feed.innerHTML=posts.map(p=>`
 <article class="post card" data-id="${esc(p.id)}">
  <div class="post-head"><div class="avatar">${esc(p.i)}</div><div><strong>${esc(p.u)}</strong><small>${esc(p.l||"Uganda")}</small></div><button class="post-menu" onclick="deleteMine('${idesc(p.id)}')">${p.mine?"Delete":"•••"}</button></div>
  <div class="post-photo ${esc(p.theme||"")}" ${p.image?`style="background-image:url('${esc(p.image)}')"`:""}>${p.image?"":esc(p.label||"BANXX")}</div>
  <div class="post-body">
   <div class="actions">
    <button class="${p.liked?"liked":""}" onclick="likePost('${idesc(p.id)}')">${p.liked?"♥":"♡"}</button>
    <button onclick="focusComment('${idesc(p.id)}')">💬</button>
    <button onclick="sharePost('${idesc(p.id)}')">↗</button>
    <button class="save" onclick="toast('Saved in this demo')">🔖</button>
   </div>
   <div class="likes">${p.likes||0} likes</div>
   <div class="caption"><b>${esc(p.u)}</b> ${esc(p.text)}</div>
   <div class="comments">${(p.c||[]).map(x=>`<div><b>${esc(x[0])}</b> ${esc(x[1])}</div>`).join("")}</div>
   <div class="commentbox"><input id="comment-${esc(p.id)}" maxlength="250" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')addComment('${idesc(p.id)}')"><button onclick="addComment('${idesc(p.id)}')">Post</button></div>
  </div>
 </article>`).join("");
}
function likePost(id){const p=posts.find(x=>x.id===id);if(!p)return;p.liked=!p.liked;p.likes=Math.max(0,p.likes+(p.liked?1:-1));save();renderFeed()}
function focusComment(id){document.getElementById("comment-"+id)?.focus()}
function addComment(id){const input=document.getElementById("comment-"+id);if(!input?.value.trim())return;const p=posts.find(x=>x.id===id);p.c=p.c||[];p.c.push(["anold.banxx",input.value.trim()]);input.value="";save();renderFeed()}
async function sharePost(id){const p=posts.find(x=>x.id===id);const text=`${p.u}: ${p.text}`;try{if(navigator.share)await navigator.share({title:"Banxxgram",text});else{await navigator.clipboard.writeText(text);toast("Post copied to clipboard")}}catch(e){}}
function deleteMine(id){const p=posts.find(x=>x.id===id);if(!p?.mine){toast("Demo posts cannot be deleted");return}if(confirm("Delete your post?")){posts=posts.filter(x=>x.id!==id);save();renderFeed();renderProfile()}}
function renderSuggestions(){document.getElementById("suggestions").innerHTML=users.slice(1,5).map(x=>`<div class="suggest"><div class="avatar">${esc(x.i)}</div><div><strong>${esc(x.u)}</strong><small>${esc(x.l)}</small></div><button class="follow" onclick="toast('Follow feature is ready for a backend')">Follow</button></div>`).join("")}
function renderProfile(){const mine=posts.filter(p=>p.u==="anold.banxx");document.getElementById("postCount").textContent=mine.length;document.getElementById("profileGrid").innerHTML=mine.map((p,i)=>`<div class="tile" ${p.image?`style="background-image:url('${esc(p.image)}')"`:""}>${p.image?"":i+1}</div>`).join("")}
function search(q){const term=q.trim().toLowerCase(),r=document.getElementById("results");if(!term){r.className="results empty";r.textContent="Start typing to search.";return}const m=users.filter(x=>x.u.includes(term));r.className="results";r.innerHTML=m.length?m.map(x=>`<div class="search-result"><b>${esc(x.u)}</b><br><small class="muted">${esc(x.l)}</small></div>`).join(""):"<div class='empty'>No users found.</div>"}
document.getElementById("globalSearch").addEventListener("input",e=>{showSection("search");document.getElementById("searchInput").value=e.target.value;search(e.target.value)});
document.getElementById("searchInput").addEventListener("input",e=>search(e.target.value));
document.getElementById("postImage").addEventListener("change",e=>{
 const file=e.target.files[0];preview=null;if(!file)return;
 if(file.size>3*1024*1024){toast("Please choose an image under 3 MB");e.target.value="";return}
 const reader=new FileReader();reader.onload=()=>{preview=reader.result;document.getElementById("imagePreview").innerHTML=`<img src="${esc(preview)}" alt="Preview">`};reader.readAsDataURL(file)
});
document.getElementById("publishBtn").addEventListener("click",()=>{
 const text=document.getElementById("postText").value.trim();if(!text){toast("Write a caption first");return}
 posts.unshift({id:"p"+Date.now(),u:"anold.banxx",i:"AB",l:"Kampala, Uganda",text,likes:0,liked:false,c:[],label:"BANXX",image:preview,mine:true,theme:""});
 save();document.getElementById("postText").value="";document.getElementById("postImage").value="";preview=null;document.getElementById("imagePreview").textContent="Image preview appears here.";renderFeed();renderProfile();showSection("home");toast("Post shared")}
renderStories();renderFeed();renderSuggestions();renderProfile();
