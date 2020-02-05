const connectionString = require("./local-settings.json").serviceConnString;

const { EventHubClient, EventPosition } = require("@azure/event-hubs");

const printError = err => {
    console.log(err.message);
};

const getTemperature = (tHex) => {
    let tagTemperature = parseInt(tHex, 16);
    
    if(tagTemperature > 32768 /** 8000 HEX, positive negative boundary for ruuvi tag temperature */ ) {
        const hexedAllOnes = new Number(65535).toString(16);
        const allOnes = parseInt(hexedAllOnes, 16);
        tagTemperature = (tagTemperature - 1) ^ allOnes;
        tagTemperature = -1 * tagTemperature;
    }
    
    return tagTemperature * 0.005;
}

const parseMessage = message => {
    const data = JSON.stringify(message.body.data);
    const temperatureHex = data.substr(3, 4);
    const humidityHex = data.substr(7, 4);
    const pressureHex = data.substr(11, 4);

    const temperature = getTemperature(temperatureHex);
    const humidity = parseInt(humidityHex, 16) * 0.0025;
    const pressure = parseInt(pressureHex, 16) + 50000;
    console.group("Telemetry\n---------");

    console.log('Temp (in °C)');
    console.log(temperature);

    console.log('Humidity (in %)');
    console.log(humidity);

    console.log('Pressure (in Pa)');
    console.log(pressure);

    console.log("");
    console.log("Application properties (set by device): ");
    console.log(JSON.stringify(message.applicationProperties));

    console.log("");
    console.log("System properties (set by IoT Hub): ");
    console.log(JSON.stringify(message.annotations));

    console.log("");
    console.groupEnd("Telemerty");
}

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
            return ehClient.receive(id, parseMessage, printError, {
                eventPosition: EventPosition.fromEnqueuedTime(Date.now())
            });
        });
    })
    .catch(printError);
