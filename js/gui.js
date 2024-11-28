let longPressTimer

function populateRouteSelectors(activeRoutes) {
    $('.route-selectors > div').not('.settings-btn').remove();

    // Convert Set to Array if it's not already an array
    let routesArray = Array.from(activeRoutes);

    if (routesArray.includes('ftbl')) {
        routesArray = routesArray.filter(route => route !== 'ftbl');
        routesArray.push('ftbl');
    }

    routesArray = routesArray.map(route => route || 'undefined');
    routesArray.sort((a, b) => a === 'undefined' ? 1 : b === 'undefined' ? -1 : 0);

    routesArray.forEach(route => {
        // console.log(route)

        const $routeElm = $(`<div class="route-selector" routeName="${route}">${route.toUpperCase()}</div>`)  
        
        let color = 'darkgray'

        const knownRoutes = ['a', 'b', 'bhe', 'ee', 'f', 'h', 'lx', 'on1', 'on2', 'rexb', 'rexl', 'wknd1', 'wknd2', 'c', 'ftbl', 'all']

        if (knownRoutes.includes(route)) {
            color = colorMappings[route]

            let isDraggingTemp = false; // Temporary flag to track dragging state

            let initialX; // Declare initialX outside to access it later

            // let initialScrollLeft; // Declare initialScrollLeft to store the initial scroll position

            $routeElm.on('touchstart mousedown', function(event) {
                event.preventDefault();

                initialX = event.pageX || event.originalEvent.touches[0].pageX; // Store initial position
                // initialScrollLeft = $('.route-selectors').scrollLeft(); // Store initial scroll position
                // isDraggingTemp = false; // Reset temporary dragging flag

                longPressTimer = setTimeout(() => {

                    // console.log('isDraggingTemp: ' , isDraggingTemp)

                    // if (!longPressTimer) { console.log('none ')}

                    // console.log('123')

                    // Check if the user is dragging
                    // if (!isDraggingTemp) {
                        // const currentScrollLeft = $('.route-selectors').scrollLeft(); // Get current scroll position
                        // console.log(currentScrollLeft)
                        // console.log(initialScrollLeft)
                        // console.log(initialX)
                        // console.log(event.pageX || event.originalEvent.touches[0].pageX)
                        // const scrolled = currentScrollLeft !== initialScrollLeft; // Check if the scroll position has changed
                        
                        // if (!scrolled) {

                            isLongPress = true;
                            if (shownRoute) {
                                shownBeforeRoute = shownRoute
                            }

                            if (panelRoute !== route) {
                                selectedRoute(route);
                            }
                        // }
                    // }
                }, 500); 
            });

            $routeElm.on('touchmove', function(event) {
                
                // console.log(initialX)
                // console.log(event.changedTouches[0].clientX)
                const moved = Math.abs(initialX - event.changedTouches[0].clientX) > 10
                if (!moved) { return; }
                // console.log(moved)

                clearTimeout(longPressTimer);
                // console.log('cleared timeout')
                // isDraggingTemp = true
            })

            $routeElm.on('touchend touchcancel mouseup', function() {
                clearTimeout(longPressTimer);
                // isDraggingTemp = false
            });

            $routeElm.on('click touchend', function(event) {

                // console.log(event.changedTouches[0].clientX)
                // console.log(initialX)

                // console.log(initialX - event.changedTouches[0].clientX)
                const moved = Math.abs(initialX - (event.originalEvent.clientX || event.changedTouches[0].clientX)) > 10

                if (!isLongPress && !moved) {

                    // const currentScrollLeft = $('.route-selectors').scrollLeft();
                    // if (initialScrollLeft !== currentScrollLeft) { return; }

                    if (panelRoute) {
                        selectedRoute(route)
                    } else {
                        toggleRoute(route);
                    }

                }
                isLongPress = false
            })
        }

        $routeElm.css('background-color', color) 
        $('.settings-btn').before($routeElm)
    });

let isDragging = false;
let startX, scrollLeft;
let velocity = 0;
let lastX = 0;
let lastTime = 0;
let animationFrame = null;

$('.route-selectors')
    .on('mousedown touchstart', function(e) {
        isDragging = true;
        startX = e.pageX || e.originalEvent.touches[0].pageX;
        scrollLeft = $(this).scrollLeft();
        lastX = startX;
        lastTime = Date.now();
        velocity = 0;
        
        // Cancel any ongoing animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        e.preventDefault();
    })
    .on('mouseleave mouseup touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTime;
        if (timeDiff > 0) {
            // Apply inertia only if the last movement wasn't too long ago
            if (timeDiff < 50) {
                const container = $(this);
                const startVelocity = velocity;
                const startTime = currentTime;
                
                function animate() {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    
                    // Deceleration formula
                    const deceleration = 0.95; // Adjust this value to change how quickly it slows down
                    const currentVelocity = startVelocity * Math.pow(deceleration, elapsed / 16);
                    
                    // Stop animation when velocity is very low
                    if (Math.abs(currentVelocity) < 0.1) {
                        cancelAnimationFrame(animationFrame);
                        animationFrame = null;
                        return;
                    }
                    
                    container.scrollLeft(container.scrollLeft() - currentVelocity);
                    animationFrame = requestAnimationFrame(animate);
                }
                
                animate();
            }
        }
    })
    .on('mousemove touchmove', function(e) {
        if (!isDragging) return;
        // isDraggingTemp = true; // Set temporary dragging flag if user moves
        
        const x = e.pageX || e.originalEvent.touches[0].pageX;
        const walk = x - startX; // Calculate the distance moved
        const currentTime = Date.now();
        
        // Calculate velocity (pixels per millisecond)
        const timeDiff = currentTime - lastTime;
        if (timeDiff > 0) {  // Avoid division by zero
            const distance = x - lastX;
            velocity = distance / timeDiff * 16; // Convert to pixels per frame (assuming 60fps)
        }
        
        $(this).scrollLeft(scrollLeft - walk);
        
        // Update last position and time
        lastX = x;
        lastTime = currentTime;
        
        e.preventDefault();
    });

}

