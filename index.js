import { Observable, forkJoin, Subject, observable } from "rxjs";
import { FirebaseConfig } from "./firebaseConfig.js";

import {
  doc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore/lite";

import { Doc } from "./doc.js";

export function Collection(nome) {
  return function (target) {
    target.__name = nome;
    // target["__name"] = nome;
    Object.assign(target, {
      __name: nome,
    });
  };
}

export function ignore() {
  function actualDecorator(target, property) {
    if (target.__ignore == undefined) {
      Object.defineProperty(target, "__ignore", {
        value: [],
        writable: true,
        enumerable: true,
      });
    }

    target.__ignore.push(property);
  }

  // return the decorator
  return actualDecorator;
}

export function date() {
  function actualDecorator(target, property) {
    if (target.__ignore == undefined) {
      Object.defineProperty(target, "__date", {
        value: [],
        writable: true,
        enumerable: true,
      });
    }
    target.property = "";
    if (target.__date != null) {
      target.__date.push(property);
    }
  }

  // return the decorator
  return actualDecorator;
}

export class FirestoreDocumentTesting {
  static records = new Map(); // An array composed of maps <Collection, ids[]> with the ids that were generated from a specific collection.
  
  static track(collectionName, id){
    if(this.records.get(collectionName) == null){
      this.records.set(collectionName, []);
    }

    this.records.get(collectionName).push(id);
  }

  static reset(){

  }
}

export class FirestoreDocument {
  doc; // Reference to the document
  __name = null;
  id;

  constructor(id) {
    this.id = id;
  }

  /**
   * Returns a single document based on a query
   * @param {*} query an instance of the DocMapQuery.
   * @param {*} orderBy
   */
  /* static getByQuery(query, orderBy = null) {
    return new Observable((observer) => {
      this.getAll(query, orderBy).subscribe(
        (resultado) => {
          if (resultado.length > 0) {
            observer.next(resultado[0]);
            observer.complete();
          } else {
            observer.next(null);
            observer.complete();
          }
        },
        (err) => {
          observer.error(err);
        }
      );
    });
  } */

  static async getAll(query = null, orderBy = null) {
    const objetos = [];
    let db = FirebaseConfig.getConnection();
    FirestoreDocument.prerequisitos(this["__name"], db);
    const querySnapshot = await getDocs(collection(db, this["__name"]));
    querySnapshot.forEach((doc) => {
      const i = 0;
      objetos.push(new Doc(doc).toObject(this["prototype"]));
    });

    return objetos;
  }

  static prerequisitos(__name, db) {
    if (__name == undefined || __name == null) {
      throw new Error("The object does not have a collection name. Did you forget to use the @Collection decorator?");
    }

    if (db == undefined || db == null) {
      throw new Error("There is no instance of Firestore. Did you forget to call the FirebaseConfig.init()?");
    }
  }

  /**
   * Called right before the instance is converted to Firestore document and saved in the database.
   */
  priorToSave() {}

  objectToDocument() {
    const object = {};

    const x = Reflect.ownKeys(this);
    Reflect.ownKeys(this).forEach((propriedade) => {
      const propriedadesIgnoradas = this["__ignore"];
      if (
        typeof this[propriedade] != "function" &&
        typeof this[propriedade] !=
          "undefined" /* && typeof this[propriedade] != "object"*/
      ) {
        if (
          this["__ignore"] == undefined ||
          (this["__ignore"] != undefined &&
            !this["__ignore"].includes(propriedade))
        ) {
          if (
            this["__date"] != undefined &&
            this["__date"].includes(propriedade)
          ) {
            object[propriedade] =
              firebase.firestore.FieldValue.serverTimestamp();
          } else {
            // aqui usar o __oneToOne
            const tipo = typeof this[propriedade];
            if (typeof this[propriedade] == "object") {
              if (
                this["__oneToOne"] != undefined &&
                this["__oneToOne"].length > 0
              ) {
                for (let i = 0; i < this["__oneToOne"].length; i++) {
                  if (
                    this["__oneToOne"][i].property == propriedade &&
                    typeof this[propriedade].pk === "function"
                  ) {
                    object[this["__oneToOne"][i].foreignKeyName] =
                      this[propriedade].pk();
                    break;
                  }
                }
              }
            } else {
              object[propriedade] = this[propriedade];
            }
          }
        }
      }
    });

    if (this.id != undefined) {
      object["id"] = this.id;
    }

    return object;
  }

  static async del(id) {
    let db = FirebaseConfig.getConnection();
    FirestoreDocument.prerequisitos(this["__name"], db);

    await deleteDoc(doc(db, this['__name'], id));
  }

  async save() {
    
    let db = FirebaseConfig.getConnection();
    FirestoreDocument.prerequisitos(this.constructor["__name"], db);

    const ___this = this;
    this.priorToSave();
    const fireDocument = ___this.objectToDocument();

    let id = null;
    if (fireDocument["id"] != undefined) {
      id = fireDocument["id"];
      delete fireDocument["id"]; // id cannot be in the document because it is not an attribute.
    }

    const docRef =
      id == null
        ? await addDoc(collection(db, this.constructor["__name"]), fireDocument)
        : await updateDoc(doc(db, this.constructor["__name"], id), fireDocument);

    if(FirebaseConfig.debug == true){
      FirestoreDocumentTesting.track(this.constructor["__name"], docRef.id);
    }

    ___this.id = docRef.id;

    return ___this;
  }
}
