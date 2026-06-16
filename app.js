import { db } from "./firebase-config.js";

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc
}
from 
"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


let naam = localStorage.getItem("naam");

if(!naam){

naam = prompt("Geef je naam:");

localStorage.setItem("naam",naam);

}


const lijst =
document.getElementById("reservaties");


async function laadReservaties(){

lijst.innerHTML="";


const snapshot =
await getDocs(
collection(db,"reservaties")
);



snapshot.forEach((item)=>{


const data=item.data();


const kaart =
document.createElement("div");


kaart.className="reservatie";


kaart.innerHTML=`

<div class="kaart-header">

<h3>
🔥 ${data.datum}
</h3>

<span>
🕒 ${data.uur}
</span>

</div>


<p>
👤 ${data.naam}
</p>


${
data.naam === naam ?

`
<button onclick="bewerk('${item.id}')">
✏️
</button>

<button onclick="verwijder('${item.id}')">
🗑️
</button>
`

:

""

}


`;


lijst.appendChild(kaart);


});


}



window.verwijder = async(id)=>{


if(confirm("Reservatie verwijderen?")){


await deleteDoc(
doc(db,"reservaties",id)
);


laadReservaties();


}


}




window.bewerk = async(id)=>{


let nieuwUur =
prompt(
"Nieuw uur:"
);


await updateDoc(

doc(db,"reservaties",id),

{

uur: nieuwUur

}

);


laadReservaties();


}



laadReservaties();
