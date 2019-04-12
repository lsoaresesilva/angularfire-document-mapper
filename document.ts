import { throws } from 'assert';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';

import {AppInjector} from './app-injector';
import { FireStoreDocument } from './firestoreDocument';
import Query from './query';
import * as firebase from 'firebase';

export function Collection(nome){
    return function(target){
        target.__name = nome;
        //target["__name"] = nome;
        Object.assign(target, {
            __name:nome
        });
    }
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

export class Document{

    db:AngularFirestore;

    constructor(protected id){
        this.db = AppInjector.get(AngularFirestore);
        this.constructDateObjects();
    }

    /**
     * @date annotation does not create date properties in Documents child's class. This method create those properties (empty as they will be populated when sent to database).
     */
    constructDateObjects(){
        if(this["__date"] != undefined && this["__date"].length > 0){
            this["__date"].forEach(dateObject=>{
                this[dateObject] = "";
            })
        }
    }

    static documentToObject(document){
        
    }

    /**
     * Retrievies the primary key of this document.
     */
    pk(){
        return this.id;
    }

    objectToDocument(){
        let object = {}

        let x =  Reflect.ownKeys(this);
        Reflect.ownKeys(this).forEach(propriedade => {
            let propriedadesIgnoradas = this["__ignore"];
            if (typeof this[propriedade] != "function" && typeof this[propriedade] != "object"){
                if( this["__ignore"] == undefined || (this["__ignore"] != undefined && !this["__ignore"].includes(propriedade))){
                    if(this["__date"] != undefined && this["__date"].includes(propriedade))
                        object[propriedade] = firebase.firestore.FieldValue.serverTimestamp();
                    else{
                        object[propriedade] = this[propriedade]
                    }
                }
                
                
            }
                
        });

        return object
    }

    static getAngularFirestore(){
        return AppInjector.get(AngularFirestore);
    }

    static get(id){
        
        if(id == null || id == undefined){
            throw new Error("ID não posse ser vazio.");
        }

        let db = this.getAngularFirestore();
        
        Document.prerequisitos(this["__name"], db);

        return new Observable(observer=>{
            let document: any = db.doc<any>(this["__name"] + "/" + id);
        
            document.get({ source: "server" }).subscribe(result => {

                try {
                    let object = new FireStoreDocument(result).toObject(this["prototype"]);
                    observer.next(object);
                    observer.complete();
                } catch (e) {
                    observer.error(e);
                } finally {

                }
            })
        })
    }

    static buildCollection(db, collectionName, query:Query){
        
        let collection: any = db.collection(collectionName);
        
        if(query != null){
            collection = db.collection(collectionName, ref=>ref.where(query.column, query.operator, query.value));
            
        }

        return collection;
    }

    static getAll(query:Query=null):Observable<any[]>{
        let db = this.getAngularFirestore();
        let objetos = []
        Document.prerequisitos(this["__name"], db);

        // TODO: migrar os códigos acima para dentro do observable, em um try/catch e no catch, em caso de erro, lançar um observer.error
        return new Observable(observer=>{
            
            //let collection: any = this.buildCollection(db, this["__name"], null);
            let collection = this.buildCollection(db, this["__name"], query)


            collection.get({ source: "server" }).subscribe(resultados => {
                resultados.docs.forEach(document => {
                    objetos.push(new FireStoreDocument(document).toObject(this["prototype"]));
                });

                observer.next(objetos);
                observer.complete();
            }, err=>{
                observer.next(objetos);
                observer.complete();
            })
        })
    }

    static deleteAll(){
        let db = this.getAngularFirestore();
        Document.prerequisitos(this["__name"], db);

        return new Observable(observer=>{
            
            let counter = 0;
            
            
            this.getAll().subscribe(resultados=>{
                let documents = []
                resultados.forEach(documento=>{
                    counter++;
                    documents.push(this.delete(documento.id))
                })

                if(documents.length > 0 ){
                    forkJoin(documents).subscribe(resultado=>{
                        observer.next(resultado.length);
                        observer.complete();
                    })
                }else{
                    observer.next(counter);
                    observer.complete();
                }


                
            })

            
            
            
        });
    }

    static delete(id){
        let db = this.getAngularFirestore();
        Document.prerequisitos(this["__name"], db);

        return new Observable(observer=>{
            
            let collection: AngularFirestoreCollection<any> = db.collection<any>(this["__name"]);
            collection.doc(id).delete().then(resultado=>{
                
                observer.next(true);
                observer.complete();
            }).catch(err=>{
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
    static prerequisitos(__name, db){

        if(__name == undefined || __name == null){
            throw new Error("Não foi atribuído um nome para essa collection.");
        }

        if(db == undefined || db == null){
            throw new Error("Não há uma instância de AngularFirestore.");
        }
    }

    save():Observable<any>{
        Document.prerequisitos(this.constructor["__name"], this.db);

        let ___this = this;
        let collection: AngularFirestoreCollection<any> = this.db.collection<any>(this.constructor["__name"]);
        return new Observable(observer=> {
            collection.add(___this.objectToDocument()).then(result => {
                ___this.id = result.id;
                observer.next(___this);
                observer.complete();
            });
        });
    }

    

}