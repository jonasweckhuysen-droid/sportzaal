import { initializeApp } from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
getFirestore
}
from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "AIzaSyBfmVCX619OSWwiw1_oZeFD9ea9TNj-QGo",
  authDomain: "sportzaal-bf49e.firebaseapp.com",
  databaseURL: "https://sportzaal-bf49e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sportzaal-bf49e",
  storageBucket: "sportzaal-bf49e.firebasestorage.app",
  messagingSenderId: "1032157836319",
  appId: "1:1032157836319:web:15a57919c57afecb1c912a",
  measurementId: "G-V7ECHPX428"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
