const {Router} = require('express');
const router = Router()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const {verifyJWT} = require('../services/authentication')
const {verifyInstructor, verifyAdmin} = require('../middlewares/verification')


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
    const enrolledCollection = database.collection("enrolled");
    const classCollection = database.collection("classes");
    const userCollection = database.collection('users') 
    const appliedCollection = database.collection('applied')


//popular classes
router.get('/popular_classes', async (req, res) => {
    const popularClasses = await classCollection.find().sort({totalEnrolled: -1}).limit(6).toArray()
    res.send(popularClasses)
})

//enrolled classes
router.get('/enrolled-classes/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { userEmail: email };
    const pipeline = [
        {
            $match: query
        },
        {
            $lookup: {
                from: "classes",
                localField: "classesId",
                foreignField: "_id",
                as: "classes"
            }
        },
        {
            $unwind: "$classes"
        },
        {
            $lookup: {
                from: "users",
                localField: "classes.instructorEmail",
                foreignField: "email",
                as: "instructor"
            }
        },
        {
            $project: {
                _id: 0,
                classes: 1,
                instructor: {
                    $arrayElemAt: ["$instructor", 0]
                }
            }
        }

    ]
    const result = await enrolledCollection.aggregate(pipeline).toArray();
    // const result = await enrolledCollection.find(query).toArray();
    res.send(result);
})


//get all instructors
router.get('/instructors', async (req, res) => {
    const result = await userCollection.find({role: "instructor"}).toArray()
    res.send(result)
})


//enrolled classes of user (based on email)
router.get('/enrolled_classes/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const query = { userEmail: email };
    const pipeline = [
        {
            $match: query
        },
        {
            $lookup: {
                from: "classes",
                localField: "classesId",
                foreignField: "_id",
                as: "classes"
            }
        },
        {
            $unwind: "$classes"
        },
        {
            $lookup: {
                from: "users",
                localField: "classes.instructorEmail",
                foreignField: "email",
                as: "instructor"
            }
        },
        {
            $project: {
                _id: 0,
                classes: 1,
                instructor: {
                    $arrayElemAt: ["$instructor", 0]
                }
            }
        }

    ]
    const result = await enrolledCollection.aggregate(pipeline).toArray();
    // const result = await enrolledCollection.find(query).toArray();
    res.send(result);
})


//applied for instructor
router.post('/instructor_application', async (req, res) => {
    const data = req.body
    const result = await appliedCollection.insertOne(data)
    res.send(result)
})

//get applied instructors
router.get('/applied_instructors/:email',verifyJWT, verifyAdmin, async (req, res) => {
    const email = req.params.email
    const result = await appliedCollection.findOne({email})
    res.send(result)
})


module.exports = router