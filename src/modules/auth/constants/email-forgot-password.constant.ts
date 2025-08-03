export const EMAIL_FORGOT_PASSWORD_SUBJECT = 'Forgot Password | LushLife';
export const EMAIL_FORGOT_PASSWORD_MESSAGE = (url: string, name: string) => `
Hello ${name},

We’ve received a request to reset your password.

To proceed, please click the link below:

${url}

If you didn’t request a password reset, please ignore this email.

– LushLife Team
`;

export const SMS_FORGOT_PASSWORD_MESSAGE = (url: string, name: string) => `
Hello ${name},

We’ve received a request to reset your password.

To proceed, please click the link below:

${url}
`;
