particleJS();
makeFloatOnParticle("authContainer");

let ui = new firebaseui.auth.AuthUI(firebase.auth());
let uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            return true;
        },
        uiShown: function () {
            $("#loader").hide();
        }
    },
    'credentialHelper': firebaseui.auth.CredentialHelper.NONE,
    signInFlow: 'popup',
    signInSuccessUrl: 'app/index.html',
    signInOptions: [{
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    }],
};
ui.start('#authContainer', uiConfig);

if (ui.isPendingRedirect()) {
    ui.start('#authContainer', uiConfig);
}
// This can also be done via:
if ((firebase.auth().isSignInWithEmailLink(window.location.href))) {
    ui.start('#authContainer', uiConfig);
}

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        localStorage.setItem('userID', user.uid);
        window.location.href = "app/index.html";
    }
});
