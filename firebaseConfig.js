import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';


export class FirebaseConfig {

    static app;
    static db;

    static configData;
    static debug;

    static init(config, debug = false){
        if(config == null || config.apiKey == null ||
           config.authDomain == null ||
           config.projectId == null ||
           config.appId == null){
            throw new Error("Missing a complete Firebase configuration.");
           }

           this.debug = debug;

           this.configData = {
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
/*             storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId, */
            appId: config.appId
        }
        
    }

    static getConnection(){
        if(this.configData == null){
            throw new Error("It is not possible to initiate a Firebase connection without a Firebase Configuration. Please, call init method first.")
        }

        if(this.app == null && this.db == null){
            this.app = initializeApp(this.configData);
            this.db  = getFirestore(this.app);
        }

        return this.db;
    }
}