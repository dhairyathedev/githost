import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import stream from "stream";
import { exec } from "child_process";
import { config } from "dotenv";

const pipeline = promisify(stream.pipeline);

if (process.env.NODE_ENV !== 'production') {
  config();
}

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  httpOptions: {
    timeout: 300000,
    connectTimeout: 10000,
  },
  maxRetries: 10,
});

export const downloadFilesFromS3 = async (prefix: string, downloadDir: string): Promise<void> => {
  const bucketName = "source";

  let continuationToken: string | undefined = undefined;

  do {
    const response: any = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }).promise();

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key) {
          const filePath = path.join(downloadDir, item.Key.replace(prefix, ""));
          const fileDir = path.dirname(filePath);

          await fs.promises.mkdir(fileDir, { recursive: true });

          const params = {
            Bucket: bucketName,
            Key: item.Key,
          };

          const fileStream = fs.createWriteStream(filePath);
          const s3Stream = s3.getObject(params).createReadStream();

          await pipeline(s3Stream, fileStream);
        }
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
};

const execPromise = promisify(exec);

export const buildRepo = async (repoPath: string): Promise<string> => {
  const packageJsonPath = path.join(repoPath, "package.json");
  let buildDir = "";

  if (fs.existsSync(packageJsonPath)) {
    try {
      await execPromise(`npm install`, { cwd: repoPath });
      await execPromise(`npm run build`, { cwd: repoPath });

      if (fs.existsSync(path.join(repoPath, "build"))) {
        buildDir = path.join(repoPath, "build");
      } else if (fs.existsSync(path.join(repoPath, ".next"))) {
        buildDir = path.join(repoPath, ".next");
      }
    } catch (error) {
      console.error("Build failed:", error);
      throw new Error("Build failed");
    }
  }

  return buildDir;
};

export const uploadDirectoryToS3 = async (dirPath: string, s3Bucket: string, s3Prefix: string): Promise<void> => {
  const files = await getAllFiles(dirPath);

  await Promise.all(files.map(async (filePath) => {
    const fileContent = fs.createReadStream(filePath);
    const s3Key = path.join(s3Prefix, path.relative(dirPath, filePath));
    console.log(`S3 Key: ${s3Key}`)
    const params = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: fileContent,
    };

    await s3.upload(params).promise();
  }));
};

const getAllFiles = async (dir: string, fileList: string[] = []): Promise<string[]> => {
  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.promises.lstat(filePath);

    if (stat.isDirectory()) {
      fileList = await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
};
