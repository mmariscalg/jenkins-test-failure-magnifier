/**
 * Created by frdiaz on 20/12/2016.
 * Modified by mmariscalg on 27/02/2018.
 */

import {Component, Output, EventEmitter, Input, OnInit} from '@angular/core';
import { JobsBasicViewMenuConfig } from './jobsBasicViewMenuConfig.model';
import {JenkinsService} from '../commons/jenkinsService.service';
import {JobsBasicViewModel} from '../jobs-basic-view/jobsBasicView.model';
import {ConfigService} from '../commons/configService';
import {configServiceFactory} from '../commons/configServiceFactory';
import { ConfigPropService } from './../commons/configPropService';

@Component({
  selector: 'menu-config',
  templateUrl: './jobsBasicViewMenuConfig.component.html'
})

export class JobsBasicViewMenConfComponent implements OnInit {

  viewConfig: JobsBasicViewMenuConfig;
  toggleSettings = false;

  @Input()
  private urlJenkins: string;

  @Output()
  onSelectedView = new EventEmitter<JobsBasicViewModel>();

  @Output()
  onSelectNumColumn = new EventEmitter<number>();

  @Output()
  onSetPollingInterval = new EventEmitter<number>();

  @Output()
  onUnsuscribePrevious = new EventEmitter<string>();


  constructor(private jenkinsService: JenkinsService, private configService: ConfigService, private _propService: ConfigPropService) {}

  /**
   * Initialize the component. Load the initial configuration
   */
  ngOnInit() {
    this.loadViews();
  }

  loadViews() {
    console.log('URL JENKINS: ' + this.urlJenkins);
    if (this.viewConfig === undefined || this.viewConfig === null) {
      this.viewConfig = new JobsBasicViewMenuConfig();
      this.viewConfig.configuration = this.configService.configModel;
      console.log('New configuration:' + this.viewConfig.configuration.jenkinsUrl);
    }else {
      console.log('Previous Url:' + this.viewConfig.configuration.jenkinsUrl);
      this.urlJenkins = this.viewConfig.configuration.jenkinsUrl;
      this.viewConfig.views.splice(0, this.viewConfig.views.length);
    }

    this.jenkinsService.getViews(this.urlJenkins).subscribe(
      views => {
        for (let view of views.views){
          this.viewConfig.views.push(view);
          if (view.name === views.primaryView.name) {
            this.viewConfig.jobsViewSelected = view;
          }
        }

        this.viewConfig.configuration = this.configService.configModel;

        this.onSelectedView.next(this.viewConfig.jobsViewSelected);
      },
      error => { console.log(error);
        this.onUnsuscribePrevious.next('Connection error.');
        alert('Connection to Jenkins Fails. Check the connection settings.');
        this.toggleSettings = true;
      }
    );
  }

  loadViewSelected() {
    this.onSelectedView.next(this.viewConfig.jobsViewSelected);
  }

  setColumnsLayout() {
    this.onSelectNumColumn.next(this.viewConfig.numColSelected);
  }

  onSubmit() {
    this.configService.configModel = this.viewConfig.configuration;
    this.loadViews();
    this.onSetPollingInterval.next(this.viewConfig.pollingInterval);
    console.log('Change plugin configuration: ' + this.viewConfig.pollingInterval);
  }

  hideBuilds() {
    this._propService.setHideOK(this.viewConfig.hideOK);
    this.loadViews();
  }

  allNoMasterOK() {
    this._propService.setBranches(this.viewConfig.branches);
    this.loadViews();
  }
}
