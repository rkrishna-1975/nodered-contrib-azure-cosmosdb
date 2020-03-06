const { CosmosClient } = require("@azure/cosmos");
const Utils = require("../index");

// Define connection string and related Service Bus entity names here


module.exports = function (RED) {
  function AZCosmosDBWrite(config) {
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

    node.writeToDb = async ((item,container,options) => {
        const response = await container.items.upsert(item, options);
        return { item: response.item, statusCode: response.statusCode, substatus: response.substatus};
    });
    
    node.on('input',(msg) => {
        try{
            const database = cosmosClient.database(msg.databaseId||databaseId);
            const container = database.container(msg.containerId||containerId);
        
            if (msg.payload instanceof Array) {
                var returnStatus = [];
                msg.payload.forEach(item => {
                    try{
                        returnStatus.push(node.writeToDb(item,container,{}));
                    } catch(err) {
                        returnStatus.push({'item': item, 'error': err});
                    }                    
                }); 
                msg.payload = returnStatus;
            } else {
                var returnStatus;
                try{
                    returnStatus = node.writeToDb(item,container,{});
                } catch(err) {
                    returnStatus = {'item': item, 'error': err} ;
                }                    
                msg.payload = returnStatus;
            }
            node.send(msg);
        } catch(err) {
            msg.error = err;
            node.send(msg);
            node.error("Error occured" + err);
        }
    });

    node.on('close', () => {
      
    });
  }
  RED.nodes.registerType("az-cosmosdb-write", AZCosmosDBWrite);
}