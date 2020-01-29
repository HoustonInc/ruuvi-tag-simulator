const connectionString = require("./local-settings.json").serviceConnString;

const { EventHubClient, EventPosition } = require("@azure/event-hubs");

const printError = err => {
    console.log(err.message);
};

const printMessage = message => {
    console.log("Telemetry received: ");
    console.log(JSON.stringify(message.body));
    console.log("Application properties (set by device): ");
    console.log(JSON.stringify(message.applicationProperties));
    console.log("System properties (set by IoT Hub): ");
    console.log(JSON.stringify(message.annotations));
    console.log("");
};

let ehClient;
EventHubClient.createFromIotHubConnectionString(connectionString)
    .then(client => {
        console.log("Successfully created the EventHub Client from iothub connection string.");
        ehClient = client;
        return ehClient.getPartitionIds();
    })
    .then(ids => {
        console.log("The partition ids are: ", ids);
        return ids.map(id => {
            return ehClient.receive(id, printMessage, printError, {
                eventPosition: EventPosition.fromEnqueuedTime(Date.now())
            });
        });
    })
    .catch(printError);
