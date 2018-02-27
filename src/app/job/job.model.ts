/**
 * Created by frdiaz on 30/12/2016.
 * Modified by mmariscalg on 27/02/2018
 */

export abstract class Job {

  private _name: string;
  public result: string;
  public statusClass = 'basic project widget unknown';

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  /**
   * Changes the value of the statusClass attribute to set the Job's style class
   */
  setStatusClass() {
    switch (this.result) {
      case 'SUCCESS':
        this.statusClass = 'successful';
        break;
      case 'SUCCESS_':
        this.statusClass = 'successful';
        break;
      case 'FAILURE':
        this.statusClass = 'failing';
        break;
      case 'UNSTABLE':
        this.statusClass = 'unstable';
        break;
      case 'ABORTED':
        this.statusClass = 'aborted';
        break;
      case 'DISABLED':
        this.statusClass = 'disabled';
        break;
      default:
        this.statusClass = 'unknown';
    }
  }

  /**
   * Returns a map with the jobs's styles classes
   * @returns {{basic: boolean, project: boolean, widget: boolean, unknown: boolean, failing: boolean,
   *  successful: boolean, unstable: boolean, aborted: boolean, disabled: boolean}}
   */
  getClasses() {
    return {
      basic: true,
      project: true,
      widget: true,
      unknown: this.statusClass === 'unknown',
      failing: this.statusClass === 'failing',
      successful: this.statusClass === 'successful',
      unstable: this.statusClass === 'unstable',
      aborted: this.statusClass === 'aborted',
      disabled: this.statusClass === 'disabled'
    };
  }
}
