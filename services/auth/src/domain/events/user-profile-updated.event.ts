export class UserProfileUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      preferredLanguage: string;
    }>,
    public readonly timestamp: Date,
  ) {}
}