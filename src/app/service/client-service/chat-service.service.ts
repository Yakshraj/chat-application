import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable,  Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ChatServiceService {

  private url = 'http://localhost:3001';
  private socket;
  activeClients = [];
  username: string;
  socketId: any;
  newActiveClients=[];
  allEmployees=[];
  checkClient=[];
  userRole:string;
  
  checkValue = new Subject();
  checkCurrentValue = this.checkValue.asObservable();
  fetchdetails:any;

  private messageNotification = new Subject();
  currentNotification = this.messageNotification.asObservable();

  private messageSource = new Subject();
  currentMessage = this.messageSource.asObservable();

  private privateMessages = new Subject();
  newMessages= this.privateMessages.asObservable();


  constructor() {
    this.socket = io.connect(this.url);
  }
  public setDetails(details) {
    console.log(details)

    this.fetchdetails ={senderName:this.username,receiverName:details.name}
    this.fetchChatHistory()
    this.messageSource.next(details);
  }

  public sendMessage(message: string, username: string) {
    let details = { name: username, msg: message }
    this.socket.emit('chat-message', JSON.stringify(details))
  }

  public getMessage() {
    return Observable.create((observer) => {
      this.socket.on('chat-message', (message: any) => {
        observer.next(message);
      })
    });
  }

  fetchChatHistory(){    
    console.log("In fetch Chat History")
    this.socket.emit('send-receiver-details',JSON.stringify(this.fetchdetails));
    this.socket.on('fetch-chat-history',(data)=>{
      this.privateMessages.next(data)
     
    });
    
  }
  getPrivateMessage() {
    return Observable.create((observer) => {
      this.socket.on('send-private-message', (message: any) => {
        observer.next(message);
      })
    });
  }



  joinUser(username){
    this.socket.emit('join', username);
  }

  getActiveClients(): Observable<any> {
    this.socket.emit('get-clients');

    return Observable.create((observer) => {
      this.socket.on('get-clients', (data: any) => {

        this.activeClients = JSON.parse(data);
        this.activeClients.push({name:"Agent",id:"agentId",count:0})
        observer.next(data);
      })
    });
  }

  sendPrivateMessage(details) {
    this.socket.emit('private-message', JSON.stringify(details))
  }

  deleteMap(): Observable<any>{
    return Observable.create((observer) => {
      this.socket.on('delete-map', (data: any) => {
        observer.next(data);

      })
    });
}

getAllUsers(callback){
   this.socket.emit('get-all-users');
    this.socket.on('received-all-users',(allEmployees) => {
      callback(allEmployees)
    });
  
}

checkUser(username,callback){
  this.username = username;
  let duplicateFlag = false;
  this.getActiveClients().subscribe(activeClients => {
    this.checkClient = JSON.parse(activeClients);
    console.log(this.checkClient)
    for(let i=0;i<this.checkClient.length;i++){
      if(this.checkClient[i].name == this.username){
          duplicateFlag = true;
          callback("duplicate");
          break;
      }
    }
    if(duplicateFlag == false){
      this.socket.emit('check-user',username);
  
    this.socket.on('success',()=> {
      this.joinUser(username)
      this.userRole="employee";
      callback("success")
    });
    this.socket.on('failure',()=> {
      callback("failure");
    });
    this.socket.on('admin-success',()=> {
      this.joinUser(username)
      this.userRole="admin"
      callback("admin")
    })
    }
  });
}

addNewUSer(name,callback){
    this.socket.emit('new-user',name);
    this.socket.on('add-new-user',()=> {
        callback(true)
    });
    this.socket.on('user-exist',()=> {
      callback(false);
    });
}

checkBoxValue(checked,name){
  let userToggle = {checked:checked,name:name}
  this.checkValue.next(userToggle)
}



}
