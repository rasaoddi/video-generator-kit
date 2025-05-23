// کانفیگ شما
const firebaseConfig = {
  apiKey: "AIzaSyCPRo2OKnGqEaRl1KBEJxHMJ_sEOBXoF8",
  authDomain: "videogenerator-274eb.firebaseapp.com",
  projectId: "videogenerator-274eb",
  storageBucket: "videogenerator-274eb.appspot.com",
  messagingSenderId: "841757070475",
  appId: "1:841757070475:web:f248c1bf0544a978b80e0e",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const creditDisplay = document.getElementById("credit-display");
const videoSection = document.getElementById("video-section");
const generateBtn = document.getElementById("generate-btn");

// ثبت‌نام
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection("users").doc(userCredential.user.uid).set({
    email,
    credit: 1000,
  });
  alert("ثبت‌نام با موفقیت انجام شد.");
});

// ورود
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  await auth.signInWithEmailAndPassword(email, password);
});

// وضعیت ورود
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const doc = await db.collection("users").doc(user.uid).get();
    const credit = doc.data().credit;
    creditDisplay.textContent = credit;
    videoSection.style.display = "block";
    signupForm.style.display = "none";
    loginForm.style.display = "none";
    generateBtn.disabled = credit < 50;
  } else {
    videoSection.style.display = "none";
    signupForm.style.display = "block";
    loginForm.style.display = "block";
    creditDisplay.textContent = "--";
  }
});

// دکمه تولید ویدیو
generateBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();
  let credit = doc.data().credit;
  if (credit < 50) {
    alert("اعتبار کافی نیست");
    return;
  }
  await ref.update({ credit: credit - 50 });
  creditDisplay.textContent = credit - 50;
  alert("درخواست تولید ویدیو ثبت شد! (API هنوز متصل نشده)");
});
