import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject, observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ChatServiceService {

  private url = 'http://localhost:3001';
  private socket;
  activeClients = [];
  username: string;
  socketId: any;
  newActiveClients = [];
  allEmployees = [];
  checkClient = [];
  userRole: string;
  fetchdetails: any;
  receiverName: any;

  checkValue = new Subject();
  checkCurrentValue = this.checkValue.asObservable();
  
  private messageNotification = new Subject();
  currentNotification = this.messageNotification.asObservable();

  private messageSource = new Subject();
  currentMessage = this.messageSource.asObservable();

  private privateMessages = new Subject();
  newMessages = this.privateMessages.asObservable();



  constructor() {
    this.socket = io.connect(this.url);
  }
  public setDetails(details) {
    console.log(details);
    this.fetchdetails = {senderName: this.username, receiverName: details.name }
    this.fetchChatHistory();
    this.messageSource.next(details);
  }

  public setDetail(details){
    console.log(details);
    this.fetchdetails = { senderName: this.username, receiverName: details.name}
    this.getBotAndUserChat(details.name);
    this.messageSource.next(details);
  }

  public getBotAndUserChat(name){
    this.socket.emit('pass-chatbot-and-user-chat',name);
      this.socket.on('fetch-chatbot-and-user-chat',(botAndUserChat)=>{
        console.log("botAndUserChat")
         this.privateMessages.next(botAndUserChat);
      })  
  }

  public getAllAgents(){
    this.socket.emit('all-agents');
    return Observable.create((observer)=> {
      this.socket.on('get-all-agents',(agents)=>{
        observer.next(agents);
      })
    })
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

  fetchChatHistory() {
    console.log("In fetch Chat History")
    this.socket.emit('send-receiver-details', JSON.stringify(this.fetchdetails));
    this.socket.on('fetch-chat-history', (data) => {
      
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

  joinUser(username) {
    this.socket.emit('join', username);
  }

  getActiveClients(): Observable<any> {
    this.socket.emit('get-clients');
    return Observable.create((observer) => {
      this.socket.on('get-clients', (data: any) => {
        this.activeClients = JSON.parse(data);
        this.activeClients.push({ name: "Agent", id: "agentId", count: 0 })
        observer.next(data);
      })
    });
  }

  sendPrivateMessage(details) {
    this.socket.emit('private-message', JSON.stringify(details))
  }

  deleteDisconnected(): Observable<any> {
    return Observable.create((observer) => {
      this.socket.on('delete-map', (data: any) => {
        observer.next(data);
      })
    });
  }

  getAllUsers(callback) {
    this.socket.emit('get-all-users');
    this.socket.on('received-all-users', (allEmployees) => {
      callback(allEmployees)
    });

  }

  checkUser(username,callback){
    this.username=username;
    this.getActiveClients();
      let checkUser = {name:username,id:this.socket.id}
      this.socket.emit('check-user',JSON.stringify(checkUser))

      this.socket.on('duplicate',()=>{
        console.log("Duplicate Occurred")
        callback('duplicate')
      })
      this.socket.on('user-success', () => {
        this.joinUser(username)
        this.userRole = "employee";
        callback("success")
      });
      this.socket.on('failure', () => {
        callback("failure");
      });
      this.socket.on('admin-success', () => {
        this.joinUser(username)
        this.userRole = "admin"
        callback("admin")
      });
      this.socket.on('agent-success', () => {
        this.joinUser(username)
        this.userRole = "agent"
        callback("agent")
      });
  }
  
  
  // checkUser(username, callback) {
  //   this.username = username;
  //   let duplicateFlag = false;
  //   this.getActiveClients().subscribe(activeClients => {
  //     this.checkClient = JSON.parse(activeClients);
  //     console.log(this.checkClient)
  //     for (let i = 0; i < this.checkClient.length; i++) {
  //       if (this.checkClient[i].name == this.username) {
  //         duplicateFlag = true;
  //         callback("duplicate");
  //         break;
  //       }
  //     }
  //     if (duplicateFlag == false) {
  //       this.socket.emit('check-user', username);

        // this.socket.on('success', () => {
        //   this.joinUser(username)
        //   this.userRole = "employee";
        //   callback("success")
        // });
        // this.socket.on('failure', () => {
        //   callback("failure");
        // });
        // this.socket.on('admin-success', () => {
        //   this.joinUser(username)
        //   this.userRole = "admin"
        //   callback("admin")
        // })
    //   }
    // });
  // }

  addNewUSer(name, callback) {
    this.socket.emit('new-user', name);
    this.socket.on('add-new-user', () => {
      callback(true)
    });
    this.socket.on('user-exist', () => {
      callback(false);
    });
  }

  checkBoxValue(checked, name) {
    let userToggle = { checked: checked, name: name }
    this.checkValue.next(userToggle)
  }

  connectToadmin() : Observable<any>{
      return Observable.create((observer)=>{
        this.socket.on('connect-to-admin',(connectUser)=>{
        observer.next(connectUser)
      })
    }) 
  }

  realAgentConnecting(){
    return Observable.create((observer)=> {
      this.socket.on('real-admin-connecting', admin => {
        observer.next(admin);
      })
    })
  }

  public addFreeAgent(agent){
    this.socket.emit('add-free-agent',agent);
  }

  public sendFile(file, receiverName) {
    this.receiverName = receiverName;
    let data = file ;
    this.readThenSendFile(data);
    
  }
  readThenSendFile(data) {
    var username = this.username;
    var msg = <any>{};
    var reader = new FileReader();
    reader.onload = (evt) => {
      console.log(evt);
      msg.senderName = username;
      msg.receiverName = this.receiverName;
      msg.file = evt.target.result;
      msg.fileName = data.name;
      this.socket.emit('base64-string', msg);
    };
    reader.readAsDataURL(data);
  }

  public receiveFile() {
    return Observable.create(observer => {
      this.socket.on('base64-file', file => {
        observer.next(file);
        console.log(file)
      });
    });
  }
}
