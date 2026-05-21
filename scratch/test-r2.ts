import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function testR2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  console.log("R2 Config:");
  console.log("Endpoint:", endpoint);
  console.log("AccessKey:", accessKeyId);
  console.log("Bucket:", bucket);

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("Missing R2 env vars");
    return;
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  try {
    console.log("Uploading test file to R2...");
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: "uploads/test-connection.txt",
      Body: "Hello Connection Test",
      ContentType: "text/plain",
    });

    const res = await client.send(command);
    console.log("Upload Success!", res);
  } catch (err: any) {
    console.error("Upload Failed with error:", err.message, err.stack);
  }
}

testR2();
