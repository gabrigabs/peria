import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { ApproveUserRequestDto } from './dto/approve-user-request.dto.js';

@Controller('users')
export class UsersController {
  /**
   * List all users
   */
  @Get()
  getUsers() {
    return [];
  }

  /**
   * Create a new user
   */
  @Post()
  createUser(@Body() body: CreateUserDto) {
    return { id: '123', ...body };
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return { id, email: 'user@example.com' };
  }

  /**
   * Approve a user request
   */
  @Post(':id/approve')
  approveUser(@Param('id') id: string, @Body() body: ApproveUserRequestDto) {
    return { id, approved: true, approvedAt: body.approvedAt };
  }
}

interface CreateUserDto {
  email: string;
  name: string;
}
