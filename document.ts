import { throws } from 'assert';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';

import { AppInjector } from './app-injector';
import { FireStoreDocument } from './firestoreDocument';
import Query from './query';
import * as firebase from 'firebase';

export function Collection(nome) {
    return function (target) {
        target.__name = nome;
        //target["__name"] = nome;
        Object.assign(target, {
            __name: nome
        });
    }
}

/**
 * Formato: name e type
 * @param data 
 */
export function oneToOne(data) {
    function actualDecorator(target, property: string | symbol): void {
        if (target.__oneToOne == undefined)
            Object.defineProperty(target, '__oneToOne', {
                value: [],
                writable: true,
                enumerable: true
            })

        target.__oneToOne.push({ property: property, foreignKeyName: data.name, type: data.type });
    }

    // return the decorator
    return actualDecorator;
}

export function ignore() {

    function actualDecorator(target, property: string | symbol): void {
        if (target.__ignore == undefined)
            Object.defineProperty(target, '__ignore', {
                value: [],
                writable: true,
                enumerable: true
            })

        target.__ignore.push(property);
    }

    // return the decorator
    return actualDecorator;
}

export function date() {

    function actualDecorator(target, property: string | symbol): void {
        if (target.__ignore == undefined)
            Object.defineProperty(target, '__date', {
                value: [],
                writable: true,
                enumerable: true
            })
        target.property = "";
        target.__date.push(property);
    }

    // return the decorator
    return actualDecorator;
}

/*
export function lazy() {

    function actualDecorator(target, property: string | symbol): void {
        if (target.__ignore == undefined)
                Object.defineProperty(target, '__lazy', {
                    value: [],
                    writable: true,
                    enumerable: true
                })
            target.property = "";
            target.__lazy.push(property);
   
    }

    return actualDecorator;
}


 * This class is used to intercept a call to an attribute. When a property is marked as @lazy they will be retrivied from document only when needed.
 *
class ExtendableProxy {
    constructor() {
        return new Proxy(this, {
            get: function(obj, prop, receiver) {
                if( obj["__lazy"] != undefined && obj[prop] == undefined){
                    let isLazy = false;
                    obj["__lazy"].forEach(property=>{
                        if(prop == property)
                            isLazy = true;
                    })
                    let func = obj["getLazy"]; 
                    if(isLazy && typeof func !== "undefined"){
                        let r = null;
                        let o = null;
                        return new Observable(observer=>{
                            o = observer;
                            obj["getLazy"]().subscribe(resultado=>{
                                observer.next(resultado);
                                observer.complete();
                            }, err=>{
                                observer.error(err);
                            });
                        }).subscribe(res=>{
                            o.next(res);
                            o.complete();
                        })
                        
                    }
                }
            
                return obj[prop];
            }
        });
    }
}*/

export class Document {

    db: AngularFirestore;

    constructor(protected id) {

        this.db = AppInjector.get(AngularFirestore);
        /*const settings = { experimentalForceLongPolling: true };
        this.db.firestore.app.firestore().settings( settings );*/
        
        this.constructDateObjects();

    }

    /**
     * @date annotation does not create date properties in Documents child's class. This method create those properties (empty as they will be populated when sent to database).
     */
    constructDateObjects() {
        if (this["__date"] != undefined && this["__date"].length > 0) {
            this["__date"].forEach(dateObject => {
                this[dateObject] = "";
            })
        }
    }

    static documentToObject(document) {

    }

    /**
     * Retrievies the primary key of this document.
     */
    pk() {
        return this.id;
    }

    objectToDocument() {
        let object = {}

        let x = Reflect.ownKeys(this);
        Reflect.ownKeys(this).forEach(propriedade => {
            let propriedadesIgnoradas = this["__ignore"];
            if (typeof this[propriedade] != "function"/* && typeof this[propriedade] != "object"*/) {
                if (this["__ignore"] == undefined || (this["__ignore"] != undefined && !this["__ignore"].includes(propriedade))) {
                    if (this["__date"] != undefined && this["__date"].includes(propriedade))
                        object[propriedade] = firebase.firestore.FieldValue.serverTimestamp();
                    else {
                        // aqui usar o __oneToOne
                        let tipo = typeof this[propriedade];
                        if (typeof this[propriedade] == "object") {
                            if (this["__oneToOne"] != undefined && this["__oneToOne"].length > 0) {

                                for (let i = 0; i < this["__oneToOne"].length; i++) {
                                    if (this["__oneToOne"][i].property == propriedade && typeof this[propriedade].pk === "function") {
                                        object[this["__oneToOne"][i].foreignKeyName] = this[propriedade].pk();
                                        break;
                                    }
                                }

                            }
                        } else {
                            object[propriedade] = this[propriedade]
                        }

                    }
                }


            }

        });

        if (this.id != undefined) {
            object["id"] = this.id;
        }

        return object
    }

    static getAngularFirestore() {
        return AppInjector.get(AngularFirestore);
    }

