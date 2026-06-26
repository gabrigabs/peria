/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  email!: string;
  name!: string;
  password?: string;
  age?: number;
  isActive?: boolean;
}
