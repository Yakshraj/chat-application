import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ChatServiceService } from 'src/app/service/client-service/chat-service.service';
var constant = require('src/app/constant/constant.json');

@Component({
  selector: 'app-admin-component',
  templateUrl: './admin-component.component.html',
  styleUrls: ['./admin-component.component.css']
})
export class AdminComponentComponent implements OnInit {

  username: any;
  searchedUser: any;
  message: any;
  errorMessage: any;
  messages = [];
  activeClients = [];
  socketId: any;
  temp = 0;
  newActiveClients = [];
  public broadcast_form: FormGroup;
  dataArray = [];
  userRole: any;
  allEmployees = [];
  isShow:Boolean = false;
  agentConnected:Boolean = false;
  isShowAgent = false;
  agentDetails: any;
  agentConnectionDetails:any;
  allAgents: any;
  showBroadcast: Boolean = false;
  showPrivate : Boolean = true;

  constructor(private chatService: ChatServiceService) {
    this.userRole = this.chatService.userRole;
    this.username = this.chatService.username;

    this.chatService.connectToadmin().subscribe(data => {
      this.agentConnected = true;
      this.agentConnectionDetails = JSON.parse(data);
      console.log(this.agentConnectionDetails)
     alert(this.agentConnectionDetails.name + " Wants To Connect You");
      
    })

    this.chatService.realAgentConnecting().subscribe(admin => {
      this.agentDetails = JSON.parse(admin)
      console.log(this.agentDetails);
        this.activeClients.splice(0,1);
        this.activeClients.push({name:this.agentDetails.agentConnected.name,id:this.agentDetails.agentConnected.id,count:0});
        this.chatService.setDetails({name:this.agentDetails.agentConnected.name,id:this.agentDetails.agentConnected.id});
    })

    if (this.userRole == 'employee') {
      this.activeClients.push({ name: "Agent", id: "agentId", count: 0 })
    }

    this.chatService.deleteDisconnected().subscribe(data => {
      this.agentConnected = false;
      this.chatService.addFreeAgent(this.username);
      for (let i = 0; i < this.activeClients.length; i++) {
        if (this.activeClients[i].name == data) {
          this.activeClients.splice(i, 1);
          this.getAllUsers();
        }
      }
    })
  }

  ngOnInit() {

    this.broadcast_form = new FormGroup({
      inputText: new FormControl()
    });
    this.defineRole()



    this.chatService.getMessage().subscribe((message: any) => {
      this.messages.push(JSON.parse(message));
    });



    this.chatService.getPrivateMessage().subscribe(data => {
      let message = JSON.parse(data);
      for (let i = 0; i < this.activeClients.length; i++) {
        if (this.activeClients[i].name == message.senderName) {
          this.activeClients[i].count++;
        }
      }
    });


  }

  show(){
    this.isShow = !this.isShow;
  }

  defineRole() {
    if (this.userRole == 'admin') {
      this.getAllUsers()
    }
    else {
      this.getActiveUsers()
    }
  }

  getAllAgents(){
    this.isShowAgent = !this.isShowAgent;
    this.chatService.getAllAgents().subscribe((data)=> {
        this.allAgents = JSON.parse(data);
        console.log(this.allAgents)
    });
  }

  checkFunction(checked, name) {
    this.chatService.checkBoxValue(checked, name);
  }

  sendMessage() {
    this.chatService.sendMessage(this.message, this.username);
    this.message = '';
  }

  gotoPrivateChatAdmin(userDetails, index) {
    this.temp = 1;
    this.activeClients[index].count = 0;
    this.chatService.setDetail(userDetails);
    this.showBroadcast = false;
    this.showPrivate = true;
  }

  spliceSelfname() {
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i].name == this.username) {
        this.dataArray.splice(i, 1);
      }
    }
  }
  getAllUsers() {
    this.chatService.getAllUsers((data) => {
      this.allEmployees = JSON.parse(data);
      console.log(this.allEmployees)
      this.getActiveUsers()
    })
  }

  getActiveUsers() {
    this.chatService.getActiveClients().subscribe(data => {
      this.dataArray = JSON.parse(data);
      if (this.userRole == 'employee') {
        this.spliceSelfname();
      }
      this.addMessageCounterToClient();
      if (this.userRole == 'admin') {
        for (let i = 0; i < this.activeClients.length; i++) {
          for (let j = 0; j < this.allEmployees.length; j++) {
            if (this.activeClients[i].name == this.allEmployees[j].name) {
              console.log(this.allEmployees)
              this.allEmployees.splice(j, 1);
            }
          }
        }
      }

    });
  }
  addMessageCounterToClient() {
    // for Client
    if (this.userRole == 'employee') {
      let j = 0;
      j = this.dataArray.length - 1;
      // if fresh start
      if (this.activeClients.length == 1) {
        for (let i = 0; i < this.dataArray.length; i++) {
          this.activeClients.push({ name: this.dataArray[i].name, id: this.dataArray[i].id, count: 0 });

        }
      }
      //if already started
      else if (this.activeClients.length == this.dataArray.length) {
        this.activeClients.push({ name: this.dataArray[j].name, id: this.dataArray[j].id, count: 0 });
      }
    }

    // for agent
    else {

      if (this.activeClients.length == 0) {
        for (let i = 0; i < this.dataArray.length; i++) {
          this.activeClients.push({ name: this.dataArray[i].name, id: this.dataArray[i].id, count: 0 });
        }
      }

      else if (this.activeClients.length < this.dataArray.length) {
        this.activeClients.push({ name: this.dataArray[this.dataArray.length - 1].name, id: this.dataArray[this.dataArray.length - 1].id, count: 0 });
      }
    }

  }

  searchUserName(username) {
    for (let i = 0; i < this.chatService.activeClients.length; i++) {
      if (this.chatService.activeClients[i].name === username) {
        this.searchedUser = this.chatService.activeClients[i];
        this.errorMessage = '';
      }
    }
    if (this.searchedUser == null) {
      this.errorMessage = constant.userNotFound;
    }
  }

  showBroadcastFunc() {
    this.showBroadcast = !this.showBroadcast;
    this.showPrivate = false;
  }

}
