/**
 * Created by frdiaz on 02/12/2016.
 * Modified by mmariscalg on 27/02/2018.
 */

import { Injectable, group, Input } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/Rx';
import { ConfigService } from './configService';
import { Job } from '../job/job.model';
import { JobsGroup } from '../job/jobsGroup.model';
import { SimpleJob } from '../job/simpleJob.model';
import { JobsBasicViewModel } from '../jobs-basic-view/jobsBasicView.model';
import { Observable } from 'rxjs/Rx';
import { ConfigGroup } from './configGroup';
import { ConfigPropService } from './configPropService';

@Injectable()
export class JenkinsService {

  private static readonly endJobsDataUrl: string = 'api/json?tree=jobs[name,url,buildable,lastBuild[*,actions[parameters[*]]]]';
  private static readonly endViewsUrl: string = 'api/json?tree=views[url,name],primaryView[url,name]';
  private headers = new Headers({});
  private invokedUrl: string;
  private resquestOptions: RequestOptions;
  private jobsGroupsFinded= {};
  private jobsGroupsNamesList: string[] = [];
  private jobsGroupsParam = new Map();
  private groups: ConfigGroup[] = [];
  private controlBranch = new Map();

  constructor(private http: Http, private configService: ConfigService, private configPropService: ConfigPropService) {}

  /**
   * Configures headers to invoke the server
   * @param authentication
   */
  configHeaders(authentication: boolean) {
    if (authentication) {
      this.headers = new Headers({});
      this.headers.append('Authorization', 'Basic ' + btoa(this.configService.getUser() + ':' + this.configService.getPass()));
    }
    this.headers.append('Content-Type', 'application/json');
    this.resquestOptions = new RequestOptions({
      headers: this.headers,
    })
  }

  /**
   * Retrieves the exists views in Jenkins
   * @param urlJenkins
   * @returns {Observable<R>}
   */
  getViews(urlJenkins: string) {
    let invokeUrl = (urlJenkins !== null && urlJenkins !== undefined && urlJenkins === this.configService.getJenkinsUrl()) ?
      urlJenkins : this.configService.getJenkinsUrl();
    invokeUrl = invokeUrl  + JenkinsService.endViewsUrl;
     console.log('Path:' + window.location.href);
    this.configHeaders((urlJenkins === null || urlJenkins === undefined || !window.location.href.includes(urlJenkins)));

    return this.http.post(invokeUrl, undefined, this.resquestOptions)
      .map(response => response.json())
      .catch((error: any) => Observable.throw(error.json().error || 'Server error'));
  }

  /**
   * Starts retrieving and formatting process of the Jobs State Data.
   * @param urlFolderOfJobs
   * @returns {Observable<R>}
   */
  getJobsStatus(urlFolderOfJobs: string) {
    this.jobsGroupsFinded = {};
    this.jobsGroupsNamesList = [];
    this.groups = [];
    this.jobsGroupsParam = new Map();

    if (urlFolderOfJobs === undefined) {
      this.invokedUrl = this.configService.getJenkinsUrl()  + JenkinsService.endJobsDataUrl;
    }else {
      this.invokedUrl = urlFolderOfJobs + JenkinsService.endJobsDataUrl;
    }
    return this.http.post(this.invokedUrl, undefined, this.resquestOptions)
      .map(response => this.createJobData(response.json().jobs))
      .catch((error: any) => Observable.throw(error.json().error || 'Server error'))
  }

