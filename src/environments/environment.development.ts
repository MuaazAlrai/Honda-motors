export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7001/api',
  persistence: 'localStorage' as 'localStorage' | 'api',
  firebase: {
    apiKey: "AIzaSyBUvZY3NGhCqbLOjez3uxamwpI1bjpmKyo",
  authDomain: "marimotors-4b5c6.firebaseapp.com",
  projectId: "marimotors-4b5c6",
  storageBucket: "marimotors-4b5c6.firebasestorage.app",
  messagingSenderId: "535643698494",
  appId: "1:535643698494:web:8544eae25d7c49502a686f",
  measurementId: "G-RHY12FZWJ2"
  },
  whatsapp: {
    defaultCountryCode: '92',
    businessName: 'Mari Motors'
  }
};
