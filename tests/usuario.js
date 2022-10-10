import {Document, Collection} from '../index.js';

@Collection("usuarios")
export class Usuario extends Document{

    nome;

    constructor(id, nome){
        super(id);
        this.nome = nome;
    }
}