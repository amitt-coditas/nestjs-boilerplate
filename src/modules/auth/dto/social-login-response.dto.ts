import { LOGIN_TYPE } from '../constants/login-type.enum';

export class SocialLoginResponseDto {
  loginType: LOGIN_TYPE;
  fname: string;
  lname: string;
  email: string;
  profilePicture: string;
}
