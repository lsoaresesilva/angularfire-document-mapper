import { Document, Collection, oneToOne } from '../document';
import { AngularFirestore, AngularFirestoreModule } from '@angular/fire/firestore';
import { TestBed, inject } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { FirebaseConfiguracao } from 'src/environments/firebase';
import { DocumentModule } from '../document.module';
import { FireStoreDocument } from '../firestoreDocument';
import { Person } from '../models';
import { forkJoin } from 'rxjs';
import Query from '../query';

describe('Document testing', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
    TestBed.configureTestingModule({
      imports: [
        DocumentModule,
        AngularFireModule.initializeApp(FirebaseConfiguracao),
        AngularFirestoreModule, // .enablePersistence()
      ],
    });
    inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach((done) => {
    Person.deleteAll().subscribe((resultado) => {
      done();
    });
  });

  it('deve recuperar um objeto com @onetoOne', (done) => {
    @Collection('animais')
    class Animal extends Document {
      @oneToOne({ name: 'personId', type: Person })
      person: Person;
      name;
    }

    const p = new Person(null);
    const a = new Animal(null);
    a.name = 'Apu';
    a.person = p;
    console.log('animal');
    p.save().subscribe((person) => {
      a.save().subscribe((resultado) => {
        Animal.get(resultado.id).subscribe((animal) => {
          expect(animal['person'].pk()).toBe(person.id);
          done();
        });
      });
    });
  });

  it('deve criar um plain object a partir de um objeto javascript', () => {
    const p = new Person(null);
    p.name = 'Leonardo';
    expect(p.objectToDocument()).toEqual({ name: 'Leonardo' });
  });

  it('deve construir um objeto com a propriedade @oneToOne', () => {
    class Animal extends Document {
      @oneToOne({ name: 'personId', type: Person })
      person: Person;
      name;
    }

    const p = new Person('12345');
    const a = new Animal(null);
    a.name = 'Apu';
    a.person = p;
    expect(a.objectToDocument()).toEqual({ name: 'Apu', personId: '12345' });
  });

  it('deve criar um nome para a collection de uma classe', () => {
    const p = new Person(null);
    p.name = 'Leonardo';
    expect(p.constructor['__name']).toBe('person');
  });

  // TESTES DO SAVE
  // TODO: Migrar para um describe próprio

  it('deve falhar ao tentar salvar um Document sem nome de coleção', () => {
    class UmaClasse extends Document {}
    const c = new UmaClasse(null);

    expect(function () {
      c.save();
    }).toThrow();

    @Collection('outraclass')
    class OutraClasse extends Document {}

    const oc = new OutraClasse(null);
    expect(function () {
      oc.save();
    }).not.toThrow();
  });

  it('deve falhar ao tentar salvar um Document sem uma instância de AngularFireStore', () => {
    const p = new Person(null);
    p['db'] = null;
    expect(function () {
      p.save();
    }).toThrow();
  });

  it('deve salvar um documento', (done) => {
    const p = new Person(null);
    p.save().subscribe((result) => {
      expect(result.id).toBeDefined();
      done();
    });
  });

  it('deve carregar um document corretamente', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      Person.get(p.pk()).subscribe((resultado) => {
        expect(resultado instanceof Person).toBeTruthy();
        expect(resultado['id']).toBeTruthy();
        expect(resultado['id']).toBe(p.pk());
        expect(resultado['name']).toBe(p.name);
        done();
      });
    });
  });

  it('deve falhar ao carregar um documento sem informar o id', () => {
    expect(function () {
      Person.get(null);
    }).toThrow();
  });

  it('deve falhar ao tentar carregar um Document sem uma instância de AngularFireStore', () => {
    const getAngularFS = Person.getAngularFirestore;
    Person.getAngularFirestore = function () {
      return null;
    };

    expect(function () {
      Person.get(1);
    }).toThrow();

    Person.getAngularFirestore = getAngularFS;
  });

  it('deve falhar ao tentar carregar um Document sem nome de coleção', () => {
    const oldName = Person['__name'];
    Person['__name'] = null;

    expect(function () {
      Person.get(1);
    }).toThrow();

    Person['__name'] = oldName;
  });

  it('deve disparar um erro ao tentar carregar um documento que não existe', (done) => {
    Person.get(1).subscribe(
      (resultado) => {},
      (err) => {
        expect(err).toBeDefined();
        expect(err.message).toBe('Document not found.');
        done();
      }
    );
  });

  it('deve falhar ao tentar carregar todos os Documents sem uma instância de AngularFireStore', () => {
    const getAngularFS = Person.getAngularFirestore;
    Person.getAngularFirestore = function () {
      return null;
    };

    expect(function () {
      Person.getAll();
    }).toThrow();
    Person.getAngularFirestore = getAngularFS;
  });

  it('deve falhar ao tentar carregar todos os Document sem nome de coleção', () => {
    const oldName = Person['__name'];
    Person['__name'] = null;

    expect(function () {
      Person.getAll();
    }).toThrow();

    Person['__name'] = oldName;
  });

  it('deve retornar um array vazio para uma collection que não existe', (done) => {
    const oldName = Person['__name'];
    Person['__name'] = 'collectionInexistente';

    Person.getAll().subscribe((resultado) => {
      expect(resultado.length).toBe(0);
      Person['__name'] = oldName;
      done();
    });
  });

  it('deve carregar todos documents corretamente', (done) => {
    const p = new Person(null);
    p.name = 'Apu';
    p.save().subscribe((resultado) => {
      Person.getAll().subscribe((resultado) => {
        expect(resultado.length).toBe(1);
        done();
      });
    });
  });

  it('deve carregar todos documents corretamente a partir de uma query', (done) => {
    const p = new Person(null);
    p.name = 'Apu';
    p.save().subscribe((resultado) => {
      Person.getAll(new Query('name', '==', 'Apu')).subscribe((resultado) => {
        expect(resultado.length).toBe(1);
        done();
      });
    });
  });

  it('deve carregar todos documents corretamente a partir de uma query múltipla', (done) => {
    const p = new Person(null);
    p.name = 'Apu';
    p.idade = '4';

    p.save().subscribe((resultado) => {
      Person.getAll([new Query('name', '==', 'Apu'), new Query('idade', '==', '4')]).subscribe(
        (resultado) => {
          expect(resultado.length).toBe(1);
          expect(resultado[0]['name']).toBe('Apu');
          done();
        }
      );
    });
  });

  // Testes de delete

  it('deve falhar ao tentar deletar um document sem uma instância de AngularFireStore', (done) => {
    const getAngularFS = Person.getAngularFirestore;
    Person.getAngularFirestore = function () {
      return null;
    };

    expect(function () {
      Person.delete(1);
    }).toThrow();
    Person.getAngularFirestore = getAngularFS;
    done();
  });

  it('deve falhar ao tentar deletar um document sem sem nome de coleção', (done) => {
    const oldName = Person['__name'];
    Person['__name'] = null;
    expect(function () {
      Person.delete(1);
    }).toThrow();

    Person['__name'] = oldName;
    done();
  });

  it('deve retornar TRUE ao deletar um document', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      Person.delete(p.pk()).subscribe((resultado) => {
        expect(resultado).toBeTruthy();
        done();
      });
    });
  });

  // Testes de deleteAll

  it('deve falhar ao tentar deletar todos os Documents sem uma instância de AngularFireStore', (done) => {
    const getAngularFS = Person.getAngularFirestore;
    Person.getAngularFirestore = function () {
      return null;
    };

    expect(function () {
      Person.deleteAll();
    }).toThrow();
    Person.getAngularFirestore = getAngularFS;
    done();
  });

  it('deve retornar um contador = 0 para uma collection que não existe', (done) => {
    const oldName = Person['__name'];
    Person['__name'] = 'collectionInexistente';

    Person.deleteAll().subscribe((resultado) => {
      expect(resultado).toBe(0);
      Person['__name'] = oldName;
      done();
    });
  });

  it('deve falhar ao tentar deletar todos os Document sem nome de coleção', (done) => {
    const oldName = Person['__name'];
    Person['__name'] = null;

    expect(function () {
      Person.deleteAll();
    }).toThrow();
    Person['__name'] = oldName;
    done();
  });

  it('deve retornar um contador = 3 para três documentos que existíam e foram apagados', (done) => {
    // Fazer uma classe específica para isso

    @Collection('cars')
    class Car extends Document {
      name;

      constructor(id) {
        super(id);
      }
    }

    const c = new Car(null);
    c.name = 'l';

    const c2 = new Car(null);
    c2.name = 'a';

    const c3 = new Car(null);
    c3.name = 'd';
    forkJoin([c.save(), c2.save(), c3.save()]).subscribe((resultado) => {
      Car.deleteAll().subscribe((resultado) => {
        expect(resultado).toBe(3);
        done();
      });
    });
  });

  // INÍCIO DOS TESTES DE FIRESTORE DOCUMENT

  it('deve validar true para um firestore document válido', (done) => {
    try {
      const p = new Person(null);
      p.name = 'l';
      p.save().subscribe((resultado) => {
        const document: any = afs.doc<any>('person/' + resultado.id);
        document.get({ source: 'server' }).subscribe((result) => {
          const f = new FireStoreDocument(result);
          expect(f.validate(result)).toBeTruthy();
          done();
        });
      });
    } catch (e) {
      console.log(e);
    }
  });

  it('deve disparar um erro para um firestore document inválido/não existente', (done) => {
    const document: any = afs.doc<any>('ClassRoom/1234');
    document.get({ source: 'server' }).subscribe((result) => {
      expect(function () {
        const f = new FireStoreDocument(result);
      }).toThrow();
      done();
    });
  });

  it('deve construir um firestore document a partir de uma consulta no firestore', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      const document: any = afs.doc<any>(Person['__name'] + '/' + p.pk());
      document.get({ source: 'server' }).subscribe((result) => {
        const document = new FireStoreDocument(result);
        expect(document).toBeDefined();
        expect(document.id).toBe(p.pk());
        expect(document.data['name']).toBe('Leonardo');
        done();
      });
    });
  });

  it('deve retornar os dados presentes em um firestore document', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      const document: any = afs.doc<any>(Person['__name'] + '/' + p.pk());
      document.get({ source: 'server' }).subscribe((result) => {
        const document = new FireStoreDocument(result);
        const data = document.primitiveData();
        expect(data['id']).toBe(p.pk());
        expect(data['name']).toBe(p.name);
        done();
      });
    });
  });

  it('deve retornar null para um conjunto de propriedades inválidas', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      const document: any = afs.doc<any>(Person['__name'] + '/' + p.pk());
      document.get({ source: 'server' }).subscribe((result) => {
        const document = new FireStoreDocument(result);
        document.primitiveData = function () {
          return null;
        };
        /*expect(function () {
          document.toObject(Person.prototype)
        }).toThrow();*/
        document.toObject(Person.prototype).subscribe(
          (resultado) => {
            fail();
          },
          (err) => {
            done();
          }
        );
      });
    });
  });

  it('deve construir um objeto a partir de dados do firestore document', (done) => {
    const p = new Person(null);
    p.name = 'Leonardo';
    p.save().subscribe((resultado) => {
      const document: any = afs.doc<any>(Person['__name'] + '/' + p.pk());
      document.get({ source: 'server' }).subscribe((result) => {
        const document = new FireStoreDocument(result);
        document.toObject(Person.prototype).subscribe(
          (resultado) => {
            expect(resultado instanceof Person).toBeTruthy();
            expect(resultado['id']).toBeTruthy();
            expect(resultado['id']).toBe(p.pk());
            expect(resultado['name']).toBe(p.name);
            done();
          },
          (err) => {
            fail();
          }
        );
      });
    });
  });

  it('deve verificar se dois documents possuem nomes de collections diferentes', () => {
    expect(Person['__name']).toEqual('person');

    @Collection('outraclass')
    class OutraClasse extends Document {}

    expect(OutraClasse['__name']).toEqual('outraclass');
  });
  // FIM DOS TESTES DE FIRESTORE DOCUMENT
});
