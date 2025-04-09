import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { TokenService } from '@/auth';
import { buildAppLink, FailedDependencyException, TypeActionEmail } from '@/shared';
import { LoggerService } from '@/services';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly tokenService: TokenService
  ) {}

  async sendVerificationEmail(to: string, identifier: string): Promise<SentMessageInfo> {
    const token = this.tokenService.generateActionTokenEmail(to, TypeActionEmail.VERIFY_EMAIL);
    const link = buildAppLink(`verify-email?token=${token}`);
    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, '..', 'templates', 'template-send-email.html'),
      'utf-8'
    );
    const htmlContent = htmlTemplate
      .replace('{{text_hidden}}', 'Verify your email address to complete the registration process.')
      .replace(
        '{{title}}',
        'Thank you for registering! Please verify your email address to complete the process.'
      )
      .replace('{{userName}}', identifier)
      .replace(
        '{{image_url}}',
        'https://ekjpymh.stripocdn.email/content/guids/CABINET_2100627b55ea699874bd8e44856f5ab1ba6ce868c12c40673881aec9fa0e5955/images/ph_1040x586.png'
      )
      .replace(
        '{{content_text_1}}',
        'We are excited to have you on board. To complete your registration, please verify your email address by clicking the button below.'
      )
      .replace(
        '{{content_text_2}}',
        'If you did not reset password with us, you can safely ignore this email.'
      )
      .replace('{{button_link}}', link)
      .replace('{{button_text}}', 'Verify Email');
    try {
      return await this.mailerService.sendMail({
        to,
        subject: 'Account Verification',
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(
        `❌ Failed to send verification email to ${to}: ${errorMessage}`,
        MailService.name
      );
      throw new FailedDependencyException('Verification email could not be sent');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    identifier: string,
    expires: string
  ): Promise<SentMessageInfo> {
    const token = this.tokenService.generateActionTokenEmail(to, TypeActionEmail.RESET_PASSWORD);
    const link = buildAppLink(`reset-password?token=${token}`);

    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, '..', 'templates', 'template-send-email.html'),
      'utf-8'
    );
    const htmlContent = htmlTemplate
      .replace('{{text_hidden}}', 'Reset your password by clicking the link in this email.')
      .replace(
        '{{title}}',
        'We received a request to reset your password. Click the link below to create a new password.'
      )
      .replace('{{userName}}', identifier)
      .replace(
        '{{image_url}}',
        'https://ekjpymh.stripocdn.email/content/guids/CABINET_2100627b55ea699874bd8e44856f5ab1ba6ce868c12c40673881aec9fa0e5955/images/ph_1040x586.png'
      )
      .replace(
        '{{content_text_1}}',
        'This link will expire in ' + expires + '. Please use it before the expiration time.'
      )
      .replace(
        '{{content_text_2}}',
        'If you did not create an account with us, you can safely ignore this email.'
      )
      .replace('{{button_link}}', link)
      .replace('{{button_text}}', 'Reset Password');

    try {
      return await this.mailerService.sendMail({
        to,
        subject: 'Password Reset',
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(
        `❌ Failed to send password reset email to ${to}: ${errorMessage}`,
        MailService.name
      );
      throw new ServiceUnavailableException(
        'Password reset email service is currently unavailable'
      );
    }
  }
}
