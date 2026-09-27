// One-off: allow the site's origins to upload directly to the videos bucket.
// Run with: node --env-file=.env.local scripts/set-bucket-cors.mjs
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: process.env.S3_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedOrigins: [
            "https://vclax.elikuang.com",
            "https://web-production-a7d33d.up.railway.app",
            "http://localhost:3100",
          ],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  }),
);
const out = await s3.send(new GetBucketCorsCommand({ Bucket: process.env.S3_BUCKET }));
console.log(JSON.stringify(out.CORSRules));
