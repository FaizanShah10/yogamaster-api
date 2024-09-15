const {Router} = require('express');
const router = Router()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const {verifyJWT} = require('../services/authentication')


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
    const cartCollection = database.collection("cart");
    const classCollection = database.collection("classes")
    


    //add new cart item 
    router.post('/add-to-cart',verifyJWT, async (req, res) => {
        const newCartItem = req.body
        const result = await  cartCollection.insertOne(newCartItem);
        res.send(result)
    })

    //get cart items by id
    router.get('/cart-item/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { classId: id, userMail: email };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, { projection: projection });
      res.send(result);
  })

    //get cart information by user email
    router.get('/cart/:email', verifyJWT, async (req, res) => {
      try {

        const email = req.params.email


  
          const query = { userMail: email };
          const projection = { classId: 1 };
        
  
          const carts = await cartCollection.find(query, { projection: projection }).toArray();
          //console.log('Carts:', carts); // Debugging line
  
          const classIds = carts.map((cart) => new ObjectId(cart.classId));
          //console.log('Class IDs:', classIds); // Debugging line
  
          const query2 = { _id: {$in: classIds} };
          //console.log("Query 2: ",query2)
          const result = await classCollection.find(query2).toArray();
          //console.log('Result:', result); // Debugging line
  
          res.send(result);
      } catch (error) {
          console.error('Error fetching cart:', error);
          res.status(500).send({ error: true, message: 'Internal Server Error' });
      }
  });


    //delete a cart item
    router.delete("/removeFromCart/:id",verifyJWT, async (req, res) => {
      const id = req.params.id
      const query = {classId: id}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })


module.exports = router