import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '../get-user-by-id.query';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

export interface UserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  organizationId: string;
  roleId?: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const { userId } = query;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result: UserDto = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isActive: user.isActive,
      isLocked: user.isLocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    if (user.firstName) result.firstName = user.firstName;
    if (user.lastName) result.lastName = user.lastName;
    if (user.phoneNumber) result.phoneNumber = user.phoneNumber;
    if (user.preferredLanguage) result.preferredLanguage = user.preferredLanguage;
    if (user.roleId) result.roleId = user.roleId;
    if (user.lastLoginAt) result.lastLoginAt = user.lastLoginAt;
    
    return result;
  }
}