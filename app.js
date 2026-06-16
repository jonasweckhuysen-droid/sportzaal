import {db}
from "./firebase-config.js";


import {

collection,
addDoc,
getDocs,
deleteDoc,
doc

}

from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";



let naam =
localStorage.getItem("naam");


if(!naam){

naam =
prompt(
"Naam:"
);

localStorage.setItem(
"naam",
naam
);

}




let calendar;



async function laadAgenda(){



let events=[];


let data =
await getDocs(
collection(db,"reservaties")
);



data.forEach(item=>{


let r=item.data();


events.push({

id:item.id,


title:

"🔥 "
+r.naam,


start:

r.datum+"T"+r.uur,


backgroundColor:

"#c1121f"


});


});




calendar = new FullCalendar.Calendar(

document.getElementById("calendar"),


{


initialView:"dayGridMonth",


locale:"nl",


selectable:true,


dateClick(info){


openPopup(
info.dateStr,
"18:00"
);


},



events:events



}

);



calendar.render();


}






function openPopup(
datum,
uur
){


document.getElementById("modal")
.style.display="flex";


document.getElementById("datum")
.value=datum;


document.getElementById("uur")
.value=uur;



document.getElementById(
"gekozenMoment"
)
.innerHTML=

datum+" om "+uur;


}





window.sluitPopup=function(){


document.getElementById("modal")
.style.display="none";


}





document
.getElementById("save")
.onclick=async()=>{


await addDoc(

collection(db,"reservaties"),

{


naam,


datum:
document.getElementById("datum").value,


uur:
document.getElementById("uur").value


}


);


location.reload();


}




laadAgenda();
