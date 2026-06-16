import { db } from "./firebase-config.js";

import {
collection,
addDoc,
getDocs,
query
}
from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let naam = localStorage.getItem("naam");

if(!naam){

naam = prompt("Wat is je naam?");

localStorage.setItem("naam",naam);

}

const modal =
document.getElementById("modal");

document.getElementById("reserveBtn")
.onclick=()=>{

modal.style.display="flex";

};

document.getElementById("opslaan")
.onclick=async()=>{

const datum =
document.getElementById("datum").value;

const uur =
document.getElementById("uur").value;

const q =
query(collection(db,"reservaties"));

const snapshot =
await getDocs(q);

let aantal = 0;

snapshot.forEach(doc=>{

const data = doc.data();

if(
data.datum===datum &&
data.uur===uur
){

aantal++;

}

});

if(aantal >= 3){

alert("Dit tijdsblok is vol.");

return;

}

await addDoc(
collection(db,"reservaties"),
{
naam,
datum,
uur
});

modal.style.display="none";

laadReservaties();

};

async function laadReservaties(){

const lijst =
document.getElementById("reservaties");

lijst.innerHTML="";

const snapshot =
await getDocs(
collection(db,"reservaties")
);

snapshot.forEach(doc=>{

const data = doc.data();

const div =
document.createElement("div");

div.className="reservatie";

div.innerHTML=`
<b>${data.datum}</b><br>
${data.uur}<br>
${data.naam}
`;

lijst.appendChild(div);

});

}

laadReservaties();
