import { StackContext, Api, Bucket, Queue, Table } from "sst/constructs";
export function API({ stack }: StackContext) {

  // DynamoDB table where brand names, and their count will be stored
  const brandsTable = new Table(stack, "BrandsTable", {
    fields: {
      brand: "string",
      num: "number",
    },

    //use brand name as primary index
    primaryIndex: { partitionKey: "brand" },
  });

  // create a queue, where we can post the brand names parsed from the file uploaded to s3
  const s3NotificationQueue = new Queue(stack, "s3NotificationQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/queueConsumer.handler",  // this is the message handler
        environment: { tableName: brandsTable.tableName },  // the message handler needs to know the table name
        permissions: [brandsTable],                         // and it needs permissions to write to the table
      },
    },
  });

  // create a s3 bucket
  const s3Bucket = new Bucket(stack, "Brands", {
    notifications: {
      // create a notification that will be activated on updates to the bucket
      myNotification: {
        function: {
          // this is the function that will be called
          handler: "packages/functions/src/s3ObjectCreated.handler",
          // the function needs to know the URL of the SQS queue
          environment: { queueUrl: s3NotificationQueue.queueUrl },
        },
        events: ["object_created"],  // only run the function when files are uploaded
      },
    },
  });

  // the bucket's notification handler needs to read the file from the bucket, as well as posting
  // messages to the SQS queue
  s3Bucket.attachPermissions([s3Bucket, s3NotificationQueue]);

  // create an endpoint where we can query the brands
  /*const api = new Api(stack, "api", {
    routes: {
      "GET /brand/{brandName}": "packages/functions/src/query.handler",
    },
  }); */

 const api = new Api(stack, "api", {
    routes: {
      "GET /brand/{brandName}": {
        function: {
          handler: "packages/functions/src/query.handler",
          timeout: 20,
          environment: { tableName: brandsTable.tableName },
          permissions: [brandsTable],
        },
      },
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    BucketName: s3Bucket.bucketName,
    QueueName: s3NotificationQueue.queueName,
    TableName: brandsTable.tableName,
  });
}
