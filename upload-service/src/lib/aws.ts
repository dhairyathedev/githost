import { S3 } from "aws-sdk";
import fs from "fs";

const s3 = new S3({
    accessKeyId: "162f223a76affc6159545f47d9a1c673",
    secretAccessKey: "12a6fcc70737960d11b8cfa114a33d394b6fe4880f3ed803818a8efadc8446dc",
    endpoint: "https://333042712cd6ef85de4f399a2789813a.r2.cloudflarestorage.com"
})

export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "source",
        Key: fileName,
    }).promise();
    console.log(response);
}