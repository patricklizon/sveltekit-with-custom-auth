import { UnexpectedError } from '$lib/errors';
import { EmailRejectedError } from '$lib/shared/domain/__core/email/errors';
import { err, ok, type Result } from 'neverthrow';
import { createTransport } from 'nodemailer';
import { z } from 'zod';
import { env as privateEnv } from '$env/dynamic/private';

const schema = z.object({
	SMTP_HOST: z.string(),
	SMTP_PORT: z.string(),
	SMTP_USER: z.string(),
	SMTP_PASS: z.string(),
	NOTIFIER_EMAIL_FROM_DISPLAY_NAME: z.string(),
	NOTIFIER_EMAIL_FROM: z.string().email()
});

const env = schema.parse(privateEnv);

export type SendOptions = { subject: string; text: string; html: string; to: string };

export class EmailService {
	constructor(
		private transporter = createTransport({
			host: env.SMTP_HOST,
			port: Number(env.SMTP_PORT),
			secure: env.SMTP_PORT === '465',
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS
			}
		})
	) {}

	async send(options: SendOptions): Promise<Result<true, EmailRejectedError | UnexpectedError>> {
		try {
			const sendResult = await this.transporter.sendMail({
				from: `"${env.NOTIFIER_EMAIL_FROM_DISPLAY_NAME}" <${env.NOTIFIER_EMAIL_FROM}>`,
				subject: options.subject,
				text: options.text,
				html: options.html,
				to: options.to
			});

			if (sendResult.rejected.length > 0) {
				return err(new EmailRejectedError(sendResult.rejected as never));
			}

			console.debug({ sendResult });

			return ok(true);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}

	// TODO:
	// bulk
}
