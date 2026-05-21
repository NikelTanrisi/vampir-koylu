import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAv10FN3MKqMJvnnQCsVOlssE-IuRSgLZ8",
  authDomain: "vampir-koylu-kgt.firebaseapp.com",
  databaseURL: "https://vampir-koylu-kgt-default-rtdb.firebaseio.com",
  projectId: "vampir-koylu-kgt",
  storageBucket: "vampir-koylu-kgt.firebasestorage.app",
  messagingSenderId: "1044849017085",
  appId: "1:1044849017085:web:4ac759261fe4bc7f06be94",
  measurementId: "G-QFJ20SM62R"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