let shownRoute = undefined  
let shownBeforeRoute = undefined
let isLongPress = false; // Flag to track if a long press occurred

function toggleRouteSelectors(route) {
    if (shownRoute === route) {
        for (const polyline in polylines) {
            if (polyline !== route) {
                $(`.route-selector[routeName="${polyline}"]`).css('background-color', colorMappings[polyline])
            }
        }
        $(`.route-selector[routeName="${route}"]`).css('box-shadow', '')
        shownRoute = undefined  
        shownBeforeRoute = undefined
    }

    else {
        for (const polyline in polylines) {
            if (polyline !== route) {
                $(`.route-selector[routeName="${polyline}"]`).css('background-color', 'gray')
            }
        }

        $(`.route-selector[routeName="${route}"]`).css('background-color', colorMappings[route]).css('box-shadow', `0 0 10px ${colorMappings[route]}`)
        $(`.route-selector[routeName="${shownRoute}"]`).css('box-shadow', '')
        shownRoute = route

        // Add scrolling code here
        const container = $('.route-selectors');
        const element = $(`.route-selector[routeName="${route}"]`);
        const containerWidth = container.width();
        const elementWidth = element.outerWidth();
        
        // Calculate scroll position to center the element
        const scrollTo = element.position().left - (containerWidth / 2) + (elementWidth / 2) + container.scrollLeft();
        
        // Smooth scroll to the calculated position
        container.animate({
            scrollLeft: scrollTo
        }, 180);

    }
}

