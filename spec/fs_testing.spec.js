import { Collection, FirestoreDocument, FirestoreDocumentTesting } from "../index.js";
import { FirebaseConfigData } from "../config/fb_config.js";
import { FirebaseConfig } from "../firebaseConfig.js";


class Person extends FirestoreDocument{
    
    name;
}

describe("Firemapper tests", ()=>{

    it("Should increment the record of saved documents", async ()=>{
        FirebaseConfig.init(FirebaseConfigData, true);
        let p = new Person();
        p.constructor.__name = "person";
        p.name = "Leonardo Soares";
        await p.save();

        expect(FirestoreDocumentTesting.records.get("person").length).toBe(1);
    });

});