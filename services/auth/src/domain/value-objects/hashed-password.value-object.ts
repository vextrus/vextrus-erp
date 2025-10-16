export class HashedPassword {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Hashed password cannot be empty');
    }
    
    // Validate it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (!this.isBcryptHash(value)) {
      throw new Error('Invalid password hash format');
    }
  }

  private isBcryptHash(hash: string): boolean {
    // Bcrypt hashes are 60 characters long and start with $2a$, $2b$, or $2y$
    const bcryptRegex = /^\$2[aby]\$\d{2}\$.{53}$/;
    return bcryptRegex.test(hash);
  }

  equals(other: HashedPassword): boolean {
    return this.value === other.value;
  }

  toString(): string {
    // Never expose the actual hash in logs
    return '[REDACTED]';
  }
}