function toggleRoute(route) {

    // Show all polylines and buses
    if (shownRoute === route) {
        for (const polyline in polylines) {
            if (polyline !== route) {
                polylines[polyline].addTo(map)
            }
        }  
        for (const marker in busMarkers) {
            if (busMarkers[marker].options.route !== route) {
                // busMarkers[marker].addTo(map)
                busMarkers[marker].getElement().style.display = '';
            }
        }

        showAllStops();
        map.fitBounds(bounds)

    // Hide other polylines and buses
    } else {

        showAllStops();

        for (const polyline in polylines) {
            if (polyline !== route) {
                polylines[polyline].remove()
            }
        }

        for (const marker in busMarkers) {
            if (busMarkers[marker].options.route !== route) {
                // busMarkers[marker].remove()
                busMarkers[marker].getElement().style.display = 'none';
            } else {
                busMarkers[marker].getElement().style.display = ''; // if switched the one being viewed 
            }
        }

        hideStopsExcept(route)

        polylines[route].addTo(map) // show this one if it was prev hidden

        $('.bus-info-popup, .stop-info-popup').hide();

        map.fitBounds(polylines[route].getBounds(), { padding: [10, 10] });

    }

    toggleRouteSelectors(route)

    function hideStopsExcept(excludedRoute) {
        const stopIdsForSelectedRoute = stopLists[excludedRoute]
        for (const polyline in polylines) {
            const stopIdsForRoute = stopLists[polyline]
            stopIdsForRoute.forEach(stopId => {
                if (!(stopIdsForSelectedRoute).includes(stopId)) {
                    busStopMarkers[stopId].remove();
                }
            })
        }    
    }

    function showAllStops() {
        for (const stopId in busStopMarkers) {
            busStopMarkers[stopId].addTo(map);
        }
    }
}

let panelRoute;

function selectedRoute(route) {

    if (panelRoute === route) {
        closeRouteMenu()
        return
    }

    if (shownRoute !== route) {
        toggleRouteSelectors(route)
    }

    $('.route-name').text(route.toUpperCase()).css('color', colorMappings[route])
    $('.route-campuses').text(campusMappings[route])
    $('.route-active-buses').text(busesByRoutes[route].length + ' buses running')

    $('.active-buses').empty();
    busesByRoutes[route].forEach(busId => {

        let speed = ''
        if ('visualSpeed' in busData[busId]) {
            speed = parseInt(busData[busId].visualSpeed) + 'mph'
        }
        speed += ' | ' + busData[busId].capacity + '% full'

        const $busElm = $(`<div class="flex justify-between">
            <div class="route-bus-name">${busData[busId].busName}</div>
            <div class="route-bus-speed" bus-id="${busId}">${speed}</div>
        </div>`)
        $('.active-buses').append($busElm)
    })

    if (!panelRoute) {
        $('.route-close').css('display', 'flex').css('height', $('.route-selector').innerHeight())
        $('.panout, .buses-btn, .centerme').fadeOut('fast');
        $('.settings-btn').hide();
        $('.leaflet-control-attribution').hide();
        $('.route-panel').slideDown('fast');

        if (isDesktop) {
            const routeSelectorsWidth = $('.route-selectors').width() / parseFloat(getComputedStyle(document.documentElement).fontSize) + 2;
            $('.route-panel').css('padding-left', routeSelectorsWidth + 'rem');
        }

    }


    $('.route-stops-grid').empty();

    stopLists[route].forEach(stopId => {

        $('.route-stops-grid').append('<div class="next-stop-circle"></div>')
        const $stopElm = $(`<div class="flex flex-col">
            <div class="route-stop-name">${stopsData[stopId].name}</div>
            <div class="route-buses-for-stop"></div>
        </div>`)

        // Sort bus IDs based on their ETA
        busesByRoutes[route]
            .sort((a, b) => Math.round(busETAs[a][stopId] / 60) - Math.round(busETAs[b][stopId] / 60)) // Sort by ETA
            .forEach(busId => {

            if (busETAs[busId]) {
                const $gridElm = $stopElm.find('.route-buses-for-stop')
                $gridElm.append(`<div>${busData[busId].busName}</div>`)
                $gridElm.append(`<div class="bold">${Math.round(busETAs[busId][stopId]/60)}m</div>`)
                $gridElm.append(`<div class="align-right">x stops away</div>`)
            }

        })

        $('.route-stops-grid').append($stopElm)

    })

    $('.route-stops-grid .next-stop-circle').css('background-color', colorMappings[route])

    panelRoute = route

}

