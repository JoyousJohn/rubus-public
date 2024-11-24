$('.settings-toggle .toggle-input').on('change', function () {
    const toggleId = $(this).attr('id');
    const isChecked = $(this).prop('checked');

    switch (toggleId) {

        case 'toggle-select-closest-stop':
            console.log(`Auto select closest stop ${isChecked ? 'ON' : 'OFF'}`);
            settings['toggle-select-closest-stop'] = isChecked;
            break;

        case 'toggle-show-arrival-times':
            console.log(`Show arrival times now ${isChecked ? 'ON' : 'OFF'}`);
            settings['toggle-show-arrival-times'] = isChecked;
            break;

        case 'toggle-show-bus-speeds':
            console.log(`Show bus speeds now ${isChecked ? 'ON' : 'OFF'}`);
            showBusSpeeds = isChecked;
            settings['toggle-show-bus-speeds'] = isChecked;
            if (!isChecked) {
                $('.info-speed-wrapper').hide();
            } else {
                $('.info-speed-wrapper').show();
            }
            break;

        case 'toggle-pause-update-marker':
            console.log(`Pause update marker positions now ${isChecked ? 'ON' : 'OFF'}`);

            if (isChecked) {
                for (const busId in animationFrames) {
                    cancelAnimationFrame(animationFrames[busId]);
                    delete animationFrames[busId];
                }
                pauseUpdateMarkerPositions = true;
            } else {
                pauseUpdateMarkerPositions = false;
            }

            break;

        case 'toggle-pause-rotation-updating':
            console.log(`Pause rotation updating now ${isChecked ? 'ON' : 'OFF'}`);
            pauseRotationUpdating = isChecked
            break;

        case 'toggle-whole-pixel-positioning':
            console.log(`Whole pixel positioning is now ${isChecked ? 'ON' : 'OFF'}`);
            wholePixelPositioning = isChecked
            break;

        case 'toggle-pause-passio-polling':
            console.log(`Pause Passio Polling is now ${isChecked ? 'ON' : 'OFF'}`);
            break;

        case 'toggle-disconnect-rubus':
            console.log(`Disconnect from RUBus WSS is now ${isChecked ? 'ON' : 'OFF'}`);
            break;

        case 'toggle-show-stop-polygons':
            console.log(`Show Stop Polygons is now ${isChecked ? 'ON' : 'OFF'}`);

            if (Object.keys(polygons).length === 0) {
                makePolygons()
            }
            togglePolygons(isChecked)
            settings['toggle-show-stop-polygons'] = isChecked;
            break;

        default:
            console.log(`Unknown toggle changed: ${toggleId}`);
            break;
    }

    localStorage.setItem('settings', JSON.stringify(settings))

});

$(document).ready(function() {

    // Untoggle if the switch is not one that gets saved in settings (like some of the dev ones)
    $('.dev-options-wrapper .toggle-input').each(function() {
        const toggleId = $(this).attr('id');
        if (!(toggleId in defaultSettings)) {
            $(this).prop('checked', false);
        }
    });

    if (!settings['toggle-show-bus-speeds']) {
        $('.info-speed-wrapper').hide();
    }

    if (settings['toggle-show-stop-polygons']) {
        makePolygons()
        togglePolygons(true)
    }

})


let polygons = {}

function makePolygons() {

    for (const stopId in stopsData) {
        const stop = stopsData[stopId];

        const polygonCoordinates = stop.polygon.map(coord => [
            coord[1],
            coord[0]
        ]);

        const polygon = L.polygon(polygonCoordinates, {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.5
        })

        polygons[stopId] = polygon;

        // polygon.on('click', () => {
        //     alert(`Stop Name: ${stop.name}`);
        // });
    }
}

function togglePolygons(show) {

    for (const stopId in polygons) {
        const polygon = polygons[stopId];
        
        if (show) {
            polygon.addTo(map);
        } else {
            polygon.removeFrom(map);
        }
    }
}