// Firebase configuration
window.firebaseConfig = {
    apiKey: "AIzaSyD8KMiqZTr39IPw8LENyahLILLNbkFfQXM",
    authDomain: "bittuhere-90415.firebaseapp.com",
    databaseURL: "https://bittuhere-90415-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bittuhere-90415",
    storageBucket: "bittuhere-90415.firebasestorage.app",
    messagingSenderId: "600472267274",
    appId: "1:600472267274:web:b5f8394f99e17b232f3ca7",
    measurementId: "G-JD1YFCG7G3"
};

// Initialize Firebase if not already
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
}

// Database reference
window.db = firebase.database();
window.auth = firebase.auth();

// GAS URL for email operations
window.GAS_URL = 'https://script.google.com/macros/s/AKfycbw5RNkwwAM9OR8PMcb1A7dpq8Tf69inqb92bsROBhbkouwthfe2gJivY9fwMqkQdc_J/exec';

console.log('✅ Config loaded');