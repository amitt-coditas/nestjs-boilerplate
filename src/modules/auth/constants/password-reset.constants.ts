type TimePeriod = 'hour(s)' | 'minute(s)' | 'day(s)';

const PASSWORD_RESET_SUBJECT = 'Password Reset';
const PASSWORD_RESET_MESSAGE = ({
  firstName,
  resetUrl,
  period,
  duration,
}: {
  firstName: string;
  resetUrl: string;
  period: TimePeriod;
  duration: number;
}) => `
Hello ${firstName},

You have requested to reset your password. Please click the link below to reset your password:

${resetUrl}

This link will expire in ${duration} ${period} for security purposes.

If you did not request this password reset, please ignore this email.

Best regards,
The Team
`;

export { PASSWORD_RESET_SUBJECT, PASSWORD_RESET_MESSAGE };
export type { TimePeriod };
