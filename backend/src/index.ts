import { Hono } from "hono";
import { UserRouter } from "./routes/user";
import { PostRouter } from "./routes/post";
import { cors } from "hono/cors";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;    //from wrangler.toml
    JWT_SECRET: string;      //from wrangler.toml
  };
}>();

app.use("/*", cors())
app.route('api/v1/user', UserRouter);
app.route('api/v1/blog', PostRouter);

app.get("/hello", (c) => {
  return c.text("Hello Hono!");
});


export default app;
