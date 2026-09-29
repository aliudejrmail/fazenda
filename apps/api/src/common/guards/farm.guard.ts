import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class FarmGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string } | undefined;
    const farmId = request.headers['x-farm-id'] as string | undefined;

    if (!user?.userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    if (!farmId) {
      throw new ForbiddenException('Header X-Farm-Id é obrigatório');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_farmId: { userId: user.userId, farmId },
      },
      include: {
        farm: { select: { id: true, deletedAt: true } },
      },
    });

    if (!membership || membership.farm.deletedAt) {
      throw new ForbiddenException('Sem acesso a esta fazenda');
    }

    const method = String(request.method || 'GET').toUpperCase();
    if (!READ_METHODS.has(method) && membership.role === 'VIEWER') {
      throw new ForbiddenException(
        'Perfil visualizador: apenas leitura nesta fazenda',
      );
    }

    request.farmId = farmId;
    request.membership = membership;
    return true;
  }
}
