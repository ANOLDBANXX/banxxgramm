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
 {
  id:"1",
  u:"anold.banxx",
  i:"AB",
  l:"Kampala, Uganda",
  text:"Welcome to Banxxgram! 🚀 Share • Connect • Be You.",
  likes:24,
  liked:false,
  c:[
   ["lynda.banxx","This is fire 🔥"],
   ["kato.ug","Nice design!"]
  ],
  label:"BANXX",
  theme:""
 },
 {
  id:"2",
  u:"sarah.styles",
  i:"SS",
  l:"Mityana",
  text:"New week, new designs ✨",
  likes:51,
  liked:false,
  c:[],
  label:"STYLE",
  theme:"theme2"
 },
 {
  id:"3",
  u:"john.daily",
  i:"JD",
  l:"Entebbe",
  text:"Good vibes only 😎",
  likes:87,
  liked:false,
  c:[],
  label:"VIBES",
  theme:"theme3"
 }
];

let posts=JSON.parse(localStorage.getItem(KEY)||"null")||demo;
let preview=null;

let currentUser=null;
let currentProfile=null;


/* =========================================================
   BANXXGRAM SUPABASE SETUP
   ========================================================= */

const SUPABASE_URL="https://eeoyocbchcgxiafugyrx.supabase.co";

const SUPABASE_ANON_KEY="sb_publishable_YoDt1uYphw89Ri83UGkY-A_wV04ti33";

let sb=null;


/* =========================================================
   SUPABASE INITIALIZATION
   ========================================================= */

async function initSupabase(){

 if(!window.supabase){
   console.error("Supabase library is not loaded.");

   toast("Supabase library is not loaded.");

   return false;
 }

 sb=window.supabase.createClient(
   SUPABASE_URL,
   SUPABASE_ANON_KEY
 );

 return true;
}


/* =========================================================
   LOAD CURRENT USER PROFILE
   ========================================================= */

async function loadCurrentProfile(){

 if(!sb){
   return null;
 }

 const result=await sb.auth.getUser();

 const user=result.data?.user;

 if(!user){
   currentUser=null;
   currentProfile=null;
   return null;
 }

 currentUser=user;

 const profileResult=await sb
   .from("profiles")
   .select("*")
   .eq("id",user.id)
   .single();

 if(profileResult.error){

   console.error(
     "Could not load profile:",
     profileResult.error
   );

   currentProfile=null;

   return null;
 }

 currentProfile=profileResult.data;

 return currentProfile;
}


/* =========================================================
   DISPLAY NAME
   ========================================================= */

function getDisplayName(){

 if(currentProfile?.full_name){
   return currentProfile.full_name;
 }

 if(currentUser?.user_metadata?.full_name){
   return currentUser.user_metadata.full_name;
 }

 return "";
}


/* =========================================================
   USERNAME
   ========================================================= */

function getUsername(){

 if(currentProfile?.username){
   return currentProfile.username;
 }

 if(currentUser?.user_metadata?.username){
   return currentUser.user_metadata.username;
 }

 return "";
}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(){

 const name=getDisplayName()||getUsername();

 if(!name){
   return "";
 }

 const parts=name
   .replace("@","")
   .trim()
   .split(/\s+/);

 if(parts.length>=2){

   return (
     parts[0][0]+
     parts[1][0]
   ).toUpperCase();

 }

 return name
   .replace("@","")
   .slice(0,2)
   .toUpperCase();
}


/* =========================================================
   UPDATE CURRENT USER UI
   ========================================================= */

