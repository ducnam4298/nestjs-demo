import { ThrottlerModuleOptions } from '@nestjs/throttler';

const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: 60,
    limit: 10,
  },
];

export default throttlerConfig;
