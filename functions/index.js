const functions = require('firebase-functions');
const admin = require("firebase-admin");
const cors = require('cors')({
    origin: true
});

exports.getText = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        let input = {
            address: req.body.address || "N/A",
        };
        (() => {
            if (input.address === "N/A") {
                res.send({
                    data: {
                        message: "No input given !"
                    }
                });
            }
        })();

        async function quickstart() {
            // Imports the Google Cloud client library
            const vision = require('@google-cloud/vision');

            // Creates a client
            const client = new vision.ImageAnnotatorClient();
            const bucketName = 'simple-qna.appspot.com';
            const fileName = input.address;
            console.log(`gs://${bucketName}/pic/${fileName}`)
            // Performs label detection on the image file
            const [result] = await client.textDetection(`gs://${bucketName}/pic/${fileName}`);
            // const labels = result.labelAnnotations;
            // labels.forEach(label => console.log(label.description));

            res.send({
                data: {
                    text: result.fullTextAnnotation.text || "N/A"
                }
            });
        }

        await quickstart();
    })
});


exports.deleteOldFiles = functions.pubsub.schedule('0 0 1 * *').onRun((context) => {
    admin.storage()
        .bucket('simple-qna.appspot.com')
        .getFiles()
        .then(results => {
            //delete file that is older than 30 day
            results[0].forEach(file => {
                const fileDate = new Date(file.metadata.timeCreated);
                const now = new Date();
                const diff = now.getTime() - fileDate.getTime();
                const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
                if (diffDays > 30) {
                    admin.storage().bucket('simple-qna.appspot.com').file(file.metadata.name).delete();
                }
            });
            return null;
        })
        .catch(err => {
            console.log(err);
        });

});