function updateCurrentUserUI(){

 const displayName=getDisplayName();

 const username=getUsername();

 const initials=getInitials();

 const sideDisplayName=
   document.getElementById("sideDisplayName");

 const sideUsername=
   document.getElementById("sideUsername");

 const sideAvatar=
   document.getElementById("sideAvatar");

 const profileUsername=
   document.getElementById("profileUsername");

 const profileBio=
   document.getElementById("profileBio");

 const profileAvatar=
   document.getElementById("profileAvatar");


 if(sideDisplayName){

   sideDisplayName.textContent=
     currentUser
       ? displayName
       : "";

 }


 if(sideUsername){

   sideUsername.textContent=
     currentUser && username
       ? "@"+username
       : "";

 }


 if(profileUsername){

   profileUsername.textContent=
     currentUser && username
       ? "@"+username
       : "";

 }


 if(profileBio){

   profileBio.textContent=
     currentUser
       ? (currentProfile?.bio||"")
       : "";

 }


 if(sideAvatar){

   sideAvatar.textContent=
     currentUser
       ? initials
       : "";

 }


 if(profileAvatar){

   profileAvatar.textContent=
     currentUser
       ? initials
       : "";

 }


 /* Avatar image */

 if(currentProfile?.avatar_url){

   if(sideAvatar){

     sideAvatar.style.backgroundImage=
       `url("${currentProfile.avatar_url}")`;

     sideAvatar.style.backgroundSize="cover";

     sideAvatar.style.backgroundPosition="center";

     sideAvatar.textContent="";

   }


   if(profileAvatar){

     profileAvatar.style.backgroundImage=
       `url("${currentProfile.avatar_url}")`;

     profileAvatar.style.backgroundSize="cover";

     profileAvatar.style.backgroundPosition="center";

     profileAvatar.textContent="";

   }

 }else{

   if(sideAvatar){

     sideAvatar.style.backgroundImage="";

   }

   if(profileAvatar){

     profileAvatar.style.backgroundImage="";

   }

 }


 /* Update authentication buttons */

 const authStatus=
   document.getElementById("authStatus");

 if(authStatus){

   if(currentUser){

     authStatus.textContent=
       "Signed in as "+
       (username||displayName||"user")+
       ".";

   }else{

     authStatus.textContent=
       "You are browsing as a guest.";

   }

 }


 const signInButton=
   document.getElementById("signInBtn");

 const signUpButton=
   document.getElementById("signUpBtn");

 const signOutButton=
   document.getElementById("signOutBtn");


 if(signInButton){

   signInButton.style.display=
     currentUser ? "none" : "";

 }


 if(signUpButton){

   signUpButton.style.display=
     currentUser ? "none" : "";

 }


 if(signOutButton){

   signOutButton.style.display=
     currentUser ? "" : "none";

 }

}


/* =========================================================
   EMPTY PROFILE FOR GUESTS
   ========================================================= */

function renderEmptyProfile(){

 const ids=[
   "sideDisplayName",
   "sideUsername",
   "profileUsername",
   "profileBio"
 ];

 ids.forEach(id=>{

   const element=
     document.getElementById(id);

   if(element){

     element.textContent="";

   }

 });


 const avatars=[
   "sideAvatar",
   "profileAvatar"
 ];

 avatars.forEach(id=>{

   const element=
     document.getElementById(id);

   if(element){

     element.textContent="";

     element.style.backgroundImage="";

   }

 });


 const postCount=
   document.getElementById("postCount");

 const followerCount=
   document.getElementById("followerCount");

 const followingCount=
   document.getElementById("followingCount");


 if(postCount){
   postCount.textContent="0";
 }

 if(followerCount){
   followerCount.textContent="0";
 }

 if(followingCount){
   followingCount.textContent="0";
 }

}


/* =========================================================
   AUTH UI
   ========================================================= */

