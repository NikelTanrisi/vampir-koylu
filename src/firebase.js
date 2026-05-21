// src/firebase.js
// BURAYA KENDİ FİREBASE BİLGİLERİNİ YAZACAKSIN (kurulum rehberinde anlatılıyor)
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "SENIN_API_KEY",
  authDomain: "SENIN_PROJECT.firebaseapp.com",
  databaseURL: "https://SENIN_PROJECT-default-rtdb.firebaseio.com",
  projectId: "SENIN_PROJECT",
  storageBucket: "SENIN_PROJECT.appspot.com",
  messagingSenderId: "SENIN_SENDER_ID",
  appId: "SENIN_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
