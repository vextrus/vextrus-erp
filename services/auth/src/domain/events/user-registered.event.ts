export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly organizationId: string,
    public readonly roleId: string,
    public readonly phoneNumber?: string,
    public readonly preferredLanguage?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}