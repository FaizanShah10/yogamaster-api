//token generation and verification
const {Router} = require('express');
const router = Router()
var jwt = require('jsonwebtoken');



// //token generate
// router.post('/api/set_token', (req, res) => {
//     console.log("Setting token")
//     const user = req.body;
//     const token = jwt.sign(user, process.env.SECRET_KEY, {
//     expiresIn: '24h'
//     })
//     res.send({token})
// })

//token verification


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        console.error('Authorization header missing');
        return res.status(401).send({ error: true, message: 'Unauthorized access' });
    }

    const token = authorization.split(' ')[1];

    if (!token) {
        console.error('Token not provided');
        return res.status(401).send({ error: true, message: 'Token not provided' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.status(403).send({ error: true, message: 'Forbidden user or token has expired' });
        }
        //console.log('Decoded JWT:', decoded); 
        req.decoded = decoded;
        next();
    });
}


module.exports = {
    verifyJWT
}
