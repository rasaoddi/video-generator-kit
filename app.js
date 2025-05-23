document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const generateBtn = document.getElementById("generate-btn");
  const videoSection = document.getElementById("video-section");
  const creditDisplay = document.getElementById("credit-display");
  const videoPreview = document.getElementById("video-preview");

  const firebaseConfig = {
    apiKey: "AIzaSyCPRo2OkGNqEaIR1KB5exJhM3_e5OBXoF8",
    authDomain: "videogenerator-274eb.firebaseapp.com",
    projectId: "videogenerator-274eb",
    storageBucket: "videogenerator-274eb.appspot.com",
    messagingSenderId: "841757070475",
    appId: "1:841757070475:web:c48b0aa3f019e3fc08b08e",
    measurementId: "G-8QGPD13RJH"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection("users").doc(userCredential.user.uid).set({ email, credit: 1000 });
      alert("ثبت‌نام با موفقیت انجام شد!");
    } catch (err) {
      alert("❌ خطا در ثبت‌نام: " + err.message);
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      alert("❌ خطا در ورود: " + err.message);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
  });

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const doc = await db.collection("users").doc(user.uid).get();
      const credit = doc.exists ? doc.data().credit : 0;
      creditDisplay.textContent = credit;
      videoSection.style.display = "block";
      signupForm.style.display = "none";
      loginForm.style.display = "none";
    } else {
      videoSection.style.display = "none";
      signupForm.style.display = "block";
      loginForm.style.display = "block";
      creditDisplay.textContent = "--";
    }
  });

  generateBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const imageUrl = document.getElementById("image-url").value;
    const prompt = document.getElementById("prompt").value;
    const duration = parseInt(document.getElementById("duration").value || "5");

    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    let credit = doc.data().credit;

    if (credit < 50) {
      alert("❌ اعتبار کافی نیست!");
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "در حال تولید...";

    try {
      const response = await fetch("https://available-valiant-cloche.glitch.me/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          start_image: imageUrl,
          duration
        })
      });

      const result = await response.json();
      const predictionId = result.id;

      if (!predictionId) throw new Error("لینک دریافت ویدیو پیدا نشد");

      let finalUrl = null;
      for (let i = 0; i < 60; i++) {
        const poll = await fetch(`https://available-valiant-cloche.glitch.me/poll/${predictionId}`);
        const pollData = await poll.json();
        if (pollData.status === "succeeded") {
          finalUrl = pollData.output;
          break;
        }
        await new Promise(res => setTimeout(res, 3000));
      }

      if (finalUrl) {
        await ref.update({ credit: credit - 50 });
        creditDisplay.textContent = credit - 50;
        videoPreview.src = finalUrl;
        videoPreview.style.display = "block";
        alert("✅ ویدیو آماده شد!");
      } else {
        alert("⏳ تولید ویدیو بیش از حد طول کشید یا با خطا مواجه شد.");
      }
    } catch (err) {
      alert("❌ خطا در تولید ویدیو: " + err.message);
    }

    generateBtn.disabled = false;
    generateBtn.textContent = "تولید ویدیو";
  });
});
