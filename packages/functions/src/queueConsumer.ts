import AWS from "aws-sdk";
import {SQSHandler} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import {debug} from "util";
import {createOrIncrement, getInternal} from "./dynamoDb";

const dynamoDb = new DynamoDB.DocumentClient();
const NUM_RETRIES = 5;
AWS.config.logger = { log: debug };

export const handler: SQSHandler = async (event) => {

    //Get table name from environment variables
    //Throw error if not configured, this will keep messages in queue
    const tableName = process.env.tableName;
    if (tableName == undefined) {
        throw Error("Table name not defined.");
    }

    //one event can contain several messages, iterate over them
    for (const record of event.Records) {

        let brandName = record.body;

        //since we need to retry the write to the DB, let's keep track of how many times we try,
        //and if we are successful
        let success = false;
        let n_retries = 0;
        let otherError = undefined;

        do {
            // read from db, re-read if we failed the write
            const results = await getInternal(tableName, brandName);

            //if Item is undefined, this brand name did not exist in database, and has 0 hits
            let count = results.Item ? results.Item.num : 0;

            console.log(`updating ${brandName} to ${count + 1}`);

            //if the conditional check fails, we should retry
            await createOrIncrement(tableName, brandName, count).then(() => {
                // no errors + conditional check passed
                success = true;
            }, (error) => {
                // Conditional check failed, or other error.
                // Save the error for later.
                success = false;
                otherError = error;
            });

            // keep trying while unsuccessful, but only for NUM_RETRIES
        } while (!success && ++n_retries < NUM_RETRIES);

        // something went very wrong, log the error
        if (otherError != undefined && !success) {
            console.error(otherError);
        }
    };
}