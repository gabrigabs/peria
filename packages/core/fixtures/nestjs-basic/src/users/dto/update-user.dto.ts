/**
 * DTO for updating an existing user
 */
export class UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  age?: number;
  isActive?: boolean;
}
