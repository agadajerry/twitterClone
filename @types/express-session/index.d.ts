import { IUser } from './../../src/types/types';
import 'express-session';

declare module 'express-session' {
  interface Session {
    passport: {
      user: {
        user: IUser;
        token: string;
      };
    };
  }
}
