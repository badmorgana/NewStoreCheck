// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCykwg0B0TUgi5h3qsahbH3OW8ZLnzUHjc",
  authDomain: "newstorecheck-bfe25.firebaseapp.com",
  projectId: "newstorecheck-bfe25",
  storageBucket: "newstorecheck-bfe25.firebasestorage.app",
  messagingSenderId: "657670539604",
  appId: "1:657670539604:web:6c2feb7edff8b744d220c1",
  measurementId: "G-2Y39VKHKW6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();