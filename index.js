const express = require('express');
var jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const classRoute = require('./routes/classes');
const cartRoute = require ('./routes/cart');
const paymentRoute = require('./routes/payment');
const enrolledRoute = require('./routes/enrolled');
const usersRoute = require('./routes/users');
const adminRoute = require('./routes/admin');


const app = express();
const port = 5000;

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'], // allow these headers
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

//middlewares
app.use(express.json());
app.use(cors(corsOptions));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.c8uq1zy.mongodb.net/?retryWrites=true&w=majority&appName=yoga-master`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db('yoga-master');
    const userCollection = database.collection("users");
    const classCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const paymentCollection = database.collection("payment");
    const enrolledCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");

    app.get('/', (req, res) => {
      res.send("Hello World");
    });

    app.use('/', classRoute);
    app.use('/', cartRoute);
    app.use('/', paymentRoute);
    app.use('/', enrolledRoute);
    app.use('/', usersRoute);
    app.use('/', adminRoute);

    app.post('/api/set_token', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, {
          expiresIn: '12h'
      });
      res.send({ token });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close(); // Commenting this out, we don't want to close the connection here
  }
}

async function startServer() {
  await run();
  app.listen(port, () => {
    console.log("Server is running on port 5000");
  });
}


startServer().catch(console.dir);
