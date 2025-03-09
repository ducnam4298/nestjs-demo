import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '@/all-exceptions.filter';
import { AppModule } from '@/app';
import { AccessInterceptor } from '@/access_control';
import { corsOrigin } from '@/config';
import { LoggerService } from '@/services';
// import { CleanQueryInterceptor } from '@/interceptors';

const handleShutdown = (app: INestApplication) => {
  return () => {
    LoggerService.warn(
      `🚨 Received shutdown signal at ${new Date().toISOString()}. Closing application gracefully...`
    );
    app
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        const errorMessage =
          error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        const errorStack = error instanceof Error ? error.stack : String(error);
        LoggerService.error('❌ Error during shutdown', errorMessage);
        LoggerService.debug(errorStack);
        process.exit(1);
      });
  };
};

const bootstrap = async () => {
  try {
    LoggerService.log('🚀 Bootstrapping NestJS app...', 'Bootstrap');
    const app = await NestFactory.create(AppModule);

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    );
    app.useGlobalInterceptors(new AccessInterceptor());
    // app.useGlobalInterceptors(new AccessInterceptor(), new CleanQueryInterceptor());

    app.setGlobalPrefix('api');
    app.enableCors(corsOrigin);
    app.enableShutdownHooks();

    const configService = app.get(ConfigService);
    const PORT = configService.get<number>('PORT', { infer: true }) ?? 3000;
    await app.listen(PORT);
    LoggerService.log(`🚀 Server running on http://localhost:${PORT}/api`, 'Bootstrap');

    ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, handleShutdown(app)));

    process.on('SIGINT', handleShutdown(app));
    process.on('SIGTERM', handleShutdown(app));
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const errorStack = error instanceof Error ? error.stack : String(error);
    LoggerService.error('❌ Error starting server', errorMessage);
    LoggerService.debug(errorStack);

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('database')) {
      LoggerService.warn('🔄 Database connection failed. Retrying in 5 seconds...');
      setTimeout(() => void bootstrap(), 5000);
    } else {
      LoggerService.error('❌ Critical error occurred. Shutting down...');
      process.exit(1);
    }
  }
};

void bootstrap();
