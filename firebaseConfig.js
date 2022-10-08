import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';


export class FirebaseConfig {

    static app;
    static db;

    static firebaseConfig;

    static getConnection(){
        if(this.app == null && this.db == null){
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
            }
            this.app = initializeApp(this.firebaseConfig);
            this.db  = getFirestore(this.app);
        }else{
            x = 2;
        }

        return this.db;
    }
}