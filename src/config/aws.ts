import * as aws from "aws-sdk";

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "t3-images-bucket";
export const s3 = new aws.S3();
