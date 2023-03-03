// const express = require("express"); // "type": "commonjs"
import * as dotenv from "dotenv";
dotenv.config();
import express from "express"; // "type": "module"
import CORS from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
const app = express();

const PORT = process.env.PORT;
app.use(CORS());
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL); // dial
// Top level await
await client.connect(); // call
console.log("Mongo is connected !!!  ");
// app.get("/", function (request, response) {
//   response.send("🙋‍♂️, 🌏 🎊✨🤩");
// });

app.get("/mobileData", async function (request, response) {
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
        response.status(200).send({
          message: "Logged in successfully",
        });
      } else {
        response.status(401).send({ message: "Invalid credentials" });
      }
    }
  }
);
app.get("/mobileData/signup", async function (request, response) {
  const data = await client
    .db("MobilePhones")
    .collection("signUpData")
    .find({})
    .toArray();
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
