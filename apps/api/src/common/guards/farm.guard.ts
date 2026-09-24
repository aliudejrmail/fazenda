import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    });

    if (!membership) {
      throw new ForbiddenException('Sem acesso a esta fazenda');
    }

    request.farmId = farmId;
    request.membership = membership;
    return true;
  }
}
