// Firebase configuration for GameBaazar
// Вставлено автоматически по конфигу из консоли Firebase

const firebaseConfig = {
  apiKey: "AIzaSyCB74VZbRIccb-1GsJFPpOvImtEggFlhOU",
  authDomain: "gamebazaar-4e055.firebaseapp.com",
  databaseURL: "https://gamebazaar-4e055-default-rtdb.firebaseio.com",
  projectId: "gamebazaar-4e055",
  storageBucket: "gamebazaar-4e055.firebasestorage.app",
  messagingSenderId: "208852148103",
  appId: "1:208852148103:web:084f1c812d8dcda389fd22"
};

// Экспорт для использования на страницах сайта
if (typeof window !== "undefined") {
  window.firebaseConfig = firebaseConfig;
}
