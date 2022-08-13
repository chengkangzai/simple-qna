// https://www.obfuscator.io/
const firebaseConfig = {
    apiKey: "AIzaSyALfW4SEXCMSOfoEs8lSIdR7TB0CYVHDMs",
    authDomain: "simple-qna-ddd0e.firebaseapp.com",
    projectId: "simple-qna",
    storageBucket: "simple-qna.appspot.com",
    messagingSenderId: "741578099458",
    appId: "1:741578099458:web:fcbd8bfcdf3dcb2844101b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// const functions = firebase.functions();

function logout() {
    firebase.auth().signOut()
        .then(() => {
            localStorage.removeItem('userID');
            window.location.href = '../index.html';
        }).catch((error) => {
        console.log(error)
    });
}