let routeRiderships = {}
function updateBusOverview(routes) {

    const loopTimes = calculateLoopTimes();

    if (!routes) { 
        routes = Object.keys(busesByRoutes);
        $('.buses-overview-grid').children().not('.bus-overview-heading, .bus-overview-footer').remove();
    }

    if (routes.includes('undefined')) { // Should I even track this?
        routes = routes.filter(route => route !== 'undefined');
    }

    // console.log(`Updating bus overview for routes: ${routes.join(', ')}`)

    let totalRidership = 0;

    const routeData = routes.map(route => {
        routeRiderships[route] = 0;
        busesByRoutes[route].forEach(busId => {
            const riders = Math.ceil(busData[busId].capacity/100 * 57)
            routeRiderships[route] += riders;
            totalRidership += riders;
        });
        return { route, ridership: routeRiderships[route] };
    });

    routeData.sort((a, b) => b.ridership - a.ridership);

    routeData.forEach(({route}) => {
        if ($(`.bus-overview-ridership[route="${route}"]`).length === 0) {
            const $busName = $(`<div class="bus-overview-name bold">${route.toUpperCase()}</div>`).css('color', colorMappings[route]); // (${busesByRoutes[route].length})
            const $busRidership = $(`<div class="bus-overview-ridership" route="${route}">${routeRiderships[route]} riders</div>`);
            const $loopTime = $(`<div class="bus-overview-loop-time" route="${route}">${loopTimes[route]} min</div>`);
            const $footer = $('.buses-overview-grid > .bus-overview-footer').first();
            $footer.before($busName);
            $footer.before($busRidership);
            $footer.before($loopTime);
        } else {
            const prevRiders = parseInt($(`.bus-overview-ridership[route="${route}"]`).text().split(' ')[0]);
            const newRiders = (routeRiderships[route])


            if (prevRiders !== newRiders) {
                // console.log(`'prevriders: ${prevRiders}, newriders: ${newRiders} `)
                let color = ''
                if (prevRiders > newRiders) {
                    color = 'red'
                } else if (prevRiders < newRiders) {
                    color = 'lime'
                }

                setTimeout(() => {
                    $(`.bus-overview-ridership[route="${route}"]`).text(`${routeRiderships[route]} riders`).css('color', color).css('transition', 'color 0.25s');

                    const ridersChange = newRiders - prevRiders;
                    const nowTotalRidership = parseInt($('.total-ridership').text().split(' ')[0])
                    $('.total-ridership').text(`${nowTotalRidership + ridersChange} riding`).css('color', color).css('transition', 'color 0.25s');

                    setTimeout(() => {
                        $(`.bus-overview-ridership[route="${route}"], .total-ridership`).css('color', 'black').css('transition', 'color 1s');
                    }, 1000);
                }, Math.random() * 5000);
            }
        }
    });

    if (!$('.total-ridership').text().length) {
        $('.total-ridership').text(totalRidership + ' riding');
    } else {
        const textTotalRidership = parseInt($('.total-ridership').text().split(' ')[0])
        if (textTotalRidership !== totalRidership) { // total became unsynced because of
            $('.total-ridership').text(totalRidership + ' riding'); // ^^ the autocomplete for that comment is so funny haha
        }
    }
}


function busesOverview() {

    if (!isDesktop) {
        $('.bottom, .leaflet-control-attribution').hide();
        $('.buses-close').addClass('flex');
        $('.buses-panel-wrapper').css('margin-left', 0);
    } else {
        const routeSelectorsWidth = $('.route-selectors').width() / parseFloat(getComputedStyle(document.documentElement).fontSize) + 2;
        $('.buses-panel-wrapper').css('margin-left', routeSelectorsWidth + 'rem');
    }

    $('.buses-panel-wrapper').slideDown('fast');
    
    updateBusOverview();
    updateRidershipChart();
}

