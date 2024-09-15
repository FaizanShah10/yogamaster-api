const {Router} = require('express');
const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const router = Router()
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const {verifyJWT} = require('../services/authentication')
const {verifyAdmin} = require('../middlewares/verification')
const {verifyInstructor} = require('../middlewares/verification')

router.use(cors());
router.use(express.json());

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

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

const classCollection = database.collection("classes");
const cartCollection = database.collection("cart");
const paymentCollection = database.collection("payment");
const enrolledCollection = database.collection("enrolled");


//payment methods using stripe
// 1.Create server
// 2. creating payment intent
// 3. Configure Payment methods

//creating a new payment intent
router.post('/create-payment-intent', async (req, res) => {
  // try {
  //   const { price } = req.body;
  //   const amount = parseInt(price) * 100;

  //   // Create a PaymentIntent with the order amount and currency
  //   const paymentIntent = await stripe.paymentIntents.create({
  //     amount: amount,
  //     currency: 'usd',
  //     payment_method_types: ['card']
  //   });

  //   res.send({
  //     clientSecret: paymentIntent?.client_secret
  //   });
  // } catch (error) {
  //   console.error('Error creating payment intent:', error);
  //   res.status(500).send('Internal Server Error');
  // }

  const {products} = req.body
  console.log(products)

  const lineItems = products.map((product) => ({
    price_data: {
        currency: 'usd',
        product_data: {
            name: product.name,
            description: product.description,
        },
        unit_amount: parseInt(product.price) * 100,
    },
    quantity: product.quantity,
}));

const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: 'http://localhost:5173/success', 
    cancel_url: 'http://localhost:5173/cancel',   
});

res.json({ id: session.id });

})


//POST PAYMENT INFORMAION TO DB
router.get('/payment-info',verifyJWT, async (req, res) => {
    const paymentInfo = req.body
    const classesId = paymentInfo.classesId
    const userEmail = paymentInfo.userEmail
    const singleClassId = paymentInfo.singleClassId

    let query
    if(singleClassId){
      query = {classId: singleClassId , userMail: userEmail}
    }else{
      query = {classId: {$in: classesId}}
    }

    const queryClasses = {_id: {$in: classesId.map(id => new ObjectId(id))}}  //--> query classes based on their Ids

    //DATABASE OPERATIONS
    const classes = await classCollection.find(queryClasses).toArray()
    
    //storing new Enrolled Data
    const newEnrolledData = {
      userEmail: userEmail,
      classesId: classesId.map(id => ObjectId(id)),
      transactionId: paymentInfo.transactionId
    }

    //updating Doc 
    //1. Available Seats
    //2. Total Enrolled
    const updateDoc = {
      $set: {
        totalEnrolled: classes.reduce((total, current) => total + current.totalEnrolled, 0) + 1 || 0,
        availableSeats: classes.reduce((total, current) => total + current.availableSeats, 0) - 1 || 0
      }
    }

    const updatedResult = await classCollection.updateMany(queryClasses, updateDoc, {upsert: true})
    const enrolledData = await enrolledCollection.insertOne(newEnrolledData)
    const deletedResult = await cartCollection.deleteMany(query)
    const paymentData = await paymentCollection.insertOne(paymentInfo)

    res.send({updatedResult, enrolledData, deletedResult, paymentData})

})

//payment history
router.get('/payment-history/:email',verifyJWT, async (req, res) => {
    const email = req.params.email
    const query = {userEmail: email}
    const result = await paymentCollection.find(query).sort({date: -1}).toArray()
    
    res.send(result)
})

//payment history length
router.get('/payment-history-length/:email', async (req, res) => {
  const email = req.params.email
  const query = {userEmail: email}
  const result = await paymentCollection.countDocuments(query)
  res.send(result)
})



module.exports = router

