export class BaseMessageResponseDto {
  status: boolean;
  message: string;
  meta?: Record<string, unknown>;
}
