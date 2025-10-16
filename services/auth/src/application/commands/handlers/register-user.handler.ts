import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../register-user.command';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string }> {
    const { email, username, password, firstName, lastName, organizationId, roleId, phoneNumber, preferredLanguage } = command;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the aggregate
    const userAggregate = UserAggregate.create(
      email,
      hashedPassword,
      {
        firstName,
        lastName,
        ...(phoneNumber && { phoneNumber }),
        ...(preferredLanguage && { preferredLanguage }),
      },
      organizationId,
      roleId,
    );

    // Save to database
    const user = this.userRepository.create({
      id: userAggregate.getId(),
      email: userAggregate.getEmail(),
      username,
      passwordHash: userAggregate.getPasswordHash(),
      firstName,
      lastName,
      ...(phoneNumber !== undefined && { phone: phoneNumber }),
      preferredLanguage: preferredLanguage || 'en',
      organizationId,
      ...(roleId !== undefined && { roleId }),
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await this.userRepository.save(user);
      
      // Publish domain events
      const events = userAggregate.getUncommittedEvents();
      events.forEach(event => this.eventBus.publish(event));
      userAggregate.markEventsAsCommitted();

      return { userId: user.id };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to register user');
    }
  }
}