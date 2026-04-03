import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/types/index.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
		});
	}

	validate({
		sub,
		email,
		role,
	}: { sub: number } & Omit<JwtPayload, 'userId'>): JwtPayload {
		return { userId: sub, email, role };
	}
}
