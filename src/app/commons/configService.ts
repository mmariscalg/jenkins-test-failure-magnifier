import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {ConfigModel} from './configModel';
import {isNullOrUndefined} from 'util';
/**
 * Created by frdiaz on 07/01/2017.
 */

@Injectable()
export class ConfigService {

  private _configModel: ConfigModel;

  constructor(private http: Http) {
  }

  /**
   * Load security configuration data from file
   * @returns {Promise<T>}
   */
  load() {
    console.log(window.location.toString());
    let rootUrl: string = window.location.pathname;
      return new Promise((resolve, reject) => {
        this.http.get('./assets/securityConfig.json')
          .map(res => res.json())
            .catch((error: any): any => {
              console.log('Deployed as plugin.');
              this._configModel = {'user': '', 'pass': '',
               'jenkinsUrl': 'http://localhost:8080/jenkins/', 'jenkinsPlugin': true};
              resolve();
        })
          .subscribe(data => {
            // Application run as standalone app
            this.fillConfigModel(data);
            resolve();
          });
      });
  }

  fillConfigModel(newConfig: any) {
    if (!isNullOrUndefined(newConfig)) {
      this._configModel = newConfig;
    }
    return this._configModel;
  }

  getUser() {
    return this._configModel.user;
  }

  getPass() {
    return this._configModel.pass;
  }

  getJenkinsUrl() {
    return this._configModel.jenkinsUrl;
  }

   get configModel(): ConfigModel {
    return this._configModel;
  }

  set configModel(value: ConfigModel) {
    this._configModel = value;
  }
}