function addAuthUI(){

 if(document.getElementById("authBox")){
   return;
 }


 const box=document.createElement("div");

 box.id="authBox";

 box.className="card";

 box.style.cssText=`
 position:fixed;
 right:20px;
 bottom:20px;
 width:300px;
 max-width:calc(100vw - 40px);
 padding:18px;
 z-index:9999;
 background:#090d16;
 border:1px solid rgba(255,255,255,.12);
 border-radius:16px;
 box-shadow:0 15px 45px rgba(0,0,0,.45);
 `;


 box.innerHTML=`

 <div style="font-weight:800;font-size:18px;margin-bottom:12px;">
   Banxxgram Account
 </div>

 <div id="authStatus"
      style="font-size:13px;opacity:.75;margin-bottom:12px;">
   You are browsing as a guest.
 </div>

 <input
   id="authEmail"
   type="email"
   placeholder="Email"
   autocomplete="email"
   style="
     width:100%;
     box-sizing:border-box;
     margin-bottom:8px;
     padding:11px;
     border-radius:10px;
     border:1px solid rgba(255,255,255,.12);
     background:#111827;
     color:white;
   "
 >

 <input
   id="authPassword"
   type="password"
   placeholder="Password"
   autocomplete="current-password"
   style="
     width:100%;
     box-sizing:border-box;
     margin-bottom:8px;
     padding:11px;
     border-radius:10px;
     border:1px solid rgba(255,255,255,.12);
     background:#111827;
     color:white;
   "
 >

 <input
   id="authUsername"
   type="text"
   placeholder="Username for new account"
   autocomplete="username"
   style="
     width:100%;
     box-sizing:border-box;
     margin-bottom:8px;
     padding:11px;
     border-radius:10px;
     border:1px solid rgba(255,255,255,.12);
     background:#111827;
     color:white;
   "
 >

 <input
   id="authFullName"
   type="text"
   placeholder="Full name for new account"
   autocomplete="name"
   style="
     width:100%;
     box-sizing:border-box;
     margin-bottom:10px;
     padding:11px;
     border-radius:10px;
     border:1px solid rgba(255,255,255,.12);
     background:#111827;
     color:white;
   "
 >

 <div style="display:flex;gap:8px;flex-wrap:wrap;">

   <button
     id="signInBtn"
     class="primary"
     type="button">
     Sign in
   </button>

   <button
     id="signUpBtn"
     type="button">
     Sign up
   </button>

   <button
     id="signOutBtn"
     type="button"
     style="display:none;">
     Sign out
   </button>

 </div>

 `;


 document.body.appendChild(box);


 document
   .getElementById("signInBtn")
   .addEventListener(
     "click",
     signIn
   );


 document
   .getElementById("signUpBtn")
   .addEventListener(
     "click",
     signUp
   );


 document
   .getElementById("signOutBtn")
   .addEventListener(
     "click",
     signOut
   );

}


/* =========================================================
   AUTH STATUS
   ========================================================= */

function setAuthStatus(message){

 const status=
   document.getElementById("authStatus");

 if(status){

   status.textContent=message;

 }

}


/* =========================================================
   SIGN IN
   ========================================================= */

async function signIn(){

 if(!sb){

   toast(
     "Supabase is not connected."
   );

   return;

 }


 const email=
   document
     .getElementById("authEmail")
     .value
     .trim();


 const password=
   document
     .getElementById("authPassword")
     .value;


 if(!email||!password){

   toast(
     "Enter your email and password."
   );

   return;

 }


 setAuthStatus(
   "Signing in..."
 );


 const result=
   await sb.auth.signInWithPassword({
     email,
     password
   });


 if(result.error){

   console.error(
     result.error
   );

   setAuthStatus(
     result.error.message
   );

   toast(
     result.error.message
   );

   return;

 }


 currentUser=
   result.data.user;


 await loadCurrentProfile();

 updateCurrentUserUI();

 renderProfile();

 setAuthStatus(
   "Signed in successfully."
 );

 toast(
   "Welcome back!"
 );

}


/* =========================================================
   SIGN UP
   ========================================================= */

