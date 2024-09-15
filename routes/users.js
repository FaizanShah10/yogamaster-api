const {Router} = require('express');
const router = Router()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const {verifyJWT} = require('../services/authentication')
const {verifyAdmin} = require('../middlewares/verification')
const {verifyInstructor} = require('../middlewares/verification')


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.c8uq1zy.mongodb.net`;

// Middleware for validating ObjectId
const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && (String(new ObjectId(id)) === id);
}


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


    //token creation

    //create new user
    router.post('/new_user', async (req, res) => {
        const data = req.body
        const result = await userCollection.insertOne(data)
        res.send(result)
    })

    //get all users
    router.get('/users', async (req, res) => {
        const result = await userCollection.find( {} ).toArray()
        res.send(result)
    })

    //get users by id
    router.get("/users/:id", async (req, res) => {
        const id = req.params.id;
    
        if (!isValidObjectId(id)) {
            return res.status(400).send({ error: 'Invalid user ID format' });
        }
    
        try {
            const result = await userCollection.findOne({ _id: new ObjectId(id) });
            if (!result) {
                return res.status(404).send({ error: 'User not found' });
            }
            res.send(result);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).send({ error: 'Internal server error' });
        }
    });

    //get user by email
    router.get("/user/:email", async (req, res) => {
        const email = req.params.email
        const query = {email: email}
        const result = await userCollection.findOne(query)
        res.send(result)
    });
    

    //delete user by id
    router.delete('/delete_user/:id', verifyJWT, verifyAdmin, async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);
        res.send(result)
    })

    //update user data on id bases
    router.put('/update_user/:id', verifyJWT, verifyAdmin, async (req, res) => {
        const  id = req.params.id
        const updatedUser = req.body
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true}
        const updateDoc = {
            $set: {
                name: updatedUser.name,
                email: updatedUser.email,
                photoUrl: updatedUser.photoUrl,
                role: updatedUser.option,
                about: updatedUser.about,
                skills: updatedUser.skills ? updatedUser.skills : null,
                address: updatedUser.address
            }
        }

        const result = await userCollection.updateOne(filter,updateDoc, options )
        res.send(result)
    })


    module.exports = router