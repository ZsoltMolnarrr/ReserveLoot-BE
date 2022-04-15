const functions = require("firebase-functions");

var admin = require("firebase-admin");
var serviceAccount = require("../../reserveloot-a4576-firebase-adminsdk-y5bab-8da9c8f62c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reserveloot-a4576-default-rtdb.europe-west1.firebasedatabase.app"
});

const express = require("express");
const app = express();
const db = admin.firestore();
const cors = require("cors");
const { nanoid } = require('nanoid')
app.use( cors( { origin:true } ) );

// Create
app.post('/api/session', (req, res) => {
    ( async () => {
        try {
            const id = nanoid(10);
            const createdAt = new Date().valueOf();
            const secret = readSecret(req);
            let maximumReservationsPerUser = req.body.maximumReservationsPerUser ?? 1;
            if (maximumReservationsPerUser < 1) {
                maximumReservationsPerUser = 1;
            }
            await db.collection('sessions').doc('/' + id + '/')
            .create({
                owner: req.body.owner,
                secret: secret,
                description: req.body.description,
                createdAt: createdAt,
                reservations: []
            })
            const response = {id: id}
            return res.status(200).send(response)
        }
        catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Read
// Get single session with Id
app.get('/api/session/:id', (req, res) => {
    ( async () => {
        try {
            const document = db.collection('sessions').doc(req.params.id);
            let session = await document.get();
            let response = stripedSecretFromSession(session.data());
            return res.status(200).send(response)
        }
        catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Update
// Put reservation
app.put('/api/session/:id/reservations', (req, res) => {
    ( async () => {
        try {
            const secret = readSecret(req);
            const itemId = req.body.itemId
            const name = req.body.name

            const document = db.collection('sessions').doc(req.params.id);
            let sessionDoc = await document.get();
            let session = sessionDoc.data();
            let reservations = session.reservations;

            // Checks
            let exisitingForSameItem = reservations.find(e => e.itemId === itemId);
            if (exisitingForSameItem) {
                error = {message: "This item is already reserved."};
                return res.status(403).send(error);
            }

            let exisitingForSameSecret = reservations.find(e => e.secret === secret);
            if (exisitingForSameSecret) {
                error = {message: "You already have a reservation."};
                return res.status(403).send(error);
            }

            // Creating reservation
            const modifiedAt = new Date().valueOf();
            const newReservation = {
                secret: secret,
                name: name, 
                itemId: itemId, 
                modifiedAt: modifiedAt
            };
            reservations.push(newReservation);

            await document.update({
                reservations: reservations
            });
            
            return res.status(200).send();
        }
        catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Delete
// Delete reservation
app.delete('/api/session/:id/reservations', (req, res) => {
    ( async () => {
        try {
            const secret = readSecret(req);
            const name = req.body.name

            const document = db.collection('sessions').doc(req.params.id);
            let sessionDoc = await document.get();
            let session = sessionDoc.data();
            let reservations = session.reservations;

            // Checks
            let exisiting = reservations.find(e => e.name === name);
            if (exisiting == null) {
                error = {message: "Reservation not found."};
                return res.status(403).send(error);
            }

            const permittedToDelete = secret == exisiting.secret  || secret == session.secret;
            if (!permittedToDelete) {
                error = {message: "You cannot delete that reservation."};
                return res.status(403).send(error);
            }

            // Deleting
            reservations = reservations.filter(e => !(e.name === name));

            await document.update({
                reservations: reservations
            });
            
            return res.status(200).send();
        }
        catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

function readSecret(req) {
    let secret = req.headers.secret;
    if (secret == null) {
        throw 'Missing secret from header';
    }
    return secret
}

function stripedSecretFromSession(session) {
    delete(session.secret);
    session.reservations = stripedSecretFrom(session.reservations);
    return session
}

function stripedSecretFrom(reservations) {
    for (r of reservations) {
        delete(r.secret);
    }
    return reservations
}

// Export the api to Firebase Cloud Functions
exports.app = functions.https.onRequest(app);