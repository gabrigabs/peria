import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UsersService } from './users.service';

/**
 * Users controller - handles user CRUD operations
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users
   */
  @Get()
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.usersService.findAll({ limit, offset });
  }

  /**
   * Get a user by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Create a new user
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Update a user
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Partially update a user
   */
  @Patch(':id')
  patch(@Param('id') id: string, @Body() updateUserDto: Partial<UpdateUserDto>) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete a user
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Get user preferences
   */
  @Get(':id/preferences')
  getPreferences(@Param('id') id: string, @Headers('x-theme') theme?: string) {
    return this.usersService.getPreferences(id, theme);
  }
}
