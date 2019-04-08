# Introduction

AngularFire Document Mapper is a library designed to reduce the AngularFire's boilplate code used to manipulate Firestore's database.
Every operation on database with AngularFire is a tedious and repetitive task. The aim of this project is to ease this process.

This project is based on the Active Record pattern (https://www.martinfowler.com/eaaCatalog/activeRecord.html), and uses a class to wrap CRUD operations. You just use this class in your project as a base class for your Document's Class which will be persisted on Firestore.

# Instalation

Clone the repository as a submodule to your Angular project: git submodule add https://github.com/lsoaresesilva/angularfire-document-mapper.git

# Usage

1. Create a class to represent a Firestore's Document and extends from Document

'''javascript

import {Document, Collection} from './angularfire-document-mapper/document';

@Collection("person") // collection's name
class Person extends Document{

  name;

  constructor(id, name){
    super(id); // must be called
    this.name = name;
  }

}
'''

2. Configure your Firebase account, install AngularFire2 and import AngularFirestore, AngularFireModule to your project's module, as suggested in: https://github.com/angular/angularfire2/blob/master/docs/install-and-setup.md

3. Run the library's tests: npm test

4. In your app.module or any other module, import DocumentModule:

'''javascript

import { DocumentModule } from './angularfire-document-mapper/document.module';


  imports: [
    DocumentModule,
   ]
'''

5. Use your Person's object insided a component:

@Component({})
class Component{

     constructor(){
     
        // to save:
     
        let person = new Person(null, "Leonardo");
        person.save().subscribe(savedPerson=>{
            // object saved with success.
        }, err=>{
            // error while saving 
        });
        
        // to get:
        
        Person.get("your-document-id").subscribe(aPerson=>{
            // aPerson is a instance of Person.
        })
        
        // to get all:
        
        Person.getAll().subscribe(listOfPersons=>{
            // listOfPersons is a array of Person.
        })
        
        // to get all with query. PS: should import Query.
        
        Person.getAll(new Query("name", "==", "Leonardo")).subscribe(listOfPersons=>{
            // listOfPersons is a array of Person.
        })
        
        // to delete
        
        Person.delete("your-document-id").subscribe(result=>{
            // result is a boolean with true if operation was success or false.
        })
        
        // to delete all
        
        Person.deleteAll().subscribe(count=>{
            // count represents the number of objects deleted
        })
     }
}
'''

6. It is also possible to work with relationships:

'''javascript

@Collection("dog")
class Dog extends Document{

    name;
    person:Person;
    
    constructor(id, person){
      super(id); // must be called
      this.person = person;
    }
    
    objectToDocument(){
      let document = super().objectToDocument();
      document["personId"] = this.person.pk(); // retrieves the primary key of Person.
    }
    

}

@Collection("persons")
class Person extends Document{

  name;

  constructor(id, name){
    super(id); // must be called
    this.name = name;
  }

}


@Component({})
class Component{

  constructor(){
    let p = new Person(null, "Leonardo");
    let d = new Dog(null, p);
    p.save().subscribe(result=>{
      // person is saved, lets save Dog.
      d.save().subscribe(dogResult=>{
        // dog is saved and has a column name personId with the person's ID.
      }) 
     })

}
'''
