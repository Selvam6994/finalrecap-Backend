// const express = require("express"); // "type": "commonjs"
import * as dotenv from "dotenv";
dotenv.config();
import express from "express"; // "type": "module"
import CORS from "cors";
import { auth, authotp } from "./auth middleware/auth.js";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodeMailer from "nodemailer";

const app = express();

const PORT = process.env.PORT;
app.use(CORS());

const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL); // dial
// Top level await
await client.connect(); // call
console.log("Mongo is connected !!!  ");
app.get("/", function (request, response) {
  response.send("🙋‍♂️, 🌏 🎊✨🤩");
});

app.get("/mobileData", auth, async function (request, response) {
  const getData = await client
    .db("MobilePhones")
    .collection("Mobile")
    .find({})
    .toArray();
  response.send(getData);
});
app.post(
  "/mobileData/add_mobileData",
  express.json(),
  async function (request, response) {
    const data = await request.body;
    const result = await client
      .db("MobilePhones")
      .collection("Mobile")
      .insertMany(data);
    response.send(result);
  }
);

async function generateHashedPassword(password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  // console.log(salt);
  // console.log(hashedPassword);
  return hashedPassword;
}

app.post(
  "/mobileData/signup",
  express.json(),
  async function (request, response) {
    const { username, email, password } = await request.body;

    const userFromDB = await client
      .db("MobilePhones")
      .collection("signUpData")
      .findOne({ username: username });
    console.log(userFromDB);
    if (userFromDB) {
      response.status(401).send({ message: "Already exists" });
    } else if (password.length < 8) {
      response.send({ message: "Your password is weak" });
    } else {
      const hashedPassword = await generateHashedPassword(password);
      const result = await client
        .db("MobilePhones")
        .collection("signUpData")
        .insertOne({
          username: username,
          email: email,
          password: hashedPassword,
        });
      console.log(hashedPassword);
      response.status(200).send(result);
    }
  }
);

app.post(
  "/mobileData/login",
  express.json(),
  async function (request, response) {
    const { username, email, password } = await request.body;
    const userFromDB = await client
      .db("MobilePhones")
      .collection("signUpData")
      .findOne({ email: email });
    if (!userFromDB) {
      response.status(401).send({ message: "Invalid credentials" });
    } else {
      //*compare password
      const storePassword = userFromDB.password;
      //*bcrypt inbuilt comparison method
      const passwordCheck = await bcrypt.compare(password, storePassword);
      //  console.log(passwordCheck);
      if (passwordCheck == true) {
        const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY);
        response.status(200).send({
          message: "Logged in successfully",
          token: token,
        });
      } else {
        response.status(401).send({ message: "Invalid credentials" });
      }
    }
  }
);

app.post(
  "/mobileData/resetPassword",
  express.json(),
  async function (request, response) {
    const { username, email, password } = await request.body;
    const userFromDB = await client
      .db("MobilePhones")
      .collection("signUpData")
      .findOne({ email: email });
    console.log(userFromDB);
    if (userFromDB) {
      const number = Math.random();
      const otp = (number * 10000).toFixed(0);
      const result = await client
        .db("MobilePhones")
        .collection("resetPassword")
        .insertOne({
          email: email,
          otp: otp,
        });

      let transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: "selvamyoor@gmail.com",
          pass: process.env.APP_PASSWORD,
        },
      });

      let info = {
        from: "selvamyoor@gmail.com",
        to: email,
        subject: "Reset the password",
        text: "Use this code to rest the password " + otp,
      };
      transporter.sendMail(info, (err) => {
        if (err) {
          console.log("error", err);
        } else {
          console.log("email sent successfully");
        }
      });

      setTimeout(async () => {
        const deleteOTP = await client
          .db("MobilePhones")
          .collection("resetPassword")
          .deleteOne({
            email: email,
            otp: otp,
          });
      }, 20000);

      response.send({ result });
    } else {
      response.status(401).send({ message: "invalid credentials" });
    }
  }
);

app.post("/mobileData/otp", express.json(), async function (request, response) {
  const { email, otp } = await request.body;
  const validUser = await client
    .db("MobilePhones")
    .collection("resetPassword")
    .findOne({ otp: otp });
  if (!validUser) {
    response.status(401).send({ message: "otp does not match" });
  } else {
    const token = jwt.sign({ otp: validUser.otp }, process.env.SECRET_KEY);
    response.status(200).send({
      message: "Logged in successfully",
      token: token,
    });
  }
});

app.put(
  "/mobileData/:email",
  authotp,
  express.json(),
  async function (request, response) {
    const { email } = request.params;
    const { newpassword, password } = await request.body;
    const hashedPassword = await generateHashedPassword(password);
    const result = await client
      .db("MobilePhones")
      .collection("signUpData")
      .updateOne({ email: email }, { $set: { password: hashedPassword } });
    response.send(result);
  }
);

//
app.get("/mobileData/resetPassword", async function (request, response) {
  const data = await client
    .db("MobilePhones")
    .collection("resetPassword")
    .find({})
    .toArray();
  response.send(data);
});

app.get("/mobileData/signup", async function (request, response) {
  const data = await client
    .db("MobilePhones")
    .collection("signUpData")
    .find({})
    .toArray();
  response.send(data);
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
