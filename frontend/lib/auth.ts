import "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  getAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBp-8XF9jgaaSD9OUZWuH_dGYDHaUBMikU",
  authDomain: "story-circle-ai.firebaseapp.com",
  projectId: "story-circle-ai",
  storageBucket: "story-circle-ai.appspot.com",
  messagingSenderId: "941991975458",
  appId: "1:941991975458:web:29705fc828a0a889c6887b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
