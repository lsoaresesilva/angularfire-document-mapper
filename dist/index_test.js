import { Usuario } from './usuario.js';
let usuarios = await Usuario.getAll();
console.log(usuarios);