    static getByQuery(query) {
        return new Observable(observer => {
            this.getAll(query).subscribe(resultado => {
                if (resultado.length > 0) {
                    observer.next(resultado[0])
                    observer.complete();
                } else {
                    observer.error(new Error("Document not found."));
                }
            }, err => {
                observer.error(err);
            })
        })

    }

    /**
     * Get a document from collection.
     * @param id 
     * @returns Observable containing the document; or error if document does not exists.
     */
    static get(id) {

        if (id == null || id == undefined) {
            throw new Error("ID não posse ser vazio.");
        }

        let db = this.getAngularFirestore();

        Document.prerequisitos(this["__name"], db);

        return new Observable(observer => {
            let n = this["__name"];
            let document: any = db.doc<any>(this["__name"] + "/" + id);

            document.get({ source: "server" }).subscribe(result => {

                try {
                    /*let object = new FireStoreDocument(result).toObject(this["prototype"]);
                    observer.next(object);
                    observer.complete();*/
                    new FireStoreDocument(result).toObject(this["prototype"]).subscribe(resultado => {
                        let object = resultado;
                        observer.next(object);
                        observer.complete();
                    })
                } catch (e) {
                    observer.error(new Error("Document not found."));
                } finally {

                }
            })
        })
    }

    static buildCollection(db, collectionName, query) {

        let collection: any = db.collection(collectionName);

        if (query != null) {
            //collection = db.collection(collectionName, ref=>ref.where(query.column, query.operator, query.value));
            collection = db.collection(collectionName, ref => Query.build(ref, query));
        }

        return collection;
    }

    static getAll(query = null): Observable<any[]> {
        let db = this.getAngularFirestore();
        let objetos = []
        Document.prerequisitos(this["__name"], db);

        // TODO: migrar os códigos acima para dentro do observable, em um try/catch e no catch, em caso de erro, lançar um observer.error
        return new Observable(observer => {

            //let collection: any = this.buildCollection(db, this["__name"], null);
            let collection = this.buildCollection(db, this["__name"], query)


            collection.get({ source: "server" }).subscribe(resultados => {
                let consultas = []
                resultados.docs.forEach(document => {
                    consultas.push(new FireStoreDocument(document).toObject(this["prototype"]));
                    //objetos.push(new FireStoreDocument(document).toObject(this["prototype"]));
                });
                if (consultas.length > 0) {
                    forkJoin(consultas).subscribe(resultados => {
                        objetos = resultados;
                        observer.next(objetos);
                        observer.complete();
                    }, err=>{
                        observer.error(err);
                    })

                    
                } else {
                    observer.next(objetos);
                    observer.complete();
                }

            }, err => {
                observer.next(objetos);
                observer.complete();
            })
        })
    }

    static deleteAll() {
        let db = this.getAngularFirestore();
        Document.prerequisitos(this["__name"], db);

        return new Observable(observer => {

            let counter = 0;


            this.getAll().subscribe(resultados => {
                let documents = []
                resultados.forEach(documento => {
                    counter++;
                    documents.push(this.delete(documento.id))
                })

                if (documents.length > 0) {
                    forkJoin(documents).subscribe(resultado => {
                        observer.next(resultado.length);
                        observer.complete();
                    })
                } else {
                    observer.next(counter);
                    observer.complete();
                }



            })




        });
    }

    static delete(id) {
        let db = this.getAngularFirestore();
        Document.prerequisitos(this["__name"], db);

        return new Observable(observer => {

            let collection: AngularFirestoreCollection<any> = db.collection<any>(this["__name"]);
            collection.doc(id).delete().then(resultado => {

                observer.next(true);
                observer.complete();
            }).catch(err => {
                observer.next(false);
                observer.complete();
            });

        });
    }


    /**
     * Verifica se os pré-requisitos para execução de uma operação no Firestore estão sendo atendidos. Os pré-requisitos estabelecidos são: nome da collection e instância do AngularFirestore
     * @param __name nome da collection
     * @param db instância de AngularFirestore
     */
    static prerequisitos(__name, db) {

        if (__name == undefined || __name == null) {
            throw new Error("Não foi atribuído um nome para essa collection.");
        }

        if (db == undefined || db == null) {
            throw new Error("Não há uma instância de AngularFirestore.");
        }
    }

    save(): Observable<any> {
        Document.prerequisitos(this.constructor["__name"], this.db);

        let ___this = this;

        return new Observable(observer => {
            let document = ___this.objectToDocument();

            if (document["id"] != undefined) {
                let docRef = this.db.collection<any>(this.constructor["__name"]).doc(document["id"]);
                delete document["id"] // id cannot be in the document, as it isnt an attribute.
                docRef.update(document).then(result => {
                    observer.next(___this);
                    observer.complete();
                });
            } else {
                let collection: AngularFirestoreCollection<any> = this.db.collection<any>(this.constructor["__name"]);

                collection.add(document).then(result => {
                    ___this.id = result.id;
                    observer.next(___this);
                    observer.complete();
                });
            }

        });
    }



}