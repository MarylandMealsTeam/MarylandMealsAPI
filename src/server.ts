import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import user from "./routes/user";
import ai from "./routes/ai";
import usersession from "./routes/session";

dotenv.config();

const app = express();

app.use(
  session({
    secret: process.env.EXPO_SECRET_KEY!,
    resave: false,
    saveUninitialized: false,
    name: process.env.COOKIE_NAME,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(express.json());

app.use(
  cors({
    origin: "*",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
  })
);

app.use("/user", user);
app.use("/ai", ai);
app.use("/session", usersession);

//change host to 0.0.0.0 when deploying, localhost for test
app.listen({ port: process.env.PORT, host: "0.0.0.0" }, () =>
  console.log("Server running on port: " + process.env.PORT)
);