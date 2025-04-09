import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SentMessageInfo } from 'nodemailer';
import { MailService } from './mail.service';
import { Metadata, Throttles } from '@/access_control';
import { buildAppLink } from '@/shared';

@Throttles.Email()
@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Metadata.Public()
  @ApiOperation({ summary: 'Send verification email' })
  @ApiQuery({
    name: 'to',
    type: String,
    description: 'Recipient email address',
    example: 'ducnam4298@gmail.com',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    description: 'Name of the recipient',
    example: 'Ngô Đức Nam',
  })
  @Get('verify')
  async sendVerification(
    @Query('to') to: string,
    @Query('name') name: string
  ): Promise<SentMessageInfo> {
    return this.mailService.sendVerificationEmail(to, name || 'User');
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiQuery({
    name: 'to',
    type: String,
    description: 'Recipient email address',
    example: 'ducnam4298@gmail.com',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    description: 'Name of the recipient',
    example: 'Ngô Đức Nam',
  })
  @Get('reset')
  async sendPasswordReset(
    @Query('to') to: string,
    @Query('name') name: string
  ): Promise<SentMessageInfo> {
    return this.mailService.sendPasswordResetEmail(to, name || 'User', '5m');
  }
}
