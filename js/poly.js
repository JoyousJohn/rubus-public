let polylineBounds;

async function setPolylines(activeRoutes) {
    const fetchPromises = [];

    for (const routeName of activeRoutes) {
        let coordinates = await getPolylineData(routeName);

        if (!coordinates) continue // if undefined

        // console.log(typeof coordinates[0])

        if (Object.keys(coordinates[0])[0] === 'lat') {
            coordinates = coordinates.map(point => [point.lat, point.lng]); // Note: Leaflet uses [lat, lng]
        } else {
            coordinates = coordinates.map(point => [point[1], point[0]]); // Note: Leaflet uses [lat, lng]

        }

        // const pathData = ['M', coordinates[0]];  // Move to the first point

        // for (let i = 1; i < coordinates.length - 1; i += 2) {
        //     const controlPoint = coordinates[i];
        //     const nextPoint = coordinates[i + 1];

        //     if (controlPoint && nextPoint) {
        //         pathData.push('Q', controlPoint, nextPoint);
        //     }
        // }

        // if (coordinates.length % 2 === 0) {
        //     pathData.push('L', coordinates[coordinates.length - 1]);
        // }

        // // Create the curve
        // const polyline = L.curve(pathData, {
        //     color: colorMappings[routeName],   
        //     weight: 4,      
        //     opacity: 1,     
        //     smoothFactor: 1 
        // }).addTo(map);

        const polyline = L.polyline(coordinates, {
            color: colorMappings[routeName],
            weight: 4,
            opacity: 1,
            smoothFactor: 1
        });

        // Add the polyline to the map
        polyline.addTo(map);

        polylines[routeName] = polyline;

        fetchPromises.push(coordinates);
    }

    if (fetchPromises.length === 0) return // no routes to populate

    Promise.all(fetchPromises).then(() => {
        const group = new L.featureGroup(Object.values(polylines));
        polylineBounds = group.getBounds();
        map.fitBounds(polylineBounds, { padding: [10, 10] });
    });
}

async function getPolylineData(routeName) {

    try {

        const knownRoutes = ['a', 'b', 'bhe', 'ee', 'f', 'h', 'lx', 'on1', 'on2', 'rexb', 'rexl', 'wknd1', 'wknd2', 'c', 'ftbl', 'all', 'winter1', 'winter2', 'bl']
        if (!knownRoutes.includes(routeName)) return

        let polylineData = null;

        if (localStorage.getItem(`polylineData.${routeName}`) !== null) {
            polylineData = JSON.parse(localStorage.getItem(`polylineData.${routeName}`));
        } else {
            const response = await fetch('https://transloc.up.railway.app/r/' + routeName);
            if (response.status === 200) {
                const data = await response.json();
                localStorage.setItem(`polylineData.${routeName}`, JSON.stringify(data));
                polylineData = data;
            } else {
                console.error(`Error fetching polyline data for route ${routeName}:`, response.statusText);
            }
        }
        return polylineData;
    } catch (error) {
        console.error(`Error fetching polyline data for route ${routeName}:`, error);
    }
} 

const busStopMarkers = {};

function getNextStopId(route, stopId) {
    const routeStops = stopLists[route]
    const nextStopIndex = routeStops.indexOf(stopId) + 1;
    if (nextStopIndex < routeStops.length) {
        nextStopId = routeStops[nextStopIndex];
    } else {
        nextStopId = routeStops[0]
    }
    return nextStopId
}

