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
            await db.collection('sessions').doc('/' + id + '/')
            .create({
                owner: req.body.owner,
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
            let response = session.data();
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
            const document = db.collection('sessions').doc(req.params.id);

            let session = await document.get();
            let reservations = session.data().reservations;

            // Things to check
            // - reservation with name is ours

            if (reservations.some(e => e.itemId === req.body.itemId)) {
                error = {message: "This item is reserved by someone already."}
                return res.status(403).send(error);
            }

            if (reservations.some(e => e.name === req.body.name)) {
                reservations = reservations.filter(e => !(e.name === req.body.name));
            }

            const modifiedAt = new Date().valueOf();
            const newReservation = {name: req.body.name, itemId: req.body.itemId, modifiedAt: modifiedAt};
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
            const document = db.collection('sessions').doc(req.params.id);

            let session = await document.get();
            let reservations = session.data().reservations;

            if (reservations.some(e => e.name === req.body.name)) {
                reservations = reservations.filter(e => !(e.name === req.body.name));
            }

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

// Export the api to Firebase Cloud Functions
exports.app = functions.https.onRequest(app);