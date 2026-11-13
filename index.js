import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
const app = express();
const port = process.env.port || 5000;
// middleware
app.use(cors());
app.use(express.json());
// mongoDb connect
const uri = process.env.MONGO_DB_URL;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// Get database and collection
const database = client.db("social_event_db");
const socialEventCollection = database.collection("socialEvents");
// Join  collection
const socialJoinEventCollection = database.collection("joinEvents");
// User collection
const userCollection = database.collection("user");
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (erroe) {
    console.log(
      "Pinged your deployment.You are not successfully connected to MongoDb",
    );
  }
}
run();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({
      message: "Token missing",
    });
  }
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(401).send({
      message: "Invalid token",
    });
  }
};
// createData post

app.post("/create-event", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await socialEventCollection.insertOne(data);
  res.send(result);
});
// upcomingEvent Data get
app.get("/upcoming-events", async (req, res) => {
  const cursor = socialEventCollection.find();
  const allData = await cursor.toArray();
  res.send(allData);
});

//  recent upcoming events based on date
app.get("/recent-events", async (req, res) => {
  const cursor = socialEventCollection
    .find()
    .sort({ "createEventData.date": 1 })
    .limit(6);
  const result = await cursor.toArray();
  res.send(result);
});

// upcomingDetailsData
app.get("/upcoming-event/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await socialEventCollection.findOne(query);
  res.send(result);
});
// UpcomingEvent By email
app.get("/upcoming-event-by-email/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const result = await socialEventCollection
    .find({ "createEventData.email": email })
    .toArray();
  res.send(result);
});
// UpcomingEvent-delete-by id

app.delete("/upcoming-event-by-delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await socialEventCollection.deleteOne(query);
  res.send(result);
});
// update UpComing Data
app.patch("/upcoming-update/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const query = { _id: new ObjectId(id) };
  const result = await socialEventCollection.updateOne(query, { $set: data });
  res.send(result);
});

// Get joinEvent

app.get("/join-events", async (req, res) => {
  const cursor = socialJoinEventCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// post joinEvent
app.post("/join-event", verifyToken, async (req, res) => {
  const { data } = req.body;

  const alreadyJoined = await socialJoinEventCollection.findOne({
    "data.email": data.email,
    "data.eventId": data.eventId,
  });

  if (alreadyJoined) {
    return res.status(409).send({
      message: "You have already joined this event!",
    });
  }

  const result = await socialJoinEventCollection.insertOne({ data });

  res.send(result);
});
// get email join event

app.get("/join-event/:email", async (req, res) => {
  const { email } = req.params;
  const result = await socialJoinEventCollection
    .find({ "data.email": email })
    .sort({ "data.createEventData.date": 1 })
    .toArray();
  res.send(result);
});

// my-join-delete-events
app.delete("/my-join-event/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await socialJoinEventCollection.deleteOne(query);
  res.send(result);
});

// get user profile
app.get("/user/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const result = await userCollection.findOne({ email });
  res.send(result);
});

// update user profile
app.patch("/update-profile/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const { name, image } = req.body;
  const result = await userCollection.updateOne(
    { email },
    { $set: { name, image, updatedAt: new Date() } },
  );
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
export default app;
