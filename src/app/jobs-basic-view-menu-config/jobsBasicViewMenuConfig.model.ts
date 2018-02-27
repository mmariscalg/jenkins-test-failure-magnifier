/**
 * Created by frdiaz on 15/12/2016.
 * Modified by mmariscalg on 27/02/2018.
 */

import {JobsBasicViewModel} from '../jobs-basic-view/jobsBasicView.model';
import {ConfigModel} from '../commons/configModel';

export class JobsBasicViewMenuConfig {

  views: JobsBasicViewModel[] = [];
  jobsViewSelected: JobsBasicViewModel;
  numColSelected = 1;
  combNumColumns: number [] = [1, 2, 3, 4, 5, 6, 7, 8];
  pollingInterval= 5;
  hideOK = false;
  branches = false;
  configuration: ConfigModel = {'user': 'monitor-pro', 'pass': '', 'jenkinsUrl': 'http://localhost:8080/jenkins/', 'jenkinsPlugin': false}
}
