# ChatApplication

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.19.


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
# angular-chat-application


## MongoDB
You required to install mongodb which has two collections named with users and another with name ChatMessages.

Run the Following queries :-

1.) use local

2.) db.users.insertOne({"name":"user1", "role":"employee"}) // Add users with role 'employee' \\ Create these default users with unique name.

3.) db.users.insertOne({"agent1":"user1", "role":"agents"}) // Add agents with role 'admin' \\ Create default agents with unique name.

#To Run Application

  1. Open the project folder in VsCode or IntelliJ.
  
  2. Open the Terminal and run `npm install` command.
  
  3. Navigate to server folder by `cd server` in the porject folder.
  
  4. Execute the command `node index.js` to run the server file index.js at 'http://localhost:3001'.
  
  5. Open another terminal for same project folder and  execute the command `npm start` to run the client side application at         'http://localhost:4200'.
  
  6.Now login with username of the  employees and agents to use chat-application.
