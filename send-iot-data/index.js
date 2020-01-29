const localSettings = require("./local-settings.json");

const mqtt = require("azure-iot-device-mqtt").Mqtt;
const deviceClient = require("azure-iot-device").Client;
const message = require("azure-iot-device").Message;

const client = deviceClient.fromConnectionString(localSettings.deviceConnString, mqtt);

const inputThreshold = process.env.threshold || 'default';
const inputPreset = process.env.preset || 'default';

const preset = localSettings.presets[inputPreset];
const threshold = localSettings.thresholds[inputThreshold];

const printResultFor = op => {
    return (err, res) => {
        if (err) console.log(op + " error: " + err.toString());
        if (res) console.log(op + " status: " + res.constructor.name);
    };
}
const prependZeroes = (value) => {
    return value.length === 3 
            ? "0" + value 
            : value.length === 2 
                ? "00" + value
                : value.length === 1
                    ? "000" + value
                    : value;    
}

const getTemperature = (temp) => {
    let temperature;
    if (temp >= 0) {
        const scaleTemp = parseInt(temp / 0.005, 10);
        const hexedTemp = scaleTemp.toString(16);
        temperature = prependZeroes(hexedTemp);
    } else if (temp < 0) {
        let scaleTemp = parseInt(-1 * temp / 0.005, 10);
        const hexedTemp = scaleTemp.toString(16);
        scaleTemp = parseInt(hexedTemp, 16);
        const hexedAllOnes = new Number(65535).toString(16);
        const allOnes = parseInt(hexedAllOnes, 16);
        temperature = ((scaleTemp ^ allOnes) + 1).toString(16);
    }
    return temperature;
}
const format = (temp, hum, pres, message) => {    

    const temperature = getTemperature(temp);

    const scaledHumidity = parseInt(hum / 0.0025, 10);
    const hexedHumidity = scaledHumidity.toString(16);
    const humidity = prependZeroes(hexedHumidity);

    const scaledPressure = parseInt(pres - 50000, 10);
    const hexedPressure = scaledPressure.toString(16);
    const pressure = prependZeroes(hexedPressure);

    message.data = "00" + temperature + humidity + pressure;    
}

setInterval(() => {
    const pTemp = preset.temp;
    const pHumidity = preset.humidity;
    const pPressure = preset.pressure;

    const tTemp = threshold.temp;
    const tHumidity = threshold.humidity;
    const tPressure = threshold.pressure;

    let msg = { data: "" };

    const temperature = pTemp.min + Math.random() * (pTemp.max - pTemp.min);
    const humidity = pHumidity.min + Math.random() * (pHumidity.max - pHumidity.min);
    const pressure = pPressure.min + Math.random() * (pPressure.max - pPressure.min);  
    
    format(temperature, humidity, pressure, msg);
    
    const data = JSON.stringify(msg);
    const telemetryMessage = new message(data);

    telemetryMessage.properties.add("temperatureAlert", temperature > tTemp.max || temperature < tTemp.min ? "true" : "false");
    telemetryMessage.properties.add("humidityAlert", humidity > tHumidity.max || humidity < tHumidity.min ? "true" : "false");
    telemetryMessage.properties.add("pressureAlert", pressure > tPressure.max || pressure < tPressure.min ? "true" : "false");


    client.sendEvent(telemetryMessage, printResultFor("send"))
}, 1000);
