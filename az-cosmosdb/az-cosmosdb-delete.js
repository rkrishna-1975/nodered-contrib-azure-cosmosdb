const { CosmosClient } = require("@azure/cosmos");
const Utils = require("../index");

// Define connection string and related Service Bus entity names here


module.exports = function (RED) {
  function AZCosmosDBDelete(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.debug("Loaded the cosmos delete");
    const endpoint = RED.nodes.getNode(config.connection).endpoint;
    const key = RED.nodes.getNode(config.connection).key;
    const databaseId = config.databaseId;
    const containerId = config.containerId;
    const utils = new Utils();

    const cosmosClient = new CosmosClient({ endpoint, key });

    async function deleteFromDb(items,container,options,node,msg,done) {
        var returnResponses = [];
        for (let item of items) {
            var returnResponse = { 'item': item};
            try {
                node.debug("Deleting from db ");
                const response = await container.item(item.id,item.partition_key).delete(options);
                returnResponse.statusCode = response.statusCode;
                returnResponse.substatus = response.substatus;
                node.debug("received response: " + response.statusCode);
            } catch (err) {
                returnResponse.error = err;
                node.debug("Received error");
            } 
            returnResponses.push(returnResponse);
        }
        msg.payload = returnResponses;
        node.send(msg);
        if (done) done();
    }
    
    node.on('input',(msg,send,done) => {
        try{
            const database = cosmosClient.database(msg.databaseId||databaseId);
            const container = database.container(msg.containerId||containerId);
            node.debug("Received request to delete from database.");
            var items = [];
            if (msg.payload instanceof Array) {
                items = msg.payload;
            } else {
                items.push(msg.payload);
            }
            deleteFromDb(items,container,{},node,msg,done);
        } catch(err) {
            msg.error = err;
            node.send(msg);
            if (done) done(err); else  node.error("Error occured" + err);
        }
    });

    node.on('close', () => {
      
    });
  }
  RED.nodes.registerType("az-cosmosdb-delete", AZCosmosDBDelete);
}