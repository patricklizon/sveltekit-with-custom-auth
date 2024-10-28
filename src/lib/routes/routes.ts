import type { RouteId as Landing } from '../../routes/$types';
import type { RouteId as ConfirmUserRequest } from '../../routes/(protected)/confirm-user-request/[user_request_id]/$types';
import type { RouteId as Home } from '../../routes/(protected)/home/$types';
import type { RouteId as Logout } from '../../routes/(protected)/logout/$types';
import type { RouteId as TwoFactorAuthentication } from '../../routes/(protected)/two-factor-authentication/$types';
import type { RouteId as TwoFactorAuthenticationRecoveryCodes } from '../../routes/(protected)/two-factor-authentication/recovery-codes/$types';
import type { RouteId as TwoFactorAuthenticationSetup } from '../../routes/(protected)/two-factor-authentication/setup/$types';
import type { RouteId as Login } from '../../routes/login/$types';
import type { RouteId as Register } from '../../routes/register/$types';
import type { RouteId as ResetPassword } from '../../routes/reset-password/$types';
import type { RouteId as ResetPasswordVerify } from '../../routes/reset-password/[password_reset_request_id]/$types';
import type { RouteId as ResetPasswordSetNewPassword } from '../../routes/reset-password/[password_reset_request_id]/set-new-password/$types';

import type { Enum } from '$lib/types';

type RawPathDict = {
	Home: Home;
	Login: Login;
	Logout: Logout;
	Register: Register;
	ConfirmUserRequest: ConfirmUserRequest;
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
	Login: '/login',
	Logout: '/(protected)/logout',
	Register: '/register',
	ConfirmUserRequest: '/(protected)/confirm-user-request/[user_request_id]',
	ResetPassword: '/reset-password',
	ResetPasswordVerify: '/reset-password/[password_reset_request_id]',
	ResetPasswordSetNewPassword: '/reset-password/[password_reset_request_id]/set-new-password',
	Landing: '/',
	TwoFactorAuthentication: '/(protected)/two-factor-authentication',
	TwoFactorAuthenticationRecoveryCodes: '/(protected)/two-factor-authentication/recovery-codes',
	TwoFactorAuthenticationSetup: '/(protected)/two-factor-authentication/setup'
} satisfies RawPathDict;

/**
 * Type definitions for route path handling
 *
 * @template R - Raw path string literal type
 */
export type RawPath = Enum<typeof RawPath>;
