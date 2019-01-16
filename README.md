# sensorcentral_peaks #

Create a .env file with follow environment variables:
* AUTHORIZATION_HEADER
* PROMETHEUS_URL

Optional environment variables:
* SENSOR_QUERY (example: `sensor_heatpump_forwards{deviceId="60:01:94:5D:4C:9D"}`)
* STEP (example: `2m`)
* START (example: `2019-01-13T23:00:00.000Z`)
* END (example: `2019-01-14T23:00:00.000Z`)
* COMPARE_SENSOR_QUERY (example: `sensor_outside{deviceId="60:01:94:5D:4C:9D"}`)