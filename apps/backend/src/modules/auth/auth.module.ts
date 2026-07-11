import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersRolesModule } from '../users-roles/users-roles.module';

@Module({
  imports: [
    forwardRef(() => UsersRolesModule),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' }, // Access token expiration
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
