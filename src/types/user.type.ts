import { UserRole } from '@prisma/client';

export interface UserResponse extends User {
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
