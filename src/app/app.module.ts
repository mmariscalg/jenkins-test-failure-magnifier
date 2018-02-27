import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { AppComponent } from './app.component';
import { JobsBasicViewComponent } from './jobs-basic-view/jobsBasicView.component';
import { JenkinsService } from './commons/jenkinsService.service';
import { JobComponent } from './job/job.component';
import { JobsBasicViewMenConfComponent } from './jobs-basic-view-menu-config/jobsBasicViewMenuConfig.component';
import { ConfigService } from './commons/configService';
import { configServiceFactory } from './commons/configServiceFactory';
import { ConfigPropService } from './commons/configPropService';

@NgModule({
  declarations: [
    AppComponent,
    JobsBasicViewComponent,
    JobComponent,
    JobsBasicViewMenConfComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    JsonpModule
  ],
  providers: [
    ConfigService, {
      provide: APP_INITIALIZER, useFactory: configServiceFactory,
      deps: [ConfigService], multi: true
    },
    JenkinsService,
    ConfigPropService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
