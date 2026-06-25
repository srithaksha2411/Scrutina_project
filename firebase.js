// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUTq3zI3iM4KBun40ixS8VJZPEzXbTBd8",
  authDomain: "scrutina-2bf3d.firebaseapp.com",
  projectId: "scrutina-2bf3d",
  storageBucket: "scrutina-2bf3d.firebasestorage.app",
  messagingSenderId: "848421405392",
  appId: "1:848421405392:web:baee52893adbb9cb9914d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Setup Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Force account selection every time
});

// Export auth and provider
export { auth, googleProvider, signInWithPopup };
