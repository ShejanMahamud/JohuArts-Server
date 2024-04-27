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
    // await client.connect();

    const artsCollection = client.db('johuart').collection('artsCollection');

    app.get('/arts',async(req,res)=> {
      const result = await artsCollection.find().toArray();
      res.send(result)
    })

    app.get('/art/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await artsCollection.findOne(filter);
      res.send(result)
    })

    app.get('/arts/:email',async(req,res)=>{
      const email = req.params.email;
      const filter = {user_email: email}
      const result = await artsCollection.find(filter).toArray();
      res.send(result)
    })

    app.post('/arts',async(req,res)=>{
      const art = req.body;
      const result = await artsCollection.insertOne(art)
      res.send(result)
    })

    app.patch('/arts/:id',async(req,res)=>{
      const id = req.params.id;
      const art = req.body;
      const filter = {_id: new ObjectId(id)};
      const updatedArt = {
        $set:{
          image : art?.image,
          item_name: art?.item_name,
          subcategory_name: art?.subcategory_name,
          short_description: art?.short_description,
          rating: art?.rating,
          customization: art?.customization,
          processing_time: art?.processing_time,
          stock_status: art?.stock_status,
          price: art?.price
        }
      }
      const result = await artsCollection.updateOne(filter,updatedArt);
      res.send(result)
    })

    app.delete('/art/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}

      const result = await artsCollection.deleteOne(filter)
      res.send(result)
    })

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
  }
};

run().catch((error) => console.log);

app.get("/", (req, res) => {
    res.send('JohuCraft Backend Server Running...!')
});

app.listen(port, () => console.log("App running on port", port));
