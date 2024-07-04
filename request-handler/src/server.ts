import express from "express";
import { S3 } from "aws-sdk";
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3({
  accessKeyId: "162f223a76affc6159545f47d9a1c673",
  secretAccessKey: "4fb882de361f08485b9e46b436b04f67fa8b0fd9d0591514a9cee875fcf76da0",
  endpoint: "https://333042712cd6ef85de4f399a2789813a.r2.cloudflarestorage.com"
})

const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path.substring(1); // remove leading slash
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
