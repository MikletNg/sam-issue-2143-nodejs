const axios = require('axios')
const moment = require('moment');
const url = 'http://checkip.amazonaws.com/';
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const {v4: uuidV4} = require('uuid');

let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const ret = await axios(url);
        const {data: ipAddress} = await axios.get(url);
        const item = {
            id: uuidV4(),
            timestamp: moment().unix(),
            ipAddress: ipAddress.replace(/\s+/g," ").trim()
        }
        console.log(JSON.stringify({lambdaCreationItem: item}, null, 2));
        console.log(process.env.tableName)
        const itemPutResponse = await ddb.put({
            TableName: process.env.tableName,
            Item: item
        }).promise();
        console.log(`DynamoDB Table Put Response:`, JSON.stringify(itemPutResponse, null, 2));
        const itemGetResponse = await ddb.get({
            TableName: process.env.tableName,
            Key: {
                id: item.id
            }
        }).promise();
        console.log(`DynamoDB Table Get Response:`, JSON.stringify(itemGetResponse, null, 2));
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: {
                    lambdaCreationItem: item,
                    itemPutResponse,
                    itemGetResponse
                }
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