function updateStopBuses(stopId) {
    let servicingBuses = {}

    $('.info-stop-servicing').empty();

    const servicedRoutes = routesServicing(stopId)

    // console.log('servicedRoutes:', servicedRoutes)

    if (!servicedRoutes.length) {

        let stopNoBusesMsg

        if (!jQuery.isEmptyObject(busData)) {
            stopNoBusesMsg = 'NOT SERVICED BY ACTIVE ROUTES'
        } else {
            stopNoBusesMsg = 'NO BUSES ACTIVE'
        }

        const $noneRouteElm = $(`<div class="no-buses">${stopNoBusesMsg}</div>`)
        $('.info-stop-servicing').append($noneRouteElm)
    }

    servicedRoutes.forEach(servicedRoute => {
        const $serviedRouteElm = $(`<div>${servicedRoute.toUpperCase()}</div>`).css('color', colorMappings[servicedRoute])
        $('.info-stop-servicing').append($serviedRouteElm)
        // busIdsServicing = busIdsServicing.concat(busesByRoutes[servicedRoute]);
        busesByRoutes[servicedRoute].forEach(busId => {

            let busStopId = busData[busId]['stopId']
            if (Array.isArray(busStopId)) {
                busStopId = busStopId[0];
            }

            if (busData[busId]['at_stop'] && busStopId === stopId) {
                servicingBuses[busId] = {
                    'route': servicedRoute,
                    'eta': 0,
                }
            }

            else if (busETAs[busId]) {

                let eta;
                if ((servicedRoute === 'wknd1' || servicedRoute === 'all' || servicedRoute === 'winter1' || servicedRoute === 'on1') && stopId === 3) { // special case
                    eta = Math.min(...Object.values(busETAs[busId][3]['via']));
                } else {
                    eta = busETAs[busId][stopId]
                }

                servicingBuses[busId] = {
                    'route': servicedRoute,
                    'eta': Math.ceil(eta/60) // can ceil only if this stop is the next stop, otherwise round to match the eta shown in bus info wrapper?
                }
            }
        })
    })

    const sortedBusIds = Object.entries(servicingBuses)
        .sort(([, a], [, b]) => a.eta - b.eta)
        .map(([busId]) => busId);

    $('.stop-info-buses-grid').empty();

    // const infoNextStopsScrollPosition = $('.info-next-stops').scrollTop();
    // alert(infoNextStopsScrollPosition)

    sortedBusIds.forEach(busId => {
        const data = servicingBuses[busId]

        const currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + data.eta);
        const formattedTime = currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        $('.stop-info-buses-grid').append($(`<div class="stop-bus-route">${data.route.toUpperCase()}</div>`).css('color', colorMappings[data.route]))
        
        let stopOctaconVisibilityClass = 'none'
        if (busData[busId].overtime) {
            stopOctaconVisibilityClass = ''
        }

        $('.stop-info-buses-grid').append(`<div class="flex justify-between align-center pointer">
            <div class="stop-bus-id">${busData[busId].busName}</div>
            <div class="stop-octagon ${stopOctaconVisibilityClass}"><div>!</div></div>
        </div>`)

        

        if (data.eta === 0) {
            // $('.stop-info-buses-grid').append(`<div></div>`)
            $('.stop-info-buses-grid').append(`<div class="stop-bus-eta pointer">Here</div>`)
            $('.stop-info-buses-grid').append(`<div class="pointer"></div>`)
        } else {

            $('.stop-info-buses-grid').append(`<div class="stop-bus-eta pointer">${(data.eta)}m</div>`)
            $('.stop-info-buses-grid').append(`<div class="stop-bus-time pointer">${formattedTime}</div>`)
        
            
        }
             
        $('.stop-info-buses-grid').children().slice(-4).click(function() {
            sourceStopId = stopId
            flyToBus(busId)
        });
    })

    // $('.info-next-stops').scrollTop(infoNextStopsScrollPosition);

    const avgWait = waits[stopId]
    const waitStr = `${Math.floor(avgWait / 60)}m ${avgWait % 60}s`

    if (!jQuery.isEmptyObject(busData)) {
        $('.stop-info-avg-wait').text(`Buses stop here for an average of ${waitStr}.`)
    }
}

let sourceBusId = null;
let sourceStopId = null;

async function popStopInfo(stopId) {

    if (Number(closestStopId) === stopId) {
        $('.closest-stop').show();
    } else {
        $('.closest-stop').hide();
    }

    popupStopId = stopId;
    popupBusId = null;
    $('.bus-info-popup, .route-panel, .my-location-popup').hide();

    const stopName = stopsData[stopId].name;
    $('.info-stop-name').text(settings['toggle-show-stop-id'] ? `${stopName} (#${stopId})` : stopName);

    updateStopBuses(stopId);

    if (sourceBusId && !sourceStopId) { // !sourceStopId kind a hack, have to look into how/why this is being set
        $('.stop-info-back').show();
    } else {
        $('.stop-info-back').hide();
    }

    $('.stop-info-popup').show();
    $('.stop-info-popup-inner').scrollTop(0);
    
}

async function addStopsToMap() {

    activeStops = []

    console.log(busesByRoutes)

    for (const activeRoute in busesByRoutes) {
        if (!(activeRoute in stopLists)) continue
        activeStops = [...activeStops, ...stopLists[activeRoute]]
        activeStops = [...new Set(activeStops)]
    }

    if (!activeStops.length) { // no buses running, show all stops
        activeStops = Array.from({length: 25}, (_, i) => i + 1);
    }

    // console.log(activeStops)

    checkIfLocationShared();

    activeStops.forEach(stopId => {

        const thisStop = stopsData[stopId];
        const lat = thisStop['latitude'];
        const long = thisStop['longitude'];
        const busStopIcon = L.icon({
            iconUrl: 'img/stop_marker.png',
            iconSize: [18, 18], // Customize icon size as needed
            iconAnchor: [9, 9], // Center the icon
            // popupAnchor: [0, -15] // Adjust the popup location
        });

        // Create a marker for the current bus stop
        const marker = L.marker([lat, long], { 
            icon: busStopIcon,
            zIndexOffset: settings['toggle-stops-above-buses'] ? 1000 : 0
        })
            .addTo(map) // Add the marker to the map
            .on('click', function() {
                sourceStopId = null;
                sourceBusId = null;
                popStopInfo(stopId)
            })

        busStopMarkers[stopId] = marker;
    });

}



