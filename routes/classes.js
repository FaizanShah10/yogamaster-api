const {Router} = require('express');
const router = Router()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const {verifyJWT} = require('../services/authentication')
const {verifyAdmin} = require('../middlewares/verification')
const {verifyInstructor} = require('../middlewares/verification')


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

    //create new class
    router.post('/new-class',verifyJWT, verifyInstructor, async (req, res) => {
    const newClass = req.body;
    const result = await classCollection.insertOne(newClass);
    res.send(result);
    });

    //show classes based on intructor email
    router.get('/classes/:email', verifyJWT, verifyInstructor, async (req, res) => {
        const email = req.params.email;
        const query = { instructorEmail: email };
        const result = await classCollection.find(query).toArray();
        res.send(result);
    })
    


    //show approaved classes only   
    router.get('/classes',  async(req, res) => {
           const result = await classCollection.find().toArray()
           res.send(result)
    })

    //manage classes
    router.get('/classes-manage',verifyJWT, verifyAdmin, async (req, res) => {
        const result = await classCollection.find().toArray()
        res.send(result)
    })

    //change-status of a class -- bases on id
    router.put('/change-status/:id',verifyJWT, verifyAdmin, async (req, res) =>{
        const id = req.params.id
        const status = req.body.status
        const reason = req.body.reason
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true}
        const updateDoc = {
            $set: {
                status: status,
                reason: reason
            }
        }
        const result = await classCollection.updateOne(filter, updateDoc, options)
        res.send(result)
    })

    //show approved classes
    router.get('/approved-classes/:email', async (req, res) => {
        const email = req.params.email;
        const query = {status: "approved", email: email}
           const result = await classCollection.find(query).toArray()
           res.send(result) 
    })

    //un-publishes a course / deletes
    router.delete('/unpublish/:id', verifyJWT, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
    
        try {
            const result = await classCollection.deleteOne(filter);
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: 'Failed to delete the class', error });
        }
    });

    //show Pending classes
    router.get('/pending-classes/:email', async (req, res) => {
        const email = req.params.email;
        const query = {status: "pending", email: email}
           const result = await classCollection.find(query).toArray()
           res.send(result) 
    })

    //show class data on id
    router.get('/class/:id', async (req, res) => {
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await classCollection.findOne(query)
        res.send(result)
    });

    //update class data
    router.put('/update-data/:id',verifyJWT, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const updateClass  = req.body
        const filter = { _id: new ObjectId(id) };
        const options = {upsert: true}
        const updateDoc = {
            $set:{
                name: updateClass.name,
                description: updateClass.description,
                status: updateClass.status,
                price: updateClass.price,
                availableseats: updateClass.availableseats,
            }
        }
        const result = await classCollection.updateOne(filter, updateDoc, options)
        res.send(result) 
    })


module.exports = router