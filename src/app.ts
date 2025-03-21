import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes";

dotenv.config();

const app = express();

app.use(
  session({
    secret: process.env.SECRET_KEY!,
    resave: false,
    saveUninitialized: false,
    name: process.env.COOKIE_NAME,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(express.json());

app.use(
  cors({
    origin: process.env.NODE_ENV === "development" ? process.env.EXPO_URL : "*",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
  })
);

app.use("/api", routes);

//change host to 0.0.0.0 when deploying, localhost for test
app.listen({ port: process.env.PORT, host: "0.0.0.0" }, () => {
  console.log("Server running, with environment=" + process.env.NODE_ENV);
});
