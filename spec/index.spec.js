import { Collection, FirestoreDocument } from "../index.js";
import { FirebaseConfigData } from "../config/fb_config.js";
import { FirebaseConfig } from "../firebaseConfig.js";


class Person extends FirestoreDocument{
    
    name;
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

beforeEach(function() {
    FirebaseConfig.configData = null;
    FirebaseConfig.app = null;
    FirebaseConfig.db = null;
});

describe("Firemapper tests", ()=>{

    it("Should initialize a Firebase Configuration", ()=>{
        FirebaseConfig.init(FirebaseConfigData);
        expect(FirebaseConfig.configData).not.toBeNull();
    });

    it("Should fail without a valid firebase Configuration", ()=>{
        expect(function() {FirebaseConfig.init({})}).toThrowError();
    });

    it("Should fail because firestore was not initialized", async ()=>{
        let p = new Person();
        await expectAsync(p.save()).toBeRejected();
    });

    it("Should save an instance of the Person class", async ()=>{
        FirebaseConfig.init(FirebaseConfigData);
        let p = new Person();
        p.constructor.__name = "person";
        p.name = "Leonardo Soares";
        await expectAsync(p.save()).toBeResolved();
        expect(p.id).not.toBeNull();
        
    });

    it("Should get all documents from the person collection", async ()=>{
        FirebaseConfig.init(FirebaseConfigData);
        Person.__name = "person";
        let people = await Person.getAll();
        let p = new Person();
        p.constructor.__name = "person";
        p.name = "Leonardo Soares";
        await p.save();
        expect(people.length).toBeGreaterThan(0);
    });

    it("Should delete an document", async ()=>{
        FirebaseConfig.init(FirebaseConfigData);
        let p = new Person();
        p.constructor.__name = "person";
        p.name = "Leonardo Soares";
        await p.save();
        let people = await Person.getAll();
        expect(people.length).toBeGreaterThan(1);
        await expectAsync(Person.del(p.id)).toBeResolved();
        people = await Person.getAll();
        expect(people.length).toEqual(0); 
    });
})