let ridershipChart;

async function makeRidershipChart() {

    const ctx = document.getElementById('ridership-chart').getContext('2d');
    ridershipChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.5,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} riders`;
                        },
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    ticks: {
                        display: false,
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)'
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        callback: function(val, index) {
                            const time = this.getLabelForValue(val);
                            const hour = parseInt(time.split(':')[0]); 
                            
                            const totalDataPoints = this.chart.data.labels.length;
                            if (totalDataPoints > 150) { // check if the 150 num should be changed later
                                // Skip odd-hour labels if there are more than 150 data points
                                return hour % 2 !== 0 || !time.includes(':00') ? '' : hour + time.split(' ')[1];
                            } else {
                                return time.includes(':00') ? hour + time.split(' ')[1] : '';
                            }
                        }
                    }
                }
            },
            maintainAspectRatio: false
        }
    });

}

async function updateRidershipChart() {
    try {
        const response = await fetch('https://transloc.up.railway.app/ridership');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const timeRiderships = await response.json();

        if (!Object.keys(timeRiderships).length) {
            return; // Don't show chart if no ridership data
        }

        const utcOffset = new Date().getTimezoneOffset();

        // Prepare entries for sorting and formatting
        const entries = Object.entries(timeRiderships).map(([key, value]) => {
            let localMinutes = parseInt(key) - utcOffset;
            if (localMinutes < 0) localMinutes += 1440; // Handle day wraparound

            // Add 24 hours (1440 mins) to early morning times to sort them at the end
            const sortMinutes = localMinutes < 300 ? localMinutes + 1440 : localMinutes;

            const hours = Math.floor(localMinutes / 60);
            const minutes = localMinutes % 60;
            const time = new Date();
            time.setHours(hours, minutes, 0, 0);

            const formattedTime = time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            return [formattedTime, value, sortMinutes];
        });

        // Sort and convert to chart format
        const sortedData = Object.fromEntries(
            entries.sort(([, , a], [, , b]) => a - b)
        );

        const labels = Object.keys(sortedData);
        const values = Object.values(sortedData);
        
        ridershipChart.data.labels = labels;
        ridershipChart.data.datasets[0].data = values;
        ridershipChart.update();

        const totalRidership = values.reduce((a, b) => a + b, 0);
        const averageRidership = Math.round(totalRidership / values.length);
        const maxRidership = Math.max(...values);
        const peakTime = labels[values.indexOf(maxRidership)];
        
        $('.ridership-avg').text(`AVG: ${averageRidership}`);
        $('.ridership-max').text(`PEAK: ${maxRidership.toLocaleString()} at ${peakTime}`);
        $('.ridership-super-wrapper').show();
        
    } catch (error) {
        console.error('Error fetching ridership:', error);
    }
}


function calculateLoopTimes() {

    let loopTimes = {}

    for (const route of activeRoutes) {

        let eta = 0
        const stopList = stopLists[route]

        for (let i = 0; i < stopList.length - 1; i++) {
            const thisStop = stopList[i]

            let prevStop
            if (i === 0) {
                prevStop = stopList[stopList.length - 1]
            } else {
                prevStop = stopList[i - 1]
            }

            if (etas[thisStop] && prevStop in etas[thisStop]['from']) { // investigate why I need the first condition
                eta += etas[thisStop]['from'][prevStop]
            } else {
                eta += 300
            }

            if (waits[thisStop]) {
                eta += waits[thisStop]
            } else {
                eta += 20
            }
        }

        loopTimes[route] = Math.round(eta/60)
    }
    return loopTimes
}


function closeRouteMenu() {
    $('.route-panel').slideUp('fast');
    $('.panout, .settings-btn, .buses-btn, .centerme').show();
    $(this).hide();
    $('.route-close').hide();

    if (shownBeforeRoute && shownBeforeRoute !== panelRoute) {
        toggleRoute(shownBeforeRoute)
        shownBeforeRoute = undefined
    } else if (!shownBeforeRoute) {
        toggleRouteSelectors(panelRoute)
    }

    panelRoute = undefined
}

$('.route-close').click(function() {
    closeRouteMenu();
})

$('.settings-btn').on('touchstart click', function() { // why do i need touchstart here but not below? idk
    $('.leaflet-control-attribution').hide();
    $('.settings-panel').show();
    // if (isDesktop) {
        $('.bottom').hide();
    // }
    $('.settings-close').show();
})

$('.settings-close').click(function() {
    $('.settings-panel').hide();
    $('.bottom').show();
    $(this).hide();
})

$('.buses-close').click(function() {
    $('.buses-panel-wrapper').slideUp('fast');
    $('.bottom').show();
    $('.buses-close').removeClass('flex');
})

const markerSizeMap = {
    'small': '20',
    'medium': '27',
    'big': '35'
}

const innerSizeMap = {
    'small': '8',
    'medium': '13',
    'big': '19'
}

let settings = {}

const toggleSettings = [
    'toggle-select-closest-stop',
    'toggle-show-arrival-times',
    'toggle-show-bus-speeds',

    'toggle-show-stop-polygons',
    'toggle-show-etas-in-seconds',
    'toggle-show-bus-id',
    'toggle-show-bus-progress',
    'toggle-show-bus-overtime-timer'
]

let defaultSettings = {
    'font': 'PP Neue Montreal',
    'marker_size': 'medium',
    'theme': 'auto',
    'toggle-select-closest-stop': true,
    'toggle-show-arrival-times': true,
    'toggle-show-bus-speeds': true,
    
    // dev settings
    'toggle-show-stop-polygons': false,
    'toggle-show-etas-in-seconds': false,
    'toggle-show-bus-id': false,
    'toggle-show-bus-progress': false,
    'toggle-show-bus-overtime-timer': false
};

function setDefaultSettings (){
    delete defaultSettings['theme']
    settings = defaultSettings
    localStorage.setItem('settings', JSON.stringify(settings))
    $(`div.settings-option[font-option="PP Neue Montreal"]`).addClass('settings-selected')
    $(`div.settings-option[marker-size-option="medium"]`).addClass('settings-selected')
    // $(`div.settings-option[theme-option="auto"]`).addClass('settings-selected')
}

function updateSettings() {
    settings = localStorage.getItem('settings');
    // console.log(settings)
    if (settings) {

        settings = JSON.parse(settings);

        for (let key in defaultSettings) {
            if (!settings.hasOwnProperty(key) && key !== 'theme') {
                settings[key] = defaultSettings[key];
            }
        }
        for (let key in settings) {
            if (!defaultSettings.hasOwnProperty(key)) {
                delete settings[key];
            }
        }
        localStorage.setItem('settings', JSON.stringify(settings))

        document.documentElement.style.setProperty('--font-family', settings['font']);
    } else {
        setDefaultSettings();
    }

    $(`div.settings-option[font-option="${settings['font']}"]`).addClass('settings-selected')
    $(`div.settings-option[marker-size-option="${settings['marker_size']}"]`).addClass('settings-selected')
    
    if (!$('.theme-modal').is(':visible')) {
        $(`div.settings-option[theme-option="${settings['theme']}"]`).addClass('settings-selected')
    }

    $('.settings-option').click(function() {
        if ($(this).hasClass('settings-selected')) { return; }

        const settingsOption = $(this).attr('settings-option')

        // console.log(settingsOption)
        if (settingsOption === 'font') {
            $(`div.settings-selected[settings-option="${settingsOption}"]`).removeClass('settings-selected')
            $(this).addClass('settings-selected')
            settings['font'] = $(this).attr('font-option')
            document.documentElement.style.setProperty('--font-family', settings['font']);
        }

        else if (settingsOption === 'marker_size') {
            
            $(`div.settings-selected[settings-option="${settingsOption}"]`).removeClass('settings-selected')
            $(this).addClass('settings-selected')
            settings['marker_size'] = $(this).attr('marker-size-option')
            updateMarkerSize()

        }

        else if (settingsOption === 'theme') {
            
            $(`div.settings-selected[settings-option="${settingsOption}"]`).removeClass('settings-selected')
            $(this).addClass('settings-selected')
            settings['theme'] = $(this).attr('theme-option')

            let theme = $(this).attr('theme-option')
            if (theme === 'auto') {
                const currentHour = new Date().getHours();
                theme = (currentHour <= 7 || currentHour >= 18) ? 'dark' : 'streets';
            }

            changeMapStyle(theme)

        }

        if (settingsOption) { // don't reset ls if ls was cleared (that option doesn't currently have settingsOption). add some sort of attribute later as this will be in analytics
            localStorage.setItem('settings', JSON.stringify(settings))
        }

    })

    toggleSettings.forEach(toggleSetting => {

        const isChecked = settings[toggleSetting]; 
        const $toggleInput = $(`#${toggleSetting}`);

        if ($toggleInput.length) {
            $toggleInput.prop('checked', isChecked);
        }

    })

    getBuildNumber()
}

