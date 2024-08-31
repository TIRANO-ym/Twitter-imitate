import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPgZeNhJ6y0wkOoTpg0AgFkUesV5bLCDs",
  authDomain: "twitter-imitate.firebaseapp.com",
  projectId: "twitter-imitate",
  storageBucket: "twitter-imitate.appspot.com",
  messagingSenderId: "53514958145",
  appId: "1:53514958145:web:c56d38db7879e70af81dc0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);