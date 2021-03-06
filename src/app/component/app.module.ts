import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule,ReactiveFormsModule  } from '@angular/forms'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClientComponentComponent } from './client-component/client-component.component';
import { HttpClientModule } from '@angular/common/http';
import { PrivateChatComponent } from './private-chat/private-chat.component';
import { RouterModule } from '@angular/router';
import { LoginComponentComponent } from './login-component/login-component.component';
import { RegistrationComponent } from './registration/registration.component';
import { AdminComponentComponent } from './admin-component/admin-component.component';




@NgModule({
  declarations: [
    AppComponent,
    ClientComponentComponent,
    PrivateChatComponent,
    LoginComponentComponent,
    RegistrationComponent,
    AdminComponentComponent,


  
  ],
  imports: [
    RouterModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
   
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