function removePreviouslyActiveStops() {
    let newActiveStops = [];
    for (const route in busesByRoutes) {
        if (route in stopLists) {
            newActiveStops = [...newActiveStops, ...stopLists[route]];
        }
    }
    newActiveStops = [...new Set(newActiveStops)];

    // if (newActiveStops.length === 0) {
    //     newActiveStops = Array.from({length: 25}, (_, i) => i + 1);
    // }

    for (const stopId in busStopMarkers) {
        if (!newActiveStops.includes(Number(stopId))) {
            map.removeLayer(busStopMarkers[stopId]);
            delete busStopMarkers[stopId];

            if (popupStopId === stopId) {
                hideInfoBoxes();
                sourceStopId = null;
            }

        }
    }
}



function routesServicing(stopId) {
    let routesServicing = []  
    activeRoutes.forEach(activeRoute => {
        if (activeRoute in stopLists && stopLists[activeRoute].includes(stopId)) { // remove activeRoute in stopLists check after adding football routes + stops
            routesServicing.push(activeRoute)
        }
    })
    return routesServicing
}

let busesByRoutes = {}

function makeBusesByRoutes() {
    busesByRoutes = {}
    for (const bus in busData) {
        const route = busData[bus].route 
        // console.log(route)
        if (!busesByRoutes.hasOwnProperty(route)) {
            busesByRoutes[route] = []
        }
        busesByRoutes[route].push(bus)
        // console.log(busesByRoutes[route])
    }
}

function progressToNextStop(busId) {
    if (!busData[busId]['next_stop']) {
        return 0;
    }

    const nextStopId = String(busData[busId]['next_stop']);
    if (!percentageDistances[nextStopId]) {
        return 0;
    }

    const prevStopId = String(busData[busId]['stopId']);
    if (!percentageDistances[nextStopId]['from'][prevStopId]) {
        return 0;
    }

    const nextStopDistances = percentageDistances[nextStopId]['from'][prevStopId]['geometry']['coordinates'];
    const percentages = percentageDistances[nextStopId]['from'][prevStopId]['properties']['percentages'];

    const busLat = busData[busId]['lat'];
    const busLng = busData[busId]['long'];

    // Step 1: Find the closest point
    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < nextStopDistances.length; i++) {
        const pointLat = nextStopDistances[i][1];
        const pointLng = nextStopDistances[i][0];
        const dist = Math.sqrt(
            Math.pow(busLat - pointLat, 2) +
            Math.pow(busLng - pointLng, 2)
        );

        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
        }
    }

    // Step 2: Determine if the closest point is previous or future
    let previousPointIndex, nextPointIndex;

    if (closestIndex === 0) {
        previousPointIndex = 0;
        nextPointIndex = 1;
    } else if (closestIndex === nextStopDistances.length - 1) {
        previousPointIndex = nextStopDistances.length - 2;
        nextPointIndex = nextStopDistances.length - 1;
    } else {
        const previousPoint = nextStopDistances[closestIndex - 1];
        const nextPoint = nextStopDistances[closestIndex + 1];

        const distToPrevious = Math.sqrt(
            Math.pow(busLat - previousPoint[1], 2) +
            Math.pow(busLng - previousPoint[0], 2)
        );

        const distToNext = Math.sqrt(
            Math.pow(busLat - nextPoint[1], 2) +
            Math.pow(busLng - nextPoint[0], 2)
        );

        if (distToPrevious < distToNext) {
            previousPointIndex = closestIndex - 1;
            nextPointIndex = closestIndex;
        } else {
            previousPointIndex = closestIndex;
            nextPointIndex = closestIndex + 1;
        }
    }

    const previousPoint = nextStopDistances[previousPointIndex];
    const nextPoint = nextStopDistances[nextPointIndex];
    const previousPercentage = percentages[previousPointIndex];
    const nextPercentage = percentages[nextPointIndex];

    const distanceBetweenPoints = Math.sqrt(
        Math.pow(nextPoint[1] - previousPoint[1], 2) +
        Math.pow(nextPoint[0] - previousPoint[0], 2)
    );

    const distanceFromBusToPrevious = Math.sqrt(
        Math.pow(busLat - previousPoint[1], 2) +
        Math.pow(busLng - previousPoint[0], 2)
    );

    const progressBetweenPoints = distanceFromBusToPrevious / distanceBetweenPoints;
    const interpolatedPercentage = previousPercentage + (nextPercentage - previousPercentage) * progressBetweenPoints;

    return interpolatedPercentage;
}