// const express = require("express"); // "type": "commonjs"
import * as dotenv from 'dotenv' 
dotenv.config()
import express from "express"; // "type": "module"
import CORS from "cors";
import { MongoClient } from "mongodb";
const app = express();

const PORT = process.env.PORT;
app.use(CORS());
const MONGO_URL = process.env.MONGO_URL
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
app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
