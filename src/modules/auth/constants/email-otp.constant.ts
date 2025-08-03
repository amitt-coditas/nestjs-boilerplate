export const EMAIL_OTP_SUBJECT = 'Your OTP for password reset | LushLife';
export const EMAIL_OTP_MESSAGE = (otp: string, name: string) => `
Hello ${name},

Your OTP for password reset is:

${otp}

Please use this OTP to reset your password.

– LushLife Team
`;
