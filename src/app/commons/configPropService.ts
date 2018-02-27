/**
 * Created by mmariscalg on 27/02/2018.
 */

 import {Injectable} from '@angular/core';

@Injectable()
export class ConfigPropService {

  private hideOK: boolean;
  private branches: boolean;

  getHideOK() {
    return this.hideOK;
  }

  setHideOK(hideOK: boolean) {
    this.hideOK = hideOK;
  }

  getBranches() {
    return this.branches;
  }

  setBranches(branches: boolean) {
    this.branches = branches;
  }
}
