import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatServiceService } from '../../service/client-service/chat-service.service';
import { FormGroup, FormControl } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.css']
})
export class PrivateChatComponent implements OnInit {
  closePrivateComponent: any;
  htmlToAdd: any;
  file: any;
  downloadFileName: any;
  fileUrl: any;

  constructor(private chatService: ChatServiceService, private sanitizer:DomSanitizer) {
  }

  userData: any;
  username = this.chatService.username
  receivername: any;
  PrivateMessages=[];
  chatForm: FormGroup;
  displayMessage = [];
  currentUser: any;
  @ViewChild('file', {static: false}) private abc;

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
      //let name = this.chatService.fetchdetails.receiverName;
     //  if(tempMessage.senderName == name){
        this.PrivateMessages.push(tempMessage);    
    //  }
        
    });

    this.chatService.receiveFile().subscribe(file => {
      console.log((file.file));
      this.file = file;
    });
  }

  sendPrivateMessage(privateMessage) {
    this.chatForm.reset();
    let message = {senderName: this.chatService.username, receiverName: this.receivername, msg: privateMessage}
    console.log(message)
    this.PrivateMessages.push(message)
    this.chatService.sendPrivateMessage(message);

  }

  sendFile(file) {
    console.log(file);
    this.chatService.sendFile(file, this.receivername);
  }

 

}
