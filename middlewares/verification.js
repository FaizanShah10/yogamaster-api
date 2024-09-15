require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.c8uq1zy.mongodb.net`;

    const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
    });

    client.connect();


const database = client.db('yoga-master');
const userCollection = database.collection('users') 


 
//middleware for admin and insructor
 const verifyAdmin =  async (req, res, next) => {
    const email = req.decoded.email
    const query = {email: email}
    const user = await userCollection.findOne(query)
    if(user.role === 'admin'){
      next()
    }
    else{
      return res.status(403).send({error: "You are not authorized"})
    }
}

const verifyInstructor =  async (req, res, next) => {
  const email = req.decoded.email
  const query = {email: email}
  const user = await userCollection.findOne(query)
  if(user.role === 'instructor'){
    next()
  }
  
}

module.exports = {
    verifyAdmin,
    verifyInstructor
}