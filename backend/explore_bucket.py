import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

bucket = os.getenv("S3_BUCKET_NAME")

# List contents of the bucket
response = s3.list_objects_v2(Bucket=bucket)

print("📂 Files in bucket:")
for obj in response.get("Contents", []):
    print("-", obj["Key"])
