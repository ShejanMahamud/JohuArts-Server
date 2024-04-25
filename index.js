const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4533;
const mongoURI = process.env.MONGO_URI;
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

//app
const app = express();

//middlewares
app.use(cors());
app.use(express.json());

//mongo client
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
};

run().catch((error) => console.log);

app.get("/", (req, res) => {
    res.send('JohuCraft Backend Server Running...!')
});

app.listen(port, () => console.log("App running on port", port));
