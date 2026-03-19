import { UserRole } from '@prisma/client';

export type UserResponse = Omit<User, 'password'>;

export interface JwtPayload {
	userId: string;
	email: string;
	role: UserRole;
}

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
}
