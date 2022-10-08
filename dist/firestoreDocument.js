function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { Observable, forkJoin } from 'rxjs';
/**
 * Representação de um documento Firestore
 */

export class FireStoreDocument {
  /*protected constructor(id, data) {
        this.id = id;
        this.data = data
    }*/
  constructor(document) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "data", void 0);

    _defineProperty(this, "document", void 0);

    this.document = document;

    if (this.validate(document)) {
      this.create(document);
    } else {
      throw new Error('Firestore document passed as parameter is not valid.');
    }
  }

  create(document) {
    let id;
    let data;

    if (document.payload != undefined) {
      if (document.payload.doc == undefined) {
        data = document.payload.data();
        id = document.payload.id;
      } else {
        data = document.payload.doc.data();
        id = document.payload.doc.id;
      }
    } else {
      data = document.data();
      id = document.id;
    }

    this.id = id;
    this.data = data;
  }

  validate(document) {
    return true;
  }

  toObject(prototype) {
    let primitiveData = this.primitiveData();

    if (primitiveData == null) {
      throw new Error('Os dados primitivos de um document são inválidos.');
    }

    let x = Object.create(prototype);

    for (let key in primitiveData) {
      x[key] = primitiveData[key];
    }

    x["doc"] = this.document;
    return x;
  }

  primitiveData() {
    let properties = {
      id: this.id,
      ...this.data
    };
    return properties;
  }

}