/**
 * Created by frdiaz on 14/12/2016.
 * Modified by mmariscalg on 27/02/2018.
 */

import {Job} from './job.model';

export class SimpleJob extends Job {

  public urlJobExecution: string;
  public lastExecTime: number;
  public displayLastExecNumber: string;
  public timestamp: Date;
  public urlJob: string;
  public param: string;
  public master: string;

  constructor(jobData: any) {
    super();
    this.name = jobData.name;
    this.urlJob = jobData.url;
    this.urlJobExecution = jobData.lastBuild.url;
    this.lastExecTime = jobData.lastBuild.duration;
    this.result = jobData.lastBuild.result;
    this.timestamp = new Date(jobData.lastBuild.timestamp);
    this.displayLastExecNumber = jobData.lastBuild.displayName;
    this.master = '';
  }
}
