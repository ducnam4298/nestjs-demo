import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { DatabaseService } from '@/database';
import { mockBeforeConsoleAndTimers, mockAfterConsoleAndTimers, transactionMock } from '@/shared';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('TokenService', () => {
  let tokenService: TokenService;

  const tokenServiceM = {
    verifyToken: jest.fn(),
    generateTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    invalidateToken: jest.fn(),
    invalidateAllTokens: jest.fn(),
  };
  const jwt = {
    sign: jest.fn(),
    verify: jest.fn(),
  };
  const config = { get: jest.fn() };
  const tokenPM = {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  };
  const transaction = transactionMock({
    token: tokenPM,
  });

  const validToken = 'valid.token';
  const expiredToken = 'expired.token';
  const invalidToken = 'invalid.token';
  const unknownToken = 'unknown.token';

  const accessToken = 'access.token';
  const refreshToken = 'refresh.token';
  const hashedRefreshToken = 'hashed.refresh.token';
  const deviceId = 'device-1';
  const userId = 'user123';
  const secret = 'secret';
  const decoded = { userId, deviceId };
  const user = { id: userId, role: { name: 'USER', permissions: [] } };
  const tokenRecord = {
    id: 'token123',
    createdAt: new Date(),
    updatedAt: null,
    userId,
    deviceId,
    accessToken,
    refreshToken,
    user,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: jwt,
        },
        {
          provide: ConfigService,
          useValue: config,
        },
        {
          provide: DatabaseService,
          useValue: {
            token: tokenPM,
            $transaction: transaction,
          },
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);

    mockBeforeConsoleAndTimers();
  });

  afterEach(() => {
    mockAfterConsoleAndTimers();
  });

  describe('verifyToken', () => {
    it('should return decoded token if valid', () => {
      const payload = { userId: 'user123', deviceId: 'device-1' };
      jwt.verify.mockReturnValue(payload);
      const result = tokenService.verifyToken(validToken);
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if token is expired', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      const result = () => tokenService.verifyToken(expiredToken);
      expect(result).toThrow(new UnauthorizedException('Token has expired'));
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      const result = () => tokenService.verifyToken(invalidToken);
      expect(result).toThrow(new UnauthorizedException('Invalid token'));
    });

    it('should throw UnauthorizedException for unknown errors', () => {
      const error = new Error('Unknown error');
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      const result = () => tokenService.verifyToken(unknownToken);
      expect(result).toThrow(new UnauthorizedException('Token verification failed'));
    });
  });

  describe('generateTokens', () => {
    it('should generate and store tokens successfully', async () => {
      jwt.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedRefreshToken);

      tokenPM.create.mockResolvedValue({ userId, deviceId });

      await tokenService.generateTokens(user, deviceId);

      expect(tokenPM.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            deviceId,
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      config.get.mockReturnValue(secret);
      jwt.verify.mockReturnValue(decoded);
      tokenPM.findFirst.mockResolvedValue(tokenRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken,
        refreshToken,
      });
      const result = tokenService.refreshAccessToken(refreshToken, deviceId);
      await expect(result).resolves.toEqual({
        accessToken,
        refreshToken,
      });
    });

    it('should throw UnauthorizedException if token is not found', async () => {
      jwt.verify.mockReturnValue({ userId, deviceId });
      tokenPM.findFirst.mockResolvedValue(null);
      const result = tokenService.refreshAccessToken(refreshToken, deviceId);
      await expect(result).rejects.toThrow(new UnauthorizedException('User not found'));
    });

    it('should throw UnauthorizedException if user is null', async () => {
      jwt.verify.mockReturnValue({ userId, deviceId });
      tokenPM.findFirst.mockResolvedValue(null);
      const result = tokenService.refreshAccessToken(refreshToken, deviceId);
      await expect(result).rejects.toThrow(new UnauthorizedException('User not found'));
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwt.verify.mockReturnValue({ userId, deviceId });
      tokenPM.findFirst.mockResolvedValue(tokenRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = tokenService.refreshAccessToken(refreshToken, deviceId);
      await expect(result).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
    });
  });

  describe('invalidateToken', () => {
    it('should delete token successfully', async () => {
      tokenPM.deleteMany.mockResolvedValue({ count: 1 });
      const result = tokenService.invalidateToken(userId, deviceId);
      await expect(result).resolves.toEqual(userId);
      expect(tokenPM.deleteMany).toHaveBeenCalledWith({
        where: { userId, deviceId },
      });
    });
  });

  describe('invalidateAllTokens', () => {
    it('should delete all tokens successfully', async () => {
      tokenPM.deleteMany.mockResolvedValue({ count: 1 });
      const result = tokenService.invalidateAllTokens(userId);
      await expect(result).resolves.toEqual(userId);
      expect(tokenPM.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    });
  });
});
