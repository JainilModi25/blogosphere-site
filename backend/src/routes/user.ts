import {Hono} from "hono";
import { decode, sign, verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { signinInput, signupInput } from "jainil-blog-app";

const User = new Hono<{
  Bindings: {
    DATABASE_URL: string; //from wrangler.toml
    JWT_SECRET: string; //from wrangler.toml
  };
}>();


User.post("/signup", async (c) => {
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });
    const jwt = await sign(
      {
        id: user.id,
      },
      c.env.JWT_SECRET
    );
    return c.json({
      jwt,
    });
  } catch (error){
    console.log(error);
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
});


User.post("/signin", async (c) => {
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());


  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({ message: "user not found, incorrect credentials" });
    }

    const jwt = await sign(
      {
        id: user.id,
      },
      c.env.JWT_SECRET
    );
    return c.json({ jwt });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Invalid");
  }
});


export {User as UserRouter};