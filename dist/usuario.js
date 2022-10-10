var _dec, _class;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { Document, Collection } from '../index.js';
export let Usuario = (_dec = Collection("usuarios"), _dec(_class = class Usuario extends Document {
  constructor(id, nome) {
    super(id);

    _defineProperty(this, "nome", void 0);

    this.nome = nome;
  }

}) || _class);