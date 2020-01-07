import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatServiceService } from '../../service/client-service/chat-service.service';
import { FormGroup, FormControl } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.css']
})
export class PrivateChatComponent implements OnInit {

  constructor(private chatService: ChatServiceService) {
  }

  userData: any;
  username = this.chatService.username
  receivername: any;
  PrivateMessages=[];
  chatForm: FormGroup;
  displayMessage = [];
  currentUser: any;

  ngOnInit() {
    this.chatForm = new FormGroup({
      message: new FormControl()
    })

    this.chatService.currentMessage.subscribe(params => {
      this.userData = params
      console.log(this.userData)
      this.receivername = this.userData.name
      
    })

    this.chatService.newMessages.subscribe((data:any)=>{
      this.PrivateMessages=JSON.parse(data) ;
      console.log(this.PrivateMessages,"Messages Received");
    });
    
    console.log(this.PrivateMessages)
    this.chatService.getPrivateMessage().subscribe(data => {
      let tempMessage = JSON.parse(data);
      let name = this.chatService.fetchdetails.receiverName;
       if(tempMessage.senderName == name){
        this.PrivateMessages.push(tempMessage);    
      }
        
    });
  }

  sendPrivateMessage(privateMessage) {
    this.chatForm.reset();
    let message = {senderName: this.chatService.username, receiverName: this.receivername, msg: privateMessage}
    console.log(message)
    this.PrivateMessages.push(message)
    this.chatService.sendPrivateMessage(message);

  }

}
