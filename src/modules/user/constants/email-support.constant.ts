export const EMAIL_SUPPORT_SUBJECT = (userEmail: string) =>
  `LushLife Email Support | ${userEmail}`;

export const EMAIL_SUPPORT_MESSAGE = (userEmail: string, body: string) => `
Support Team,

User with email ${userEmail} has sent a support request.

Body: 
${body}
`;
