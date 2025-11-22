// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrs7c4OtATKaEW40bFTgpytKDGW6W0dac",
    authDomain: "xoxo-81496.firebaseapp.com",
    databaseURL: "https://xoxo-81496-default-rtdb.firebaseio.com",
    projectId: "xoxo-81496",
    storageBucket: "xoxo-81496.firebasestorage.app",
    messagingSenderId: "859910188039",
    appId: "1:859910188039:web:3a963d0ad6983301b08ea2",
    measurementId: "G-SYHSV54ZD8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Export for use in other files
window.firebaseServices = {
    auth,
    database
};

