import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { expiresAtFromTtl } from '../common/utils/ttl';
import {
  generateOpaqueToken,
  hashToken,
  newTokenFamilyId,
} from '../common/utils/token';

/** Janela em que reuso de um refresh token é tratado como corrida entre abas, não como roubo. */
const DEFAULT_REUSE_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (this.config.get('ALLOW_PUBLIC_REGISTER') !== 'true') {
      throw new ForbiddenException('Cadastro público desabilitado');
    }

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

    return this.issueTokens(user, newTokenFamilyId());
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

    return this.issueTokens(user, newTokenFamilyId());
  }

  /**
   * Rotação com detecção de reuso: cada refresh consome o token e emite outro
   * da mesma família. Apresentar um token já consumido (fora da janela de
   * tolerância) indica vazamento e revoga a família inteira.
   */
  async refresh(rawToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const now = new Date();
    if (stored.expiresAt < now) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (stored.usedAt) {
      const graceMs = Number(
        this.config.get('REFRESH_REUSE_GRACE_MS', DEFAULT_REUSE_GRACE_MS),
      );
      if (now.getTime() - stored.usedAt.getTime() >= graceMs) {
        await this.revokeFamily(stored.familyId);
        throw new UnauthorizedException('Sessão revogada por reuso de token');
      }
      // dentro da janela: corrida legítima entre abas — segue emitindo
    } else {
      // consumo atômico; se outra requisição chegou primeiro, cai na mesma tolerância
      await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, usedAt: null },
        data: { usedAt: now },
      });
    }

    return this.issueTokens(stored.user, stored.familyId);
  }

  async logout(userId: string, rawToken?: string) {
    if (rawToken) {
      const stored = await this.prisma.refreshToken.findFirst({
        where: { userId, tokenHash: hashToken(rawToken) },
        select: { familyId: true },
      });
      if (stored) await this.revokeFamily(stored.familyId);
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: { farm: { deletedAt: null } },
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

  private revokeFamily(familyId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { familyId } });
  }

  private async issueTokens(
    user: { id: string; email: string; name: string },
    familyId: string,
  ) {
    const accessExpiresIn = this.config.get('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = generateOpaqueToken();
    const expiresAt = expiresAtFromTtl(refreshExpiresIn, 7 * 86_400_000);

    await this.prisma.$transaction([
      // higiene: tokens expirados do usuário não precisam mais ficar no banco
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      }),
      this.prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(refreshToken),
          familyId,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
