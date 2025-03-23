
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
    // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCplSGJ290aIqVQ4GL9vv63keSG3nZv-kE",
    authDomain: "loan-application-system-8fc65.firebaseapp.com",
    projectId: "loan-application-system-8fc65",
    storageBucket: "loan-application-system-8fc65.firebasestorage.app",
    messagingSenderId: "945483136628",
    appId: "1:945483136628:web:6b0f4bb5688e05f79a1b21",
    measurementId: "G-SYPDZXKEDM"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app)
  export const db = getFirestore(app)