$(document).ready(function() {

    updateSettings();

    

})

function toggleDevOptions() {

    const $devWrapper = $('.dev-options-wrapper')
    const $devTitle = $('.dev-options-head')
    const optionsShown = $devWrapper.is(':visible')
    console.log(optionsShown)

    if(!optionsShown) {
        $devWrapper.slideDown();
        $devTitle.text('Hide Developer Options ▲')
    } else {
        $devWrapper.slideUp();
        $devTitle.text('Show Developer Options ▼');
    }

}

function updateMarkerSize() {

    const outterDimensions = markerSizeMap[settings['marker_size']]
    const innerDimensions = innerSizeMap[settings['marker_size']]

    $('.bus-icon-outer').css('height', outterDimensions + 'px').css('width', outterDimensions + 'px');
    $('.bus-icon-inner').css('height', innerDimensions + 'px').css('width', innerDimensions + 'px');
}

let locationShared;
let userLocation;
let closestStopId;
let closestStopDistances = {};
let sortedClosestStopDistances = {};
let closestStopsMap;

function findNearestStop(fly) {
    console.log("Trying to find nearest stop...")

    navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLong = position.coords.longitude;
        userPosition = [userLat, userLong];

        let closestStop = null;
        let thisClosestStopId = null;
        let closestDistance = Infinity;

        for (const stopId in stopsData) {
            const stop = stopsData[stopId];
            const distance = haversine(userLat, userLong, stop.latitude, stop.longitude);

            closestStopDistances[stopId] = distance;

            if (distance < closestDistance) {
                closestDistance = distance;
                closestStop = stop;
                thisClosestStopId = stopId;
            }
        }

        closestStopsMap = new Map(
            Object.entries(closestStopDistances)
                .sort(([, distanceA], [, distanceB]) => distanceA - distanceB)
        );
        populateMeClosestStops()

        if (closestStop) {

            console.log(`Closest stop to user is ${closestStop.name} at a distance of ${closestDistance} miles.`);
            closestStopId = thisClosestStopId

            const marker = L.marker(userPosition, 
                { icon: L.icon({
                    iconUrl: 'img/location_marker.png',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                })
            }).addTo(map)

            marker.on('click', function() {
                $('.bus-info-popup, .stop-info-popup, .bus-stopped-for').hide();  
                $('.my-location-popup').show();
                // map.flyTo(userPosition, 18, {
                //     animate: true,
                //     duration: 0.3
                // });
            })

            $('.fly-closest-stop-wrapper').fadeIn();
            if (settings['toggle-select-closest-stop'] && fly && !panelRoute && !$('.settings-panel').is(':visible') && !mapDragged) {
                flyToStop(thisClosestStopId);
                console.log("Flying to closest stop")
            }
            $('.closest-stop').show('none');
        } else {
            console.log('No stops found within the given data.');
        }

        // generate closestStopDistances object where the keys are stop ids and values are distances

    }, (error) => {
        console.error('Error getting user location:', error);
    });
}

