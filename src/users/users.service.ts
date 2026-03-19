import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  findById(id: string) {
    return this.usersRepository.findById(id);
  }
  update(id: string, data: UpdateUserDto) {
    return this.usersRepository.update(id, data);
  }
  delete(id: string) {
    return this.usersRepository.delete(id);
  }
}
