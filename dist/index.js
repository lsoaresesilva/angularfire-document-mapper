function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { Observable, forkJoin, Subject, observable } from "rxjs";
import { FirebaseConfig } from "./firebaseConfig.js";
import { doc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore/lite';
import { FireStoreDocument } from './firestoreDocument.js';
export function Collection(nome) {
  return function (target) {
    target.__name = nome; // target["__name"] = nome;

    Object.assign(target, {
      __name: nome
    });
  };
}
export function ignore() {
  function actualDecorator(target, property) {
    if (target.__ignore == undefined) {
      Object.defineProperty(target, "__ignore", {
        value: [],
        writable: true,
        enumerable: true
      });
    }

    target.__ignore.push(property);
  } // return the decorator


  return actualDecorator;
}
export function date() {
  function actualDecorator(target, property) {
    if (target.__ignore == undefined) {
      Object.defineProperty(target, "__date", {
        value: [],
        writable: true,
        enumerable: true
      });
    }

    target.property = "";

    if (target.__date != null) {
      target.__date.push(property);
    }
  } // return the decorator


  return actualDecorator;
}
export class Document {
  // Reference to the document
  constructor(id) {
    _defineProperty(this, "doc", void 0);

    _defineProperty(this, "__name", null);

    _defineProperty(this, "id", void 0);

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
    Document.prerequisitos(this["__name"], db);

    try {
      const querySnapshot = await getDocs(collection(db, this["__name"]));
      querySnapshot.forEach(doc => {
        const i = 0;
        objetos.push(new FireStoreDocument(doc).toObject(this["prototype"]));
      });
      return objetos;
    } catch (error) {
      throw new Error(error);
    }

    return new Promise((resolve, reject) => {
      if (query == null) {}
    });
  }

  static prerequisitos(__name, db) {
    if (__name == undefined || __name == null) {
      throw new Error("Não foi atribuído um nome para essa collection.");
    }

    if (db == undefined || db == null) {
      throw new Error("Não há uma instância de AngularFirestore.");
    }
  }
  /**
   * Called right before the instance is converted to Firestore document and saved in the database.
   */


  priorToSave() {}

  objectToDocument() {
    const object = {};
    const x = Reflect.ownKeys(this);
    Reflect.ownKeys(this).forEach(propriedade => {
      const propriedadesIgnoradas = this['__ignore'];

      if (typeof this[propriedade] != 'function' && typeof this[propriedade] != 'undefined'
      /* && typeof this[propriedade] != "object"*/
      ) {
        if (this['__ignore'] == undefined || this['__ignore'] != undefined && !this['__ignore'].includes(propriedade)) {
          if (this['__date'] != undefined && this['__date'].includes(propriedade)) {
            object[propriedade] = firebase.firestore.FieldValue.serverTimestamp();
          } else {
            // aqui usar o __oneToOne
            const tipo = typeof this[propriedade];

            if (typeof this[propriedade] == 'object') {
              if (this['__oneToOne'] != undefined && this['__oneToOne'].length > 0) {
                for (let i = 0; i < this['__oneToOne'].length; i++) {
                  if (this['__oneToOne'][i].property == propriedade && typeof this[propriedade].pk === 'function') {
                    object[this['__oneToOne'][i].foreignKeyName] = this[propriedade].pk();
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
      object['id'] = this.id;
    }

    return object;
  }

  async save() {
    let db = FirebaseConfig.getConnection();
    Document.prerequisitos(this.constructor["__name"], db);

    const ___this = this;

    this.priorToSave();

    const document = ___this.objectToDocument();

    let id = null;

    if (document["id"] != undefined) {
      id = document["id"];
      delete document["id"]; // id cannot be in the document because it is not an attribute.
    }

    try {
      const docRef = id == null ? await addDoc(collection(db, this.constructor["__name"]), document) : await updateDoc(doc(db, this.constructor["__name"], id), document);
      return ___this;
    } catch (error) {
      throw new Error(error);
    }
    /* if (document["id"] != undefined) {
      const docRef = doc(db, this.constructor["__name"], document["id"]);
      
      
      docRef
        .update(document)
        .then((result) => {
          observer.next(___this);
          observer.complete();
        })
        .catch((err) => {
          observer.error(err);
        });
    } else {
      const collection = db.collection(this.constructor["__name"]);
       collection
        .add(document)
        .then((result) => {
          ___this.id = result.id;
          if (Document.isModoTeste) {
            let documentSalvo = {
              nomeColecao: this.constructor["__name"],
              id: result.id,
            };
          }
           observer.next(___this);
          observer.complete();
        })
        .catch((err) => {
          observer.error(err);
        });
    } */

  }

}