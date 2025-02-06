import { Hono } from 'hono/quick';
import { Bindings } from '../models/bindings.model';
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';

const app = new Hono<{ Bindings: Bindings }>();

app.post('/login', async (c) => {
  const { username, password } = await c.req.json();

  if (username !== c.env.USERNAME) {
    const message = 'Unknow username';
    return c.json(message, 404);
  }

  if (password !== c.env.PASSWORD) {
    const message = 'Wrong password';
    return c.json(message, 403);
  }

  const token = await sign({ username }, c.env.JWT_SECRET_KEY);

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  c.header('Access-Control-Allow-Headers', '*');
  c.header('Access-Control-Allow-Origin', c.env.CLIENT_ORIGIN_URL);

  setCookie(c, 'token', token, {
    expires: new Date(new Date().setDate(new Date().getDate() + 7)),
    secure: true,
    sameSite: 'None',
    httpOnly: true,
  });

  return c.json({ token });
});

export default app;
