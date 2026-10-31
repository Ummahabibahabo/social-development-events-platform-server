import express from 'express';
import cors from "cors";
import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config'
const app = express();
const port =process.env.port|| 5000;
// middleware

app.use(express.json());
app.use(cors());

// mongoDb connect

const uri = process.env.MONGO_DB_URL;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {

  // Get database and collection
  const database = client.db("social_event_db");
  const socialEventCollection=database.collection("socialEvents")
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(erroe){
    console.log("Pinged your deployment.You are not successfully connected to MongoDb")
  }
}
run()

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});