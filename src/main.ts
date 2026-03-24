import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(helmet());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
		})
	);
	const config = new DocumentBuilder()
		.setTitle('API Documentation')
		.setDescription('Belum ada deskripsi')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
