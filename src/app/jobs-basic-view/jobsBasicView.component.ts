/**
 * Created by frdiaz on 02/12/2016.
 */

import {Component, Input, OnDestroy} from '@angular/core';
import { OnInit } from '@angular/core';
import { JobsBasicViewConfig } from './jobsBasicViewConfig';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import {JenkinsService} from '../commons/jenkinsService.service';
import {Job} from '../job/job.model';
import {JobsBasicViewModel} from './jobsBasicView.model';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'jobsBasicView',
  templateUrl: 'jobsBasicView.component.html',
  styleUrls: ['../app.component.css']
})

export class JobsBasicViewComponent implements OnInit, OnDestroy {

  @Input()
  urlJenkins: string;

  jobsModel: Job[] = [];
  viewConfig: JobsBasicViewConfig;
  jobsViewSelected: JobsBasicViewModel;
  timer: Observable<number>;
  subscription: Subscription;

  constructor(private jenkinsService: JenkinsService) {
    this.jobsViewSelected = new JobsBasicViewModel(undefined, 'No view selected jet.');
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

  /**
   * Starts load of jobs status
   * @param url
   */
  public initLoadJobsStatus(url: string) {

    this.jenkinsService.getJobsStatus(url).subscribe(
      jobsModelAux => this.jobsModel = jobsModelAux,
      error => console.log('Error retriving data')
    );

    /* Starts the polling configuration */
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }

    this.timer = Observable.interval(this.viewConfig.pollingIntervalInMilSecond);
    this.subscription = this.timer
      .subscribe(() => {
        this.jenkinsService.getJobsStatus(url).subscribe(
          jobsModelAux => this.jobsModel = jobsModelAux,
          error => console.log('Error retriving data')
        );
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
