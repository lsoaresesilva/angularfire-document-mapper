function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
export class FirebaseConfig {
  static getConnection() {
    if (this.app == null && this.db == null) {
      dotenv.config();
      /*  this.firebaseConfig = {
           apiKey: process.env.apiKey,
           authDomain: process.env.authDomain,
           databaseURL: process.env.databaseURL,
           projectId: process.env.projectId,
           storageBucket: process.env.storageBucket,
           messagingSenderId: process.env.messagingSenderId,
           appId: process.env.appId
       } */

      this.firebaseConfig = {
        apiKey: process.env.apiKey,
        authDomain: process.env.authDomain,
        databaseURL: process.env.databaseURL,
        projectId: process.env.projectId,
        storageBucket: process.env.storageBucket,
        messagingSenderId: process.env.messagingSenderId,
        appId: process.env.appId
      };
      this.app = initializeApp(this.firebaseConfig);
      this.db = getFirestore(this.app);
    } else {
      x = 2;
    }

    return this.db;
  }

}

_defineProperty(FirebaseConfig, "app", void 0);

_defineProperty(FirebaseConfig, "db", void 0);

_defineProperty(FirebaseConfig, "firebaseConfig", void 0);