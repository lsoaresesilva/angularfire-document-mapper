import { AngularFirestore, AngularFirestoreModule } from "@angular/fire/firestore";

import { TestBed, inject } from "@angular/core/testing";

import { DocumentModule } from "../document.module";

import { AngularFireModule, FirebaseApp } from "@angular/fire";

import { FirebaseConfiguracao } from "src/environments/firebase";
import Query from '../query';

describe("Document testing", () => {

    let app: firebase.app.App;
    let afs: AngularFirestore;
  
  
    beforeAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
      TestBed.configureTestingModule({
        imports: [
          DocumentModule,
          AngularFireModule.initializeApp(FirebaseConfiguracao),
          AngularFirestoreModule//.enablePersistence()
        ]
      });
      inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {
  
        app = _app;
        afs = _afs;
      })();
  
    });

    it("should throw a error for a empty query array", ()=>{
        expect(function () {
            let r;
            afs.collection("usuarios", ref=>r = ref);
            Query.buildMultipleQuery(r, [])
          }).toThrow();
    })

    it("should generate a multiple query", ()=>{
        let q1 = new Query("id", "==", "2");
        let q2 = new Query("name", "==", "Leonardo");
        let r;
        
        afs.collection("usuarios", ref=>r = ref);
        let x = r.where("id", "==", "");
        let multipleQuery = Query.buildMultipleQuery(r, [q1, q2]);
        expect(multipleQuery["_query"]["filters"].length).toBe(2);
    })

});