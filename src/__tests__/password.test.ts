import app from '../app';
import supertest from 'supertest';

let emailToken: string;
let token: string;

describe('Auth', () => {
  const userData = {
    firstName: 'Tolu',
    lastName: 'Johnson',
    email: 'tolz@yahoo.com',
    password: 'testing',
  };

  test('signup', async () => {
    const response = await supertest(app).post('/users/signup').send(userData);

    emailToken = response.body.emailToken;

    expect(response.status).toBe(200);
    expect(response.body.newUser.isActive).toBe(false);
  });

  test('confirmEmail', async () => {
    const response = await supertest(app).get(`/users/verify/${emailToken}`);

    expect(response.status).toBe(201);
    expect(response.body.emailToken.email).toEqual(response.body.data.email);
    expect(response.body.data.isActive).toBe(true);
  });

  test('login', async () => {
    const response = await supertest(app)
      .post('/users/login')
      .send({ email: userData.email, password: userData.password });

    token = response.body.token;

    expect(response.status).toBe(201);
    expect(response.body.user.isActive).toBe(true);
  });

  const changePassword = {
    previousPassword: 'testing',
    newPassword: 'passpass',
    confirmNewPassword: 'passpass',
  };

  const reset = {
    newPassword: 'testing',
    passwordConfirm: 'testing',
  };

  it('forgets password', async () => {
    const response = await supertest(app)
      .post('/api/v1/reset/forgotpassword')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'tolz@yahoo.com' });
    expect(response.status).toBe(200);
  });

  test('change password', async () => {
    const response = await supertest(app)
      .post('/api/v1/reset/changepassword')
      .set('Authorization', `Bearer ${token}`)

      .send(changePassword);
    expect(response.status).toBe(200);
  });
});