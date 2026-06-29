import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ApproveUserRequestDto } from './dto/approve-user-request.dto.js';

interface CreateUserDto {
  email: string;
  name: string;
}

@Controller('users')
export class UsersController {
  /**
   * List all users.
   */
  @Get()
  getUsers() {
    return [
      {
        id: 'user_123',
        email: 'reader@example.com',
        name: 'Docs Reader',
        status: 'active',
      },
    ];
  }

  /**
   * Create a new user.
   */
  @Post()
  createUser(@Body() body: CreateUserDto) {
    return { id: 'user_new', status: 'pending', ...body };
  }

  /**
   * Get user by ID.
   */
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return {
      id,
      email: 'reader@example.com',
      name: 'Docs Reader',
      status: 'active',
    };
  }

  /**
   * Approve a user request.
   */
  @Post(':id/approve')
  approveUser(@Param('id') id: string, @Body() body: ApproveUserRequestDto) {
    return {
      id,
      approved: true,
      approvedAt: body.approvedAt,
      approvedBy: body.approvedBy ?? 'system',
    };
  }
}
