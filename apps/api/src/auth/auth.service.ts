import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.buildAuthResponse(
      stored.user.id,
      stored.user.email,
      stored.user.name,
    );
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async buildAuthResponse(
    userId: string,
    email: string,
    name: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '1d'),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, name },
    };
  }
}
