// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPRo2OkGNqEaIR1KB5exJhM3_e5OBXoF8",
  authDomain: "videogenerator-274eb.firebaseapp.com",
  projectId: "videogenerator-274eb",
  storageBucket: "videogenerator-274eb.firebasestorage.app",
  messagingSenderId: "841757070475",
  appId: "1:841757070475:web:c48b0aa3f019e3fc08b08e",
  measurementId: "G-8QGPD13RJH"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const creditDisplay = document.getElementById("credit-display");
const videoSection = document.getElementById("video-section");
const generateBtn = document.getElementById("generate-btn");
const result = document.getElementById("result");
const videoPlayer = document.getElementById("video-player");

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
    alert("ثبت‌نام موفق!");
  } catch (err) {
    alert("❌ ثبت‌نام ناموفق: " + err.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    alert("❌ ورود ناموفق: " + err.message);
  }
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
  const uid = user.uid;
  const imageUrl = document.getElementById("image-url").value;
  const prompt = document.getElementById("prompt").value;
  const duration = parseInt(document.getElementById("duration").value) || 5;

  if (!imageUrl || !prompt) {
    alert("لینک تصویر و پرامپت را وارد کنید.");
    return;
  }

  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();
  let credit = doc.data().credit;

  if (credit < 50) {
    alert("❌ اعتبار کافی نیست.");
    return;
  }

  generateBtn.disabled = true;
  result.textContent = "⏳ در حال تولید ویدیو...";

  try {
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "f5ed12a2-df0d-41a3-a3f2-c7a9c6e9b648", // kling 1.6
        input: {
          prompt,
          start_image: imageUrl,
          duration,
          aspect_ratio: "16:9",
          cfg_scale: 0.5
        }
      },
      {
        headers: {
          Authorization: "Token r8_KZVGeB9egn8UK5r2FhgXRqVvYGfE0KP3ZtxdO",
          "Content-Type": "application/json"
        }
      }
    );

    const getUrl = response.data.urls.get;
    let final = null;

    // Polling until video is ready
    for (let i = 0; i < 30; i++) {
      const poll = await axios.get(getUrl, {
        headers: {
          Authorization: "Token r8_KZVGeB9egn8UK5r2FhgXRqVvYGfE0KP3ZtxdO"
        }
      });
      if (poll.data.status === "succeeded") {
        final = poll.data.output;
        break;
      }
      await new Promise(res => setTimeout(res, 5000));
    }

    if (final) {
      await ref.update({ credit: credit - 50 });
      creditDisplay.textContent = credit - 50;
      result.textContent = "✅ ویدیو تولید شد!";
      videoPlayer.src = final;
      videoPlayer.style.display = "block";
    } else {
      result.textContent = "❌ ویدیو تولید نشد. لطفاً دوباره تلاش کنید.";
    }
  } catch (err) {
    console.error(err);
    result.textContent = "❌ خطا در تولید ویدیو.";
  }

  generateBtn.disabled = false;
});

function logout() {
  auth.signOut();
}
