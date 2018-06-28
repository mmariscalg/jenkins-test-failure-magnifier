/**
 * Created by mmariscalg on 27/02/2018.
 */

 import {Injectable} from '@angular/core';

@Injectable()
export class ConfigPropService {

  private hideOK: boolean;
  private branches: boolean;
  private email: boolean;

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

  getEmail() {
    return this.email;
  }

  setEmail(email: boolean) {
    this.email = email;
  }
}
