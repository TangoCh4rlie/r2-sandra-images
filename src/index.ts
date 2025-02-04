import { Context, Hono, Next } from "hono";
import { cors } from "hono/cors";
import HttpError from "./helpers/http-error.helper";
import ContentRoute from "./routes/content.route";
import AuthRoute from "./routes/auth.route";

const app = new Hono();

app.use("*", async (c: Context, next: Next): Promise<void | Response> => {
  return await cors({
    origin: [c.env.CLIENT_ORIGIN_URL],
    credentials: true,
  })(c, next);
});

app.onError((err, c: Context) => {
  c.status(err instanceof HttpError ? err.status : 500);

  return c.json({
    success: false,
    message: err.message,
    data: null,
  });
});

app.notFound((c) => {
  return c.json("There is nothing here !");
});

app.route("/", ContentRoute);
app.route("/auth", AuthRoute);

export default app;
