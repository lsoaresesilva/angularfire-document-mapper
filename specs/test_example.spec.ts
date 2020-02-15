import { inject, TestBed } from "@angular/core/testing";
import { AngularFirestore } from '@angular/fire/firestore';
import { Document } from '../document';
import { DocumentModule } from '../document.module';
import { AngularFireModule } from '@angular/fire';

describe("Example of testing", ()=>{


    /*beforeAll(()=>{
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
    })*/

    it("Bla", done=>{
        inject( [AngularFirestore], ( afs ) => {
            afs.constructor = function(){
                console.log("Chamou");
            }
            class p extends Document{

            }

            let x:p = new p(null);
            done();
            //spyOn( afs, 'AngularFirestore' ).and.returnValue( of( [] ) );
        })
    })
})