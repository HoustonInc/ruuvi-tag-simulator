const localSettings = require("./local-settings.json");

const mqtt = require("azure-iot-device-mqtt").Mqtt;
const deviceClient = require("azure-iot-device").Client;
const message = require("azure-iot-device").Message;

const client = deviceClient.fromConnectionString(localSettings.deviceConnString, mqtt);

const place = process.env.place || 'default';
const presets = localSettings.presets[place];
const thresholds = localSettings.thresholds[place];

const printResultFor = op => {
    return (err, res) => {
        if (err) console.log(op + " error: " + err.toString());
        if (res) console.log(op + " status: " + res.constructor.name);
    };
}
setInterval(() => {
    const pTemp = presets.temp;
    const pHumidity = presets.humidity;
    const pPresssure = presets.pressure;

    const temperature = pTemp.min + Math.random() * (pTemp.max - pTemp.min);
    const humidity = pHumidity.min + Math.random() * (pHumidity.max - pHumidity.min);
    const pressure = pPresssure.min + Math.random() * (pPresssure.max - pPresssure.min);  

    const data = JSON.stringify({ temperature, humidity, pressure });
    const msg = new message(data);

    const tTemp = thresholds.temp;
    const tHumidity = thresholds.humidity;
    const tPressure = thresholds.pressure;

    msg.properties.add("temperatureAlert", temperature > tTemp.max || temperature < tTemp.min ? "true" : "false");
    msg.properties.add("humidityAlert", humidity > tHumidity.max || humidity < tHumidity.min ? "true" : "false");
    msg.properties.add("pressureAlert", pressure > tPressure.max || pressure < tPressure.min ? "true" : "false");

    console.log("Sending message: " + msg.getData());

    client.sendEvent(msg, printResultFor("send"));
}, 1000);
