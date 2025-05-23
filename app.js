// پیکربندی جدید Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPRo2OkGNqEaIR1KB5exJhM3_e5OBXoF8",
  authDomain: "videogenerator-274eb.firebaseapp.com",
  projectId: "videogenerator-274eb",
  storageBucket: "videogenerator-274eb.firebasestorage.app",
  messagingSenderId: "841757070475",
  appId: "1:841757070475:web:c48b0aa3f019e3fc08b08e",
  measurementId: "G-8QGPD13RJH"
};

// مقداردهی Firebase
firebase.initializeApp(firebaseConfig);

// سرویس‌های موردنیاز
const auth = firebase.auth();
const db = firebase.firestore();

// انتخاب عناصر صفحه
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
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(userCredential.user.uid).set({
      email,
      credit: 1000
    });
    alert("ثبت‌نام با موفقیت انجام شد!");
  } catch (err) {
    alert("❌ خطا در ثبت‌نام: " + err.message);
    console.error(err);
  }
});

// ورود
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    alert("❌ خطا در ورود: " + err.message);
    console.error(err);
  }
});

// مشاهده وضعیت ورود/خروج
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const doc = await db.collection("users").doc(user.uid).get();
    const credit = doc.exists ? doc.data().credit : 0;
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

// تولید ویدیو (فعلاً فقط کم کردن اعتبار)
generateBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();
  let credit = doc.data().credit;
  if (credit < 50) {
    alert("❌ اعتبار کافی نیست!");
    return;
  }
  await ref.update({ credit: credit - 50 });
  creditDisplay.textContent = credit - 50;
  alert("✅ درخواست تولید ویدیو ثبت شد! (فعلاً تست)");
});
