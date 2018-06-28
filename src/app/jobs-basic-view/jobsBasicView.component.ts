/**
 * Created by frdiaz on 02/12/2016.
 * Modified by mmariscalg on 22/06/2018.
 */

import {Component, Input, OnDestroy} from '@angular/core';
import { OnInit } from '@angular/core';
import { JobsBasicViewConfig } from './jobsBasicViewConfig';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { JenkinsService } from '../commons/jenkinsService.service';
import { Job } from '../job/job.model';
import { JobsBasicViewModel } from './jobsBasicView.model';
import { Subscription } from 'rxjs/Subscription';
import { ConfigPropService } from './../commons/configPropService';
import { SimpleJob } from '../job/simpleJob.model';
import { JobsGroup } from '../job/jobsGroup.model';
import { paramDictionary } from './../commons/paramDictionary';

@Component({
  selector: 'jobsBasicView',
  templateUrl: 'jobsBasicView.component.html',
  styleUrls: ['../app.component.css']
})

export class JobsBasicViewComponent implements OnInit, OnDestroy {

  @Input()
  urlJenkins: string;

  jobsModel: Job[] = [];
  private jobsModelEmail = [];
  private jobsModelEmailStarted = false;
  viewConfig: JobsBasicViewConfig;
  jobsViewSelected: JobsBasicViewModel;
  timer: Observable<number>;
  subscription: Subscription;
  private filteredJobsModel: Job[] = [];
  _listFilter = '';
  private params: paramDictionary = {};

  get listFilter(): string {
    return this._listFilter;
  }
  set listFilter(value: string) {
    this._listFilter = value;
    this.filteredJobsModel = this.listFilter ? this.performFilter(this.listFilter) : this.jobsModel;
  }

  constructor(private jenkinsService: JenkinsService, private _propService: ConfigPropService) {
    this.jobsViewSelected = new JobsBasicViewModel(undefined, 'No view selected jet.');
  }

  performFilter(filterBy: string): Job[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.jobsModel.filter((job: Job) =>
      job.name.toLocaleLowerCase().indexOf(filterBy) !== -1);
  }

  /**
   * Initializes the component. Load the initial configuration
   */
  ngOnInit() {
    this.viewConfig = new JobsBasicViewConfig();
  }

  ngOnDestroy() {
    console.log('Llamada a ngOnDestroy.');
    if ( !this.subscription != null) {
      console.log('Llamada a ngOnDestroy.');

      this.subscription.unsubscribe();
    }
  }

  async updateJobs (url: string) {
    this.jobsModel = await this.jenkinsService.getJobsStatus(url);
    this.filteredJobsModel = this.listFilter ? this.performFilter(this.listFilter) : this.jobsModel;
    this.params = this.jenkinsService.getJobsGroupsParam();
  }

  /**
   * Starts load of jobs status
   * @param url
   */
  public initLoadJobsStatus(url: string) {

    this.jenkinsService.reset();
    this.updateJobs(url);

    /* Starts the polling configuration */
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }

    this.timer = Observable.interval(this.viewConfig.pollingIntervalInMilSecond);
    this.subscription = this.timer
      .subscribe(() => {
        this.jenkinsService.reset();
        this.updateJobs(url);

        for (let entry of this.jobsModel) {
          if (entry instanceof JobsGroup) {
            let entryGroup = <JobsGroup>entry;
            for (let subentry of entryGroup.jobsList) {
              if (subentry.statusClass === 'failing') {
                if (this.jobsModelEmail.indexOf(subentry.name) === -1) {
                  if (this._propService.getEmail() && this.jobsModelEmailStarted) {
                    this.jenkinsService.sendEmailIfFail('New FAILURE: '
                    + subentry.name, 'JOB  ' + subentry.name + ' crashed'
                    + ((this.params[subentry.name]) === undefined ? '' : ' with next PARAMS: ' + (this.params[subentry.name]))
                    + '. Please, for further details visit: ' + subentry.urlJob, subentry.urlJob)
                      .subscribe(
                      response => response,
                      error => console.log(error)
                    );
                  }
                  console.log('New FAILURE: ' + subentry.name);
                  this.jobsModelEmail.push(subentry.name);
                }
              } else {
                if (this.jobsModelEmail.indexOf(subentry.name) !== -1) {
                  console.log('New Success: ' + subentry.name);
                  this.jobsModelEmail.splice(this.jobsModelEmail.indexOf(subentry.name), 1);
                }
              }
            }
          } else {
            let simpleEntry = <SimpleJob>entry;
            if (simpleEntry.statusClass === 'failing') {
              if (this.jobsModelEmail.indexOf(simpleEntry.name) === -1) {
                if (this._propService.getEmail() && this.jobsModelEmailStarted) {
                  this.jenkinsService.sendEmailIfFail('New FAILURE: '
                  + simpleEntry.name, 'JOB  ' + simpleEntry.name + ' crashed'
                  + ((this.params[simpleEntry.name]) === undefined ? '' : ' with next PARAMS: ' + (this.params[simpleEntry.name]))
                  + '. Please, for further details visit: ' + simpleEntry.urlJob, simpleEntry.urlJob)
                    .subscribe(
                    response => response,
                    error => console.log(error)
                  );
                }
                console.log('New FAILURE: ' + simpleEntry.name);
                this.jobsModelEmail.push(simpleEntry.name);
              }
            } else {
              if (this.jobsModelEmail.indexOf(simpleEntry.name) !== -1) {
                console.log('New Success: ' + simpleEntry.name);
                this.jobsModelEmail.splice(this.jobsModelEmail.indexOf(simpleEntry.name), 1);
              }
            }
          }
        }

        this.jobsModelEmailStarted = true;
    });
    /* Ends the polling configuration */
  }

  /**
   * Sets the number of columns to the view
   */
  setColumnsLayout(numColumnsSelected: number) {
    this.viewConfig.classColumn = 'columns-' + numColumnsSelected;
  }

  /**
   * Loads data of selected view.
   */
  loadViewSelected(jobsViewSelected: JobsBasicViewModel) {
    this.initLoadJobsStatus(jobsViewSelected.url);
    this.jobsViewSelected = jobsViewSelected;
  }

  /**
   * Changes value of polling interval and data reload
   */
  setPollingInterval(pollingIntervalInSec: number) {
    this.viewConfig.pollingIntervalInMilSecond = pollingIntervalInSec * 1000;
  }

  /**
   *
   * @param errorMesage
   */
  unsuscribePrevious(errorMesage: string) {
    if ( this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
  }
}
