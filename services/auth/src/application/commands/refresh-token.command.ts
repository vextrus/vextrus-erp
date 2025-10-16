import { ICommand } from '@nestjs/cqrs';

export class RefreshTokenCommand implements ICommand {
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress: string,
    public readonly userAgent: string,
  ) {}
}