function checkIfLocationShared() {
    const lsLocationShared = localStorage.getItem('locationShared');

    locationShared = lsLocationShared === 'true';

    if (locationShared) {
        if (navigator.geolocation) {
            findNearestStop(true);
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }
}

function flyToStop(stopId) {
    const stopData = stopsData[stopId];
    const lat = Number(stopData.latitude);
    const long = Number(stopData.longitude);
    const loc = { lat, long };

    map.flyTo(
        [loc.lat, loc.long],
        15,
        {
            animate: true,
            duration: 0.5
        }
    );

    popStopInfo(Number(stopId));
}


function populateMeClosestStops() {

    $('.closest-stops-list').empty();
    
    let count = 0;
    
    for (const [stopId, distance] of closestStopsMap) {

        if (!activeStops.includes(parseInt(stopId))) continue;
        if (count >= 5) break;
        
        const stopNameDiv = $(`<div class="name pointer">${stopsData[stopId].name}</div>`).click(() => { flyToStop(stopId)})
        const stopDistDiv = $(`<div class="dist bold pointer">${Math.round((distance*1000*3.28)).toLocaleString()}ft</div>`).click(() => { flyToStop(stopId)}) // add meter option later
            
        $('.closest-stops-list').append(stopNameDiv);
        $('.closest-stops-list').append(stopDistDiv);

        count++;
    }
}


async function getBuildNumber() {
    $.ajax({
        url: 'https://api.github.com/repos/JoyousJohn/rubus-public/commits?per_page=1', // &page = 1
        type: 'GET',
        success: function(data, textStatus, jqXHR) {

            let commitDate = new Date(data[0]['commit']['committer']['date']);
            let month = commitDate.getMonth() + 1;
            let day = commitDate.getDate();
            commitDate = month + '/' + day;

            const linkHeader = jqXHR.getResponseHeader('Link'); // Get the 'Link' header
            const lastPage = linkHeader.match(/page=(\d+)>; rel="last"/)[1];
            $('.build-number').text('- Version b' + lastPage + ' (' + commitDate + ')');
        }
    });
}



let selectedModalTheme = 'auto';

function changeThemeViaModal(newTheme) {

    $('.theme-modal-selected').removeClass('theme-modal-selected')

    if (newTheme === 'auto') {
        const currentHour = new Date().getHours();
        newTheme = (currentHour <= 7 || currentHour >= 18) ? 'dark' : 'light';
        selectedModalTheme = newTheme;
        $('.theme-modal-auto').addClass('theme-modal-selected');
        settings['theme'] = 'auto'
        localStorage.setItem('settings', JSON.stringify(settings))
        
    } else if (newTheme === 'confirm') {
        $('.theme-modal').fadeOut();
        $(`div[settings-option="theme"]`).removeClass('settings-selected') // hack, I ain't refactoring this anytime soon
        $(`div[theme-option="${selectedModalTheme}"]`).addClass('settings-selected')

        setDefaultSettings(); // must do default settings first

        settings['theme'] = selectedModalTheme;
        localStorage.setItem('settings', JSON.stringify(settings));

        if (selectedModalTheme === 'auto') {
            const currentHour = new Date().getHours();
            selectedModalTheme = (currentHour <= 7 || currentHour >= 18) ? 'dark' : 'light';
        }
        console.log("User's first theme selection is: " + selectedModalTheme)
        setTimeout(() => {
            document.documentElement.setAttribute('theme', selectedModalTheme);
            changeMapStyle(selectedModalTheme);
        }, 0);

    } else {
        $('.theme-modal-auto').removeClass('theme-modal-selected');
        $(`img[theme-option="${newTheme}"]`).addClass('theme-modal-selected');
        selectedModalTheme = newTheme;
        settings['theme'] = selectedModalTheme;
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    changeMapStyle(newTheme);

}