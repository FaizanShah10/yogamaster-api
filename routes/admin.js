const express = require('express');
const router = express.Router();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const {verifyJWT} = require('../services/authentication')
const {verifyAdmin} = require('../middlewares/verification')

    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.c8uq1zy.mongodb.net/?retryWrites=true&w=majority&appName=yoga-master`;


    const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
    });

    client.connect();

    const database = client.db('yoga-master');
    const userCollection = database.collection("users");
    const classCollection = database.collection("classes");
    const enrolledCollection = database.collection("enrolled")

//get admin stats
router.get('/admin-stats', verifyJWT, verifyAdmin, async (req, res) => {
    // Get approved classes and pending classes and instructors 
    const approvedClasses = (await classCollection.find({ status: 'approved' }).toArray()).length;
    const pendingClasses = (await classCollection.find({ status: 'pending' }).toArray()).length;
    const instructors = (await userCollection.find({ role: 'instructor' }).toArray()).length;
    const totalClasses = (await classCollection.find().toArray()).length;
    const totalEnrolled = (await enrolledCollection.find().toArray()).length;
    // const totalRevenue = await paymentCollection.find().toArray();
    // const totalRevenueAmount = totalRevenue.reduce((total, current) => total + parseInt(current.price), 0);
    const result = {
        approvedClasses,
        pendingClasses,
        instructors,
        totalClasses,
        totalEnrolled,
        // totalRevenueAmount
    };
    res.send(result);
});



module.exports = router