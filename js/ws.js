
class BusWebSocketClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.wsUserIds = [];
        this.buses = {};  // Store previous data for each bus by busId
    }

    // Method to subscribe and send data to the WebSocket server
    subscribe(ws) {
        const subscribeMsg = {
            "subscribe": "location",
            "userId": [1268],
            "filter": {
                "outOfService": 0,
                // "busId": [4853, 4893]  // Replace with actual bus IDs
            },
            "field": [
                "busId",
                "bus", // only used to make bus obj when num was in excluded buses
                "latitude",
                "longitude",
                "course",
                "paxLoad",
                "more",
                "route", // also only used when excluded
                "speed"
            ]
        };
        ws.send(JSON.stringify(subscribeMsg));
    }

    // Process each message received from the WebSocket server
    processMessage(message) {

        const data = JSON.parse(message);

        // Skip secondary GPS
        if (data.more && data.more.secondary) {
            return;
        }

        const busId = data.busId;

        // alert(busId)
        console.log(`Received bus data for bus ${busId}:`, data);
        
        if (!busData[busId]) {
            busData[busId] = {}
            busData[busId].busName = data.bus
            busData[busId].previousTime = new Date().getTime() - 5000;

            if (!('route' in data)) { // sometimes none...
                busData[busId].route = 'none'
            } else if (data.route in routeMapping) {
                busData[busId].route = routeMapping[data.route]
            } else {
                // alert('a')
                busData[busId].route = data.route
            }
        }

        busData[busId].lat = data.latitude
        busData[busId].long = data.longitude
        busData[busId].rotation = data.course
        busData[busId].capacity = data.paxLoad

        if (!('speed' in busData[busId])) {
            busData[busId].speed = data.speed
            busData[busId].visualSpeed = data.speed
        }

        // Calculate speed for this bus
        // const speed = 

        // if (speed !== null) {
        //     console.log(`Bus ${busId} current speed: ${speed.toFixed(2)} mph`);
        // } else {
        //     console.log(`Not enough data to calculate speed for bus ${busId} yet.`);
        // }

        calculateSpeed(busId);
        plotBus(busId)

        let route = busData[busId].route
        if (!activeRoutes.has(route)) {
            if (!route) route = 'undefined'
            // if (route === 'Campus Connect Express') alert('hi')
            activeRoutes.add(route)
            setPolylines(activeRoutes)
            populateRouteSelectors(activeRoutes)
        }

    }

    // Establish connection to WebSocket
    connect() {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log("Connected to WebSocket server");
            this.subscribe(this.ws);
        };

        this.ws.onmessage = (event) => {
            this.processMessage(event.data);
        };

        this.ws.onclose = () => {
            console.log("WebSocket connection closed, retrying...");
            setTimeout(() => this.connect(), 5000);  // Retry after 5 seconds
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.ws.close();
        };
    }
}

// Instantiate the WebSocket client
const wsClient = new BusWebSocketClient("wss://passio3.com/");
// wsClient.connect();
