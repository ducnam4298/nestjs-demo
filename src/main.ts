import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppModule } from './app';
import { AccessInterceptor } from '@/access_control';
import { PORT } from '@/shared/constants';
import { corsOrigin } from '@/config';
import { LoggerService } from '@/logger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new AccessInterceptor());

    app.setGlobalPrefix('api');
    app.enableCors(corsOrigin);

    await app.listen(PORT);
    LoggerService.log(`🚀 Server is running on http://localhost:${PORT}/api`, 'Bootstrap');
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    LoggerService.error('❌ Error starting server', errorMessage);
    process.exit(1);
  }
}

void bootstrap();
