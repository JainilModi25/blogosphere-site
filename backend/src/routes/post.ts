import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createPostInput, updatePostInput } from "jainil-blog-app";

const Post = new Hono<{
  Bindings: {
    DATABASE_URL: string; //from wrangler.toml
    JWT_SECRET: string; //from wrangler.toml
  },
  Variables: {
    userId: string
  };
}>();

// middleware
Post.use("/*", async (c, next) => {
    // extract the user id
    // pass it down to the route handler
    const jwt = c.req.header("authorization") || "";
    if (!jwt) {
      c.status(401);
      return c.json({ error: "unauthorized" });
    }
    try {
      const token = jwt.split(" ")[1];     //because of split function, always include "Bearer token..." in Authorization header, not just the token.
      const payload = await verify(token, c.env.JWT_SECRET);
      if (!payload) {
        c.status(401);
        return c.json({ error: "unauthorized" });
      }
      c.set('userId', payload.id);
      await next();
      
    } catch (error) {
      console.log(c);
      console.log(error);
      return c.json({
        "message": error
      })
    }
})


// create new blog => /api/v1/blog/create
Post.post("/create", async (c) => {
  const body = await c.req.json();
  
  const userId = c.get('userId');
  
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate())
  try {
    const { success } = createPostInput.safeParse(body);
    if (!success) {
      c.status(400);
      return c.json({ error: "invalid input" });
    }
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        author: { connect: { id: userId } },
      },
    });
  return c.json({
    id: post.id
  })
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.json({
      "message": "Invalid fields given"
    })
  }
});

// add pagination so that not all blogs are loaded at once
Post.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
    const posts = await prisma.post.findMany();
    console.log(c);
    return c.json({
        posts
    })
})

// find a particular post
Post.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const post = await prisma.post.findFirst({
    where:{
      id: id
    }
  })
  return c.json(post);
});


// update a blog
Post.put("/update", async (c) => {
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const { success } = updatePostInput.safeParse(body);
    if (!success) {
      c.status(400);
      return c.json({ error: "invalid input" });
    }
    await prisma.post.update({
      where: {
        id: body.id,
        authorId: userId
      },
      data: {
        title: body.title,
        content: body.content
      }
    });
    return c.json({"message": "updated post"});
    
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.json({
      message: "Invalid fields given",
    });
  }
});



export { Post as PostRouter };
