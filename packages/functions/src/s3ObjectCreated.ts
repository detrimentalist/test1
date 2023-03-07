import AWS from "aws-sdk";
import * as readline from 'readline';
import { S3Handler } from "aws-lambda";
import {debug} from "util";
const s3 = new AWS.S3();
const sqs = new AWS.SQS();
AWS.config.logger = { log: debug };

export const handler: S3Handler = async (event) => {

    const queueUrl = process.env.queueUrl;
    if (queueUrl == undefined) {
        throw Error("QueueUrl not defined.");
    }

    //iterate over all uploaded files
    for (const _s3record of event.Records ) {
        const s3Record = _s3record.s3;

        // Grab the filename and bucket name
        const Key = s3Record.object.key;
        const Bucket = s3Record.bucket.name;

        //keep track of errors and empty files
        let errors = false;
        let lines = 0;

        //catch any parsing or I/O related errors
        try {
            const readStream = s3.getObject({Bucket, Key}).createReadStream();

            const lineReader = readline.createInterface({
                input: readStream
            });

            // Each line in the file will be successively available here as `line`.
            for await (const line of lineReader) {
                // keep track of lines in file
                lines++;

                console.log(`Line from file: ${line}`);

                await sqs.sendMessage({
                        QueueUrl: queueUrl.toString(),
                        MessageBody: line,
                    }).promise();

            }
        } catch (error) {
            errors = true;
            console.error(`Error parsing file! ${Key}`);
            console.error(error);
        }

        // empty file, complain
        if (lines == 0) {
            errors = true;
            console.error(`Empty file! ${Key}`);
        }

        // only delete file if there was no errors
        if (!errors) {
            await s3.deleteObject({Bucket, Key}).promise();
        }
    }
};