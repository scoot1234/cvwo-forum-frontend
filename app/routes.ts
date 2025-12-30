import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "./routes/login.tsx"),
  route("signup", "./routes/signup.tsx"),
  route("topics/:topicId", "./routes/posts.tsx"),
  route("posts/:postId", "./routes/comments.tsx"),
] satisfies RouteConfig;
