import { Observable, forkJoin } from 'rxjs';

/**
 * Representação de um documento Firestore
 */
export class FireStoreDocument {

    id;
    data;

    /*protected constructor(id, data) {
        this.id = id;
        this.data = data
    }*/

    constructor(document) {
        if (this.validate(document)) {
            this.create(document);
        } else {
            throw new Error("O firestore document passado como parâmetro não é válido.");
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

        // Os códigos foram comentados, pois ao carregar um documento do Firestore, mesmo existindo, a variável exists está vindo false. Verificar o por que.
        if (document != null || document != undefined) {
            if (document.payload != undefined /*&& document.payload.exists != undefined && document.payload.exists == true*/ && (typeof document.payload.data == "function" || (document.payload.doc != undefined && typeof document.payload.doc.data == "function"))) {
                return true;
            }/*else if(typeof document.data == "function" && document._document != undefined){
                return true;
            }*/else if (document.exists != undefined && document.exists == true) {
                return true;
            }
        }


        return false;
    }

    toObject(prototype) {
        return new Observable(observer => {
            let primitiveData = this.primitiveData();

            if (primitiveData == null) {
                observer.error(new Error("Os dados primitivos de um document são inválidos."));
            }



            //

            //let x = Object.create(prototype, primitiveData);
            let x = Object.create(prototype);
            x.constructor();
            for (let key in primitiveData) {
                x[key] = primitiveData[key];
            }

            let consultas = []
            let propriedades = []
            // verificar as propriedades _oneToOne
            console.log(x["__oneToOne"]);
            //Reflect.ownKeys(x).forEach(propriedade => {
            if (x["__oneToOne"] != undefined && x["__oneToOne"].length > 0) {
                x["__oneToOne"].forEach(oneToOne => {
                    if(x[oneToOne.foreignKeyName] != undefined){
                        consultas.push(oneToOne.type.get(x[oneToOne.foreignKeyName])); // todo: if 
                        propriedades.push(oneToOne.property); // TODO: salvar também  otipo para fazer uma comparação no forkjoin abaixo
                    }
                })

                
            }

            if(consultas.length > 0){
                forkJoin(consultas).subscribe(resultados=>{
                    // TODO: comparar tamanho desse array com de propriedaedes, se for diferente, não prossegue. Significa que teve menos resultados localizados que a quantidade de propriedades
                    for(let i  = 0; i < resultados.length; i++){
                        x[propriedades[i]] = resultados[i];
                    }

                    observer.next(x);
                    observer.complete();
                }, err=>{
                    observer.error(err);
                })
            }else{
                observer.next(x);
                observer.complete();
            }
        })


        //})

        //return x;

    }

    primitiveData() {

        let properties = { id: this.id, ...this.data };
        /*properties['id'] = {
            value: this.id,
            writable: true,
            enumerable: true
        }*/

        //Object.defineProperties(properties, this.data);

        Reflect.ownKeys(this.data).forEach(element => {


            /*properties[element] = {
                value: this.data[element],
                writable: true,
                enumerable: true
            }*/

        });

        return properties;
    }

}