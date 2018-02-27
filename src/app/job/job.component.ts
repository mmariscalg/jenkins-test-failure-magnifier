/**
 * Created by frdiaz on 12/12/2016.
 * Modified by mmariscalg on 27/02/2018.
 */

import { Component, Input, OnInit, EventEmitter } from '@angular/core';
import { SimpleJob } from './simpleJob.model';
import { Job } from './job.model';
import { JobsGroup } from './jobsGroup.model';
import { JobsBasicViewMenuConfig } from '../jobs-basic-view-menu-config/jobsBasicViewMenuConfig.model';
import { ConfigPropService } from './../commons/configPropService';

@Component({
  selector: 'job',
  templateUrl: './job.component.html'
})

export class JobComponent implements OnInit {

  @Input()
  jobModel: Job;

  hideOK: boolean;
  branches: boolean;

  constructor(private _propService: ConfigPropService) { }

  calculateProgres() {
  }

  ngOnInit() {
    this.hideOK = this._propService.getHideOK();
    this.branches = this._propService.getBranches();
  }

  isSimpleJob(job: Job) {
    if (job instanceof SimpleJob) {
      return true;
    }else if (job instanceof JobsGroup) {
      return false;
    }
  }

  errorAtLeastOne(jobGroup: JobsGroup) {
    let error = false;

    for ( let i = 0; i < jobGroup.jobsList.length; i++) {
      if (jobGroup.jobsList[i].result !== 'SUCCESS' && jobGroup.jobsList[i].result !== 'SUCCESS_') {
        error = true;
        break;
      }
    }
    return error;
  }
}
