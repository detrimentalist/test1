import { DynamoDB } from "aws-sdk";
const dynamoDb = new DynamoDB.DocumentClient();

export const getInternal = async (tableName: string, objectKey: string) => {
    const getParams = {
        TableName: tableName,
        Key: {
            brand: objectKey,
        },

        ConsistentRead: true,
    };

    return dynamoDb.get(getParams).promise();
}

export const createOrIncrement = async (tableName: string, objectKey: string, count: number) => {

    const putParams = {
        TableName: tableName,
        Key: {
            brand: objectKey,
        },

        //check that we are either creating a new value, or that it hasn't been updated concurrently
        ConditionExpression: "attribute_not_exists(num) OR num = :oldCount",
        UpdateExpression: "SET num = :count",
        ExpressionAttributeValues: {
            ":oldCount": count,
            ":count": ++count,
        },
    };

    return dynamoDb.update(putParams).promise();
}