const { CosmosClient } = require("@azure/cosmos");
const Utils = require("../index");

// Define connection string and related Service Bus entity names here


module.exports = function (RED) {
  function AZCosmosDBRead(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.debug("Loaded the Loaded cosmos reader");
    const endpoint = RED.nodes.getNode(config.connection).endpoint;
    const key = RED.nodes.getNode(config.connection).key;
    const databaseId = config.databaseId;
    const containerId = config.containerId;
    const query = config.query;
    const utils = new Utils();

    const cosmosClient = new CosmosClient({ endpoint, key });
    
    node.on('input',(msg) => {
        try{
            const database = cosmosClient.database(msg.databaseId||databaseId);
            const container = database.container(msg.containerId||containerId);
        
            const querySpec = {
                "query": msg.query||query
            }

            container.items.query(querySpec).fetchAll().then((response) => {
                msg.payload = response.resources;
                node.send(msg);
            }).catch((err) => {
                msg.error = err;
                node.send(msg);
                node.error("Error occured" + err);
            })
        } catch(err) {
            msg.error = err;
            node.send(msg);
            node.error("Error occured" + err);
        }
    });



    node.on('close', () => {
      
    });
  }
  RED.nodes.registerType("az-cosmosdb-read", AZCosmosDBRead);
}