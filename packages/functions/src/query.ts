import { ApiHandler } from "sst/node/api";
import { Time } from "@test1/core/time";
import {getInternal} from "./dynamoDb";

export const handler = ApiHandler(async (evt) => {

  if (evt.pathParameters == undefined
      || evt.pathParameters.brandName == undefined
      || evt.pathParameters.brandName == "") {
    return {
      body: `Please supply a brand name.`,
    };
  }

  const brandName = evt.pathParameters.brandName;

  //Get table name from environment variables
  //Throw error if not configured, this will keep items in queue
  const tableName = process.env.tableName;
  if (tableName == undefined) {
    throw Error("Table name not defined.");
  }

  let results = await getInternal(tableName, brandName);
  let count = results.Item ? results.Item.num : 0;

  return {
    body: `Brand ${brandName} has ${count} hits`,
  };
});