async function signUp(){

 if(!sb){

   toast(
     "Supabase is not connected."
   );

   return;

 }


 const email=
   document
     .getElementById("authEmail")
     .value
     .trim();


 const password=
   document
     .getElementById("authPassword")
     .value;


 const username=
   document
     .getElementById("authUsername")
     .value
     .trim()
     .toLowerCase();


 const fullName=
   document
     .getElementById("authFullName")
     .value
     .trim();


 if(!email||!password){

   toast(
     "Enter an email and password."
   );

   return;

 }


 if(!username){

   toast(
     "Enter a username."
   );

   return;

 }


 setAuthStatus(
   "Creating your account..."
 );


 const result=
   await sb.auth.signUp({

     email,

     password,

     options:{
       data:{
         username:username,
         full_name:fullName
       }
     }

   });


 if(result.error){

   console.error(
     result.error
   );

   setAuthStatus(
     result.error.message
   );

   toast(
     result.error.message
   );

   return;

 }


 if(result.data.user){

   currentUser=
     result.data.user;

 }


 if(result.data.session){

   await loadCurrentProfile();

   updateCurrentUserUI();

   renderProfile();

   setAuthStatus(
     "Account created successfully."
   );

   toast(
     "Welcome to Banxxgram!"
   );

 }else{

   setAuthStatus(
     "Account created. Check your email to confirm your account."
   );

   toast(
     "Check your email to confirm your account."
   );

 }

}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut(){

 if(!sb){
   return;
 }


 const result=
   await sb.auth.signOut();


 if(result.error){

   console.error(
     result.error
   );

   toast(
     result.error.message
   );

   return;

 }


 currentUser=null;

 currentProfile=null;

 renderEmptyProfile();

 updateCurrentUserUI();

 renderProfile();

 setAuthStatus(
   "You are browsing as a guest."
 );

 toast(
   "Signed out."
 );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function esc(value){

 return String(value??"")
   .replace(/&/g,"&amp;")
   .replace(/</g,"&lt;")
   .replace(/>/g,"&gt;")
   .replace(/"/g,"&quot;")
   .replace(/'/g,"&#039;");

}


/* =========================================================
   SAVE LOCAL POSTS
   ========================================================= */

function save(){

 localStorage.setItem(
   KEY,
   JSON.stringify(posts)
 );

}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message){

 const element=
   document.getElementById("toast");

 if(!element){
   return;
 }

 element.textContent=message;

 element.classList.add("show");

 clearTimeout(
   window.__banxxToast
 );

 window.__banxxToast=
   setTimeout(
     ()=>{
       element.classList.remove("show");
     },
     2600
   );

}


/* =========================================================
   SHOW SECTION
   ========================================================= */

function showSection(section){

 document
   .querySelectorAll(".page")
   .forEach(page=>{

     page.classList.toggle(
       "active",
       page.id===section
     );

   });


 document
   .querySelectorAll(
     "[data-section]"
   )
   .forEach(button=>{

     button.classList.toggle(
       "active",
       button.dataset.section===section
     );

   });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
 .querySelectorAll("[data-section]")
 .forEach(button=>{

   button.addEventListener(
     "click",
     ()=>showSection(
       button.dataset.section
     )
   );

 });


/* =========================================================
   STORIES
   ========================================================= */

function renderStories(){

 const container=
   document.getElementById("stories");

 if(!container){
   return;
 }


 container.innerHTML=`

 <div class="story">

   <div class="avatar">
     AB
   </div>

   <span>Your story</span>

 </div>

 <div class="story">

   <div class="avatar">
     LB
   </div>

   <span>Lynda</span>

 </div>

 <div class="story">

   <div class="avatar">
     SS
   </div>

   <span>Sarah</span>

 </div>

 <div class="story">

   <div class="avatar">
     JD
   </div>

   <span>John</span>

 </div>

 `;

}


/* =========================================================
   FEED
   ========================================================= */

function renderFeed(){

 const feed=
   document.getElementById("feed");

 if(!feed){
   return;
 }


 if(!posts.length){

   feed.innerHTML=`
     <div class="card page-card">
       <p class="muted">
         No posts yet.
       </p>
     </div>
   `;

   return;

 }


 feed.innerHTML=
   posts.map(
     post=>{

       const comments=
         (post.c||[])
         .map(
           comment=>`

           <div class="comment">

             <strong>
               @${esc(comment[0])}
             </strong>

             <span>
               ${esc(comment[1])}
             </span>

           </div>

           `
         )
         .join("");


       const image=
         post.image
           ? `<img
                class="post-image"
                src="${esc(post.image)}"
                alt="Post image"
              >`
           : "";


       return `

       <article
         class="card post ${esc(post.theme||"")}"
         data-id="${esc(post.id)}"
       >

         <div class="post-head">

           <div class="avatar">
             ${esc(post.i||"")}
           </div>

           <div>

             <strong>
               @${esc(post.u)}
             </strong>

             <small>
               ${esc(post.l||"")}
             </small>

           </div>

         </div>


         <div class="post-label">
           ${esc(post.label||"BANXX")}
         </div>


         <p class="post-text">
           ${esc(post.text||"")}
         </p>


         ${image}


         <div class="post-actions">

           <button
             class="like-btn"
             data-like="${esc(post.id)}"
           >
             ${post.liked?"♥":"♡"}
             ${post.likes||0}
           </button>

           <button
             class="comment-btn"
             data-comment="${esc(post.id)}"
           >
             💬
             ${(post.c||[]).length}
           </button>

         </div>


         <div class="comments">
           ${comments}
         </div>


         <div
           class="comment-form"
           data-form="${esc(post.id)}"
           style="display:none;"
         >

           <input
             type="text"
             placeholder="Write a comment..."
             maxlength="200"
           >

           <button
             class="primary"
             data-send-comment="${esc(post.id)}"
           >
             Send
           </button>

         </div>

       </article>

       `;

     }
   ).join("");


 document
   .querySelectorAll("[data-like]")
   .forEach(button=>{

     button.addEventListener(
       "click",
       ()=>{

         const id=
           button.dataset.like;

         const post=
           posts.find(
             item=>item.id===id
           );

         if(!post){
           return;
         }

         post.liked=
           !post.liked;

         post.likes=
           Math.max(
             0,
             (post.likes||0)+
             (post.liked?1:-1)
           );

         save();

         renderFeed();

       }
     );

   });


 document
   .querySelectorAll("[data-comment]")
   .forEach(button=>{

     button.addEventListener(
       "click",
       ()=>{

         const id=
           button.dataset.comment;

         const form=
           document.querySelector(
             `[data-form="${id}"]`
           );

         if(form){

           form.style.display=
             form.style.display==="none"
               ? "flex"
               : "none";

         }

       }
     );

   });


 document
   .querySelectorAll("[data-send-comment]")
   .forEach(button=>{

     button.addEventListener(
       "click",
       ()=>{

         if(!currentUser){

           toast(
             "Please sign in to comment."
           );

           return;

         }


         const id=
           button.dataset.sendComment;

         const form=
           document.querySelector(
             `[data-form="${id}"]`
           );

         if(!form){
           return;
         }


         const input=
           form.querySelector("input");


         const text=
           input.value.trim();


         if(!text){

           toast(
             "Write a comment first."
           );

           return;

         }


         const post=
           posts.find(
             item=>item.id===id
           );


         if(!post){
           return;
         }


         post.c=
           post.c||[];


         post.c.push([
           getUsername()||"user",
           text
         ]);


         input.value="";

         save();

         renderFeed();

       }
     );

   });

}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

function renderSuggestions(){

 const container=
   document.getElementById(
     "suggestions"
   );

 if(!container){
   return;
 }


 container.innerHTML=
   users
   .filter(
     user=>
       user.u!==getUsername()
   )
   .slice(0,5)
   .map(
     user=>`

       <div class="suggestion-row">

         <div class="avatar">
           ${esc(user.i)}
         </div>

         <div>

           <strong>
             @${esc(user.u)}
           </strong>

           <small>
             ${esc(user.l)}
           </small>

         </div>

       </div>

     `
   )
   .join("");

}


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile(){

 const username=
   document.getElementById(
     "profileUsername"
   );

 const bio=
   document.getElementById(
     "profileBio"
   );

 const postCount=
   document.getElementById(
     "postCount"
   );

 const followerCount=
   document.getElementById(
     "followerCount"
   );

 const followingCount=
   document.getElementById(
     "followingCount"
   );

 const grid=
   document.getElementById(
     "profileGrid"
   );


 if(!currentUser){

   renderEmptyProfile();

   if(grid){

     grid.innerHTML=`
       <div class="empty">
         Sign in to see your profile.
       </div>
     `;

   }

   return;

 }


 const userName=
   getUsername();


 if(username){

   username.textContent=
     userName
       ? "@"+userName
       : "";

 }


 if(bio){

   bio.textContent=
     currentProfile?.bio||"";

 }


 const myPosts=
   posts.filter(
     post=>
       post.u===userName
   );


 if(postCount){

   postCount.textContent=
     myPosts.length;

 }


 if(followerCount){

   followerCount.textContent=
     "0";

 }


 if(followingCount){

   followingCount.textContent=
     "0";

 }


 if(grid){

   if(!myPosts.length){

     grid.innerHTML=`
       <div class="empty">
         You have not created any posts yet.
       </div>
     `;

   }else{

     grid.innerHTML=
       myPosts
       .map(
         post=>`

           <div class="profile-tile">

             ${
               post.image
                 ? `<img
                      src="${esc(post.image)}"
                      alt="Post"
                    >`
                 : `<div class="profile-tile-text">
                      ${esc(post.text||"")}
                    </div>`
             }

           </div>

         `
       )
       .join("");

   }

 }

}


/* =========================================================
   SEARCH
   ========================================================= */

function doSearch(value){

 const results=
   document.getElementById(
     "results"
   );

 if(!results){
   return;
 }


 const query=
   value.trim().toLowerCase();


 if(!query){

   results.className=
     "results empty";

   results.textContent=
     "Start typing to search.";

   return;

 }


 const matches=
   users.filter(
     user=>
       user.u
         .toLowerCase()
         .includes(query)
   );


 if(!matches.length){

   results.className=
     "results empty";

   results.textContent=
     "No users found.";

   return;

 }


 results.className=
   "results";


 results.innerHTML=
   matches
   .map(
     user=>`

       <div class="result-row">

         <div class="avatar">
           ${esc(user.i)}
         </div>

         <div>

           <strong>
             @${esc(user.u)}
           </strong>

           <small>
             ${esc(user.l)}
           </small>

         </div>

       </div>

     `
   )
   .join("");

}


/* =========================================================
   SEARCH EVENTS
   ========================================================= */

const searchInput=
 document.getElementById(
   "searchInput"
 );


if(searchInput){

 searchInput.addEventListener(
   "input",
   event=>
     doSearch(
       event.target.value
     )
 );

}


const globalSearch=
 document.getElementById(
   "globalSearch"
 );


if(globalSearch){

 globalSearch.addEventListener(
   "input",
   event=>{

     const value=
       event.target.value;

     if(value.trim()){

       showSection(
         "search"
       );

       doSearch(value);

     }

   }
 );

}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

const postImage=
 document.getElementById(
   "postImage"
 );


if(postImage){

 postImage.addEventListener(
   "change",
   event=>{

     const file=
       event.target.files?.[0];


     if(!file){

       preview=null;

       const imagePreview=
         document.getElementById(
           "imagePreview"
         );

       if(imagePreview){

         imagePreview.textContent=
           "Image preview appears here.";

       }

       return;

     }


     const reader=
       new FileReader();


     reader.onload=
       event=>{

         preview=
           event.target.result;


         const imagePreview=
           document.getElementById(
             "imagePreview"
           );


         if(imagePreview){

           imagePreview.innerHTML=
             `<img
                src="${esc(preview)}"
                alt="Preview"
              >`;

         }

       };


     reader.readAsDataURL(file);

   }
 );

}


/* =========================================================
   PUBLISH POST
   ========================================================= */

const publishBtn=
 document.getElementById(
   "publishBtn"
 );


if(publishBtn){

 publishBtn.addEventListener(
   "click",
   ()=>{

     const text=
       document
         .getElementById("postText")
         .value
         .trim();


     if(!text){

       toast(
         "Write a caption first"
       );

       return;

     }


     if(!currentUser){

       toast(
         "Please sign in before creating a post"
       );

       return;

     }


     posts.unshift({

       id:
         "p"+Date.now(),

       u:
         getUsername()||"user",

       i:
         getInitials(),

       l:
         currentProfile?.location||
         "Uganda",

       text,

       likes:0,

       liked:false,

       c:[],

       label:"BANXX",

       image:preview,

       mine:true,

       theme:""

     });


     save();


     document
       .getElementById(
         "postText"
       )
       .value="";


     document
       .getElementById(
         "postImage"
       )
       .value="";


     preview=null;


     document
       .getElementById(
         "imagePreview"
       )
       .textContent=
       "Image preview appears here.";


     renderFeed();

     renderProfile();

     showSection(
       "home"
     );


     toast(
       "Post shared"
     );

   }
 );

}


/* =========================================================
   START AUTH UI
   ========================================================= */

addAuthUI();


/* =========================================================
   START BANXXGRAM
   ========================================================= */

renderStories();

renderFeed();

renderSuggestions();

renderProfile();


/* =========================================================
   CONNECT TO SUPABASE
   ========================================================= */

(async()=>{

 const connected=
   await initSupabase();


 if(
   connected &&
   sb
 ){

   const sessionResult=
     await sb.auth.getSession();


   const session=
     sessionResult.data?.session;


   currentUser=
     session?.user||null;


   if(currentUser){

     await loadCurrentProfile();

   }


   updateCurrentUserUI();

   renderProfile();


   sb.auth.onAuthStateChange(
     async(
       _event,
       session
     )=>{

       currentUser=
         session?.user||null;

       currentProfile=null;


       if(currentUser){

         await loadCurrentProfile();

       }


       updateCurrentUserUI();

       renderProfile();

       renderSuggestions();


       const status=
         document.getElementById(
           "authStatus"
         );


       if(status){

         status.textContent=
           currentUser
             ? `Signed in as ${
                 getUsername()||
                 getDisplayName()||
                 "user"
               }.`
             : "You are browsing as a guest.";

       }

     }
   );

 }

})();
