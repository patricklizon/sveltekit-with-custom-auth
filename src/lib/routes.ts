import type { RouteId as Root } from '../routes/$types';
import type { RouteId as ForgotPassword } from '../routes/(__core)/forgot-password/$types';
import type { RouteId as Login } from '../routes/(__core)/login/$types';
import type { RouteId as Logout } from '../routes/(protected)/(__core)/logout/$types';
import type { RouteId as Register } from '../routes/(__core)/register/$types';
import type { RouteId as Home } from '../routes/(protected)/home/$types';
import type { RouteId as RegisterFinalize } from '../routes/(__core)/register/finalize/$types';
import type { RouteId as ResetPassword } from '../routes/(__core)/reset-password/$types';
import type { RouteId as ResetPasswordToken } from '../routes/(__core)/reset-password/[token]/$types';
import type { RouteId as TwoFactorAuthentication } from '../routes/(protected)/(__core)/two-factor-authentication/$types';
import type { RouteId as TwoFactorAuthenticationVerify } from '../routes/(protected)/(__core)/two-factor-authentication/verify/$types';
import type { RouteId as TwoFactorAuthenticationRecoveryCodes } from '../routes/(protected)/(__core)/two-factor-authentication/recovery-codes/$types';
import type { RouteId as TwoFactorAuthenticationSetup } from '../routes/(protected)/(__core)/two-factor-authentication/setup/$types';
import type { Enum } from './types';

type RawPathDict = {
	ForgotPassword: ForgotPassword;
	Home: Home;
	Login: Login;
	Logout: Logout;
	Register: Register;
	RegisterFinalize: RegisterFinalize;
	ResetPassword: ResetPassword;
	ResetPasswordToken: ResetPasswordToken;
	Root: Root;
	TwoFactorAuthentication: TwoFactorAuthentication;
	TwoFactorAuthenticationRecoveryCodes: TwoFactorAuthenticationRecoveryCodes;
	TwoFactorAuthenticationSetup: TwoFactorAuthenticationSetup;
	TwoFactorAuthenticationVerify: TwoFactorAuthenticationVerify;
};

export const RawPath = {
	ForgotPassword: '/(__core)/forgot-password',
	Home: '/(protected)/home',
	Login: '/(__core)/login',
	Logout: '/(protected)/(__core)/logout',
	Register: '/(__core)/register',
	RegisterFinalize: '/(__core)/register/finalize',
	ResetPassword: '/(__core)/reset-password',
	ResetPasswordToken: '/(__core)/reset-password/[token]',
	Root: '/',
	TwoFactorAuthentication: '/(protected)/(__core)/two-factor-authentication',
	TwoFactorAuthenticationRecoveryCodes:
		'/(protected)/(__core)/two-factor-authentication/recovery-codes',
	TwoFactorAuthenticationSetup: '/(protected)/(__core)/two-factor-authentication/setup',
	TwoFactorAuthenticationVerify: '/(protected)/(__core)/two-factor-authentication/verify'
} satisfies RawPathDict;

export type RawPath = Enum<typeof RawPath>;
