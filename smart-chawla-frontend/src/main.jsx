import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // ১. ইমপোর্ট করুন
import { store } from './redux/store';   // ২. স্টোর ইমপোর্ট করুন
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ৩. অ্যাপকে প্রোভাইডার দিয়ে মুড়িয়ে দিন */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);