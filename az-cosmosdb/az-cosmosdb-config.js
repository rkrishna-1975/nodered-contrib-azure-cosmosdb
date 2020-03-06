module.exports = function (RED) {
    function AZCosmosdbConfig(config) {
        RED.nodes.createNode(this, config);
        this.endpoint = config.endpoint;
        this.key = config.key;
    }
    RED.nodes.registerType("az-cosmosdb-config", AZCosmosdbConfig);
}
