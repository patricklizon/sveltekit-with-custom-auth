import type { RouteId as Landing } from '../routes/$types';
import type { RouteId as Login } from '../routes/(__core)/login/$types';
import type { RouteId as Logout } from '../routes/(protected)/(__core)/logout/$types';
import type { RouteId as Register } from '../routes/(__core)/register/$types';
import type { RouteId as Home } from '../routes/(protected)/home/$types';
import type { RouteId as RegisterFinalize } from '../routes/(__core)/register/finalize/$types';
import type { RouteId as ResetPassword } from '../routes/(__core)/reset-password/$types';
import type { RouteId as ResetPasswordVerify } from '../routes/(__core)/reset-password/[password_reset_request_id]/$types';
import type { RouteId as ResetPasswordSetNewPassword } from '../routes/(__core)/reset-password/[password_reset_request_id]/set-new-password/$types';
import type { RouteId as TwoFactorAuthentication } from '../routes/(protected)/(__core)/two-factor-authentication/$types';

import type { RouteId as TwoFactorAuthenticationRecoveryCodes } from '../routes/(protected)/(__core)/two-factor-authentication/recovery-codes/$types';
import type { RouteId as TwoFactorAuthenticationSetup } from '../routes/(protected)/(__core)/two-factor-authentication/setup/$types';
import type { Enum } from './types';

type RawPathDict = {
	Home: Home;
	Login: Login;
	Logout: Logout;
	Register: Register;
	RegisterFinalize: RegisterFinalize;
	ResetPassword: ResetPassword;
	ResetPasswordVerify: ResetPasswordVerify;
	ResetPasswordSetNewPassword: ResetPasswordSetNewPassword;
	Landing: Landing;
	TwoFactorAuthentication: TwoFactorAuthentication;
	TwoFactorAuthenticationRecoveryCodes: TwoFactorAuthenticationRecoveryCodes;
	TwoFactorAuthenticationSetup: TwoFactorAuthenticationSetup;
};

export const RawPath = {
	Home: '/(protected)/home',
	Login: '/(__core)/login',
	Logout: '/(protected)/(__core)/logout',
	Register: '/(__core)/register',
	RegisterFinalize: '/(__core)/register/finalize',
	ResetPassword: '/(__core)/reset-password',
	ResetPasswordVerify: '/(__core)/reset-password/[password_reset_request_id]',
	ResetPasswordSetNewPassword:
		'/(__core)/reset-password/[password_reset_request_id]/set-new-password',
	Landing: '/',
	TwoFactorAuthentication: '/(protected)/(__core)/two-factor-authentication',
	TwoFactorAuthenticationRecoveryCodes:
		'/(protected)/(__core)/two-factor-authentication/recovery-codes',
	TwoFactorAuthenticationSetup: '/(protected)/(__core)/two-factor-authentication/setup'
} satisfies RawPathDict;

export type RawPath = Enum<typeof RawPath>;
