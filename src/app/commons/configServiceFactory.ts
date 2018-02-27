/**
 * Created by frdiaz on 10/02/2017.
 */

import { ConfigService } from './configService';

export function configServiceFactory(configurationService: ConfigService) {
  return () => configurationService.load();

}
