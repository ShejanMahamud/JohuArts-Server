const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4533;
const mongoURI = process.env.MONGO_URI;
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

//app
const app = express();

//middlewares
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//custom middlewares

const verifyToken = async (req,res,next) => {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'Forbidden'})
  }
  jwt.verify(token,process.env.SECRET_ACCESS_TOKEN,(error, decoded)=>{
    if(error){
      return res.status(401).send({message: 'Unauthorized Request!'})
    }
    req.user = decoded;
    next();
  })
}

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

    const artsCollection = client.db("johuart").collection("artsCollection");
    const artsCategoriesCollection = client
      .db("johuart")
      .collection("categoriesCollection");
    const usersCollection = client.db("johuart").collection("usersCollection");


    //Auth related Api

    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.SECRET_ACCESS_TOKEN,{ expiresIn: '1h' })
      res
      .cookie('token',token,{
        httpOnly: true,
        secure: false,
      })
      .send({success:true})
    })

    //Arts Related Api
    app.get("/arts", verifyToken, async (req, res) => {
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'Forbidden'})
      }
      let query = {};
      if (req.query?.email) {
        query.user_email = req.query.email;
      }
    
      if (req.query?.customization) {
        query.customization = req.query.customization;
      }
      const result = await artsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/art/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await artsCollection.findOne(filter);
      res.send(result);
    });

    app.get('/users', async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.get("/categories", async (req, res) => {
      const result = await artsCategoriesCollection.find().toArray();
      res.send(result);
    });

    app.get('/category/:subcategory_name',async(req,res)=>{
      const subcategory_name = req.params.subcategory_name;
      const filter = {subcategory_name: subcategory_name}
      const result = await artsCollection.find(filter).toArray();
      res.send(result)
    })

    app.post("/arts", async (req, res) => {
      const art = req.body;
      const result = await artsCollection.insertOne(art);
      const category = art.subcategory_name;
      const filter = {subcategory_name: category};
      const updatedStock = {
        $inc:{
          art_count : 1 
        }
      }
      await artsCategoriesCollection.findOneAndUpdate(filter,updatedStock)
      res.send(result);
    });

    app.post('/users',async(req,res)=>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.patch("/arts/:id", async (req, res) => {
      const id = req.params.id;
      const art = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedArt = {
        $set: {
          image: art?.image,
          item_name: art?.item_name,
          subcategory_name: art?.subcategory_name,
          short_description: art?.short_description,
          rating: art?.rating,
          customization: art?.customization,
          processing_time: art?.processing_time,
          stock_status: art?.stock_status,
          price: art?.price,
        },
      };
      const result = await artsCollection.updateOne(filter, updatedArt);
      res.send(result);
    });

    app.delete("/art/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const art = await artsCollection.findOne(filter);
      const category = art.subcategory_name;

      const result = await artsCollection.deleteOne(filter);

      const categoryFilter = {subcategory_name: category}
      const updatedStock = {
        $inc:{
          art_count: -1
        }
      }
      await artsCategoriesCollection.findOneAndUpdate(categoryFilter,updatedStock)

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
};

run().catch((error) => console.log);

app.get("/", (req, res) => {
  res.send("JohuCraft Backend Server Running...!");
});

app.listen(port, () => console.log("App running on port", port));
