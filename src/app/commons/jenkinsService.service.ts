/**
 * Created by frdiaz on 02/12/2016.
 * Modified by mmariscalg on 22/06/2018.
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
import { FormsModule } from '@angular/forms';
import { paramDictionary } from './paramDictionary';

@Injectable()
export class JenkinsService {

  private static readonly endJobsDataUrl: string = 'api/json?tree=jobs[name,url,buildable,lastBuild[*,actions[parameters[*]]]]';
  private static readonly endViewsUrl: string = 'api/json?tree=views[url,name],primaryView[url,name]';
  private headers = new Headers({});
  private invokedUrl: string;
  private resquestOptions: RequestOptions;
  private jobsGroupsFinded= {};
  private jobsGroupsNamesList: string[] = [];
  private jobsGroupsParam: paramDictionary = {};
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
    });
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

  reset() {
    this.jobsGroupsFinded = {};
    this.jobsGroupsNamesList = [];
    this.groups = [];
    this.jobsGroupsParam = {};
  }

  /**
   * Starts retrieving and formatting process of the Jobs State Data.
   * @param urlFolderOfJobs
   * @returns {Observable<R>}
   */
  async getJobsStatus(urlFolderOfJobs: string): Promise<Job[]> {

    if (urlFolderOfJobs === undefined) {
      this.invokedUrl = this.configService.getJenkinsUrl()  + JenkinsService.endJobsDataUrl;
    }else {
      this.invokedUrl = urlFolderOfJobs + JenkinsService.endJobsDataUrl;
    }

    return await this.http.get(this.invokedUrl, this.resquestOptions)
    .map(response => {
      return this.createJobData(response.json().jobs);
    })
    .catch((error: any) => Observable.throw(error.json().error || 'Server error'))
    .toPromise();
  }

  /**
   * Converts backend Jobs Objects in to frontend Jobs Objects
   * @param jobs
   */
  async createJobData(jobs: any[]): Promise<Job[]> {

    let jobModelAux: Job[] = [];

    for (let job of jobs){
      if (job !== null) {
        if (job.buildable === undefined) {
          await this.getJobsStatus(job.url);
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
            if (this.jobsGroupsParam[jobModel.name] !== undefined) {
              jobModel.param = this.jobsGroupsParam[jobModel.name];
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
            let auxParamsValues: string = this.createPrintableParams(auxParams);
            if (this.jobsGroupsParam[job.name] === undefined) {
              this.jobsGroupsParam[job.name] = auxParamsValues;
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

  sendEmailIfFail (subject: String, content: String, job: String) {
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let options = new RequestOptions({ headers: headers });

    return this.http.post(job + 'send_mail/configSubmit',
      // tslint:disable-next-line:max-line-length
      'json= {"from": "JENKINS-TEST-FAILURE-MAGNIFIER", "to": "' + this.configService.getEmailList() + '", "addDev": true, "subject": "' + subject + '", "content": "' + content + '", "chooseTemplate": ""}',
      options)
      .map(response => response)
      .catch((error: any) => Observable.throw(error.json().error || 'Server error'));
  }

  submitForm() {
    console.log('Sends form to the Server');
  }

  getJobsGroupsParam () {
    return this.jobsGroupsParam;
  }
}