  /**
   * Converts backend Jobs Objects in to frontend Jobs Objects
   * @param jobs
   */
  createJobData(jobs: any[]) {

    let jobModelAux: Job[] = [];

    for (let job of jobs){
      if (job !== null) {
        if (job.buildable === undefined) {
          this.getJobsStatus(job.url);
        }else {
          if (job.lastBuild !== null) {
              this.addJobToAGroup(job);
          }
        }
      }
    }
    for (let group of this.jobsGroupsNamesList){
      if (group === 'reminder' || this.jobsGroupsFinded[group].length === 0) {
        for (let job of this.jobsGroupsFinded[group]){
          let jobModel = new SimpleJob(job);
          jobModel.setStatusClass();
          jobModelAux.push((jobModel));
        }
      }else {
        let principalJobModel: JobsGroup = new JobsGroup();
        principalJobModel.name = group;
        for (let job of this.jobsGroupsFinded[group]){
          let jobModel = new SimpleJob(job);
          jobModel.setStatusClass();
          if (this.controlBranch.get(jobModel.name) !== undefined) {
            jobModel.master = this.controlBranch.get(jobModel.name);
            if (this.configPropService.getBranches() && jobModel.master !== '') {
              jobModel.result = 'SUCCESS_';
            }
          }
          if (jobModel.result !== 'SUCCESS') {
            if (this.jobsGroupsParam.has(jobModel.name)) {
              jobModel.param = this.jobsGroupsParam.get(jobModel.name);
            }
            principalJobModel.result = jobModel.result;
            console.log('GROUP JOB Result: ' + principalJobModel.name + ' - ' + principalJobModel.result);
          }
          principalJobModel.jobsList.push(jobModel);
        }
        principalJobModel.setStatusClass();
        jobModelAux.push((principalJobModel));
      }
    }
    return jobModelAux;

  }

  /**
   * Adds the job to the correct group, according to a job's parameter.
   * @param job
   */
  addJobToAGroup(job: any) {
    this.checkBranch(job.url).subscribe(
      (res) => {
        let control = '';
        for (let actionBranch of res) {
          if (actionBranch._class === 'hudson.plugins.git.util.BuildData') {
            if (actionBranch.lastBuiltRevision.branch[0].name.search(new RegExp('ORIGIN\/MASTER', 'i')) === -1) {
              control = actionBranch.lastBuiltRevision.branch[0].name;
            }
          }
        }
        this.controlBranch.set(job.name, control);
      },
      error => console.log(error)
    );
    for ( let action of job.lastBuild.actions) {
      if (action._class === undefined || action._class === 'hudson.model.ParametersAction') {
        if (action.parameters !== undefined) {
          let aux: string[] = [];
          let auxParams: string[] = [];
          for (let i = 0; i < action.parameters.length; i++) {
            aux[i] = action.parameters[i].name;
            auxParams[i] = action.parameters[i].value;
          }
          aux.sort();
          let auxName = this.createPrintableGroup(aux);
          let newGroup: ConfigGroup = {params: aux, id: auxName};
          if (this.groups.length === 0) {
            this.groups.push(newGroup);
          }else {
            let found = false;
            for (let i = 0; i < this.groups.length; i++) {
              if (this.groups[i].params.length === action.parameters.length && this.groups[i].id === auxName) {
                found = true;
                break;
              }
            }
            if (!found) {
              this.groups.push(newGroup);
            }
            if (this.jobsGroupsFinded[auxName] !== undefined) {
              this.jobsGroupsFinded[auxName].push(job);
            } else {
              this.jobsGroupsNamesList.push(auxName);
              this.jobsGroupsFinded[auxName] = [job];
            }
            let auxParamsValues = this.createPrintableParams(auxParams);
            if (!this.jobsGroupsParam.has(job.name)) {
              this.jobsGroupsParam.set(job.name, auxParamsValues);
            }
          }
        }else {
          if (this.jobsGroupsFinded['reminder'] !== undefined) {
            this.jobsGroupsFinded['reminder'].push(job);
          } else {
            this.jobsGroupsNamesList.push('reminder');
            this.jobsGroupsFinded['reminder'] = [job];
          }
        }
        break;
      }
    }
  }

  checkBranch (job: string) {
    let jobUrl = job + 'lastBuild/api/json?tree=actions[lastBuiltRevision[branch[name]]]';
    return this.http.get(jobUrl)
      .map(response => response.json().actions)
      .catch((error: any) => Observable.throw(error.json().error || 'Server error'))
  }

  createPrintableGroup (names: string[]) {
    let chain = '';
    for (let i = 0; i < names.length; i++) {
      if (i !== (names.length - 1)) {
        chain += names[i] + ' | ';
      }else {
        chain += names[i];
      }
    }
    return chain;
  }

  createPrintableParams (values: string[]) {
    let chain = '';
    for (let i = 0; i < values.length; i++) {
      if (i !== (values.length - 1)) {
        chain += 'VALUE= ' +  values[i] + ' | ';
      }else {
        chain += 'VALUE= ' +  values[i];
      }
    }
    return chain;
  }

  submitForm() {
    console.log('Sends form to the Server');
  }
}
