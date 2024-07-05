import express from "express";
import { S3 } from "aws-sdk";
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: "https://***REMOVED***.r2.cloudflarestorage.com"
});

const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    let filePath = req.path.substring(1); // remove leading slash
    
    if (filePath === "") {
        filePath = "index.html";
    }

    const key = `builds/${id}/${filePath}`;
    
    console.log(`Requesting key: ${key}`);

    try {
        const contents = await s3.getObject({
            Bucket: "source",
            Key: key
        }).promise();

        const type = filePath.endsWith("html") ? "text/html" :
                     filePath.endsWith("css") ? "text/css" : 
                     "application/javascript";
        res.set("Content-Type", type);
        res.send(contents.Body);
    } catch (err) {
        console.error(err);
        res.status(404).send("File not found");
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});