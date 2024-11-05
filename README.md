<p align="center">
  RUBus is a feature-packed progressive web app (PWA) alternative to the Passio GO! apps for Rutgers University–New Brunswick.
  <em>This project is unaffiliated with Rutgers and Passio Technologies.</em>
  <br><br>
  <img src="https://github.com/user-attachments/assets/fce7fc0e-7cac-4f11-a23f-1bd8ca345b34" width="40%" />
  <img src="https://github.com/user-attachments/assets/a7da8d6b-8828-4d18-ab37-c0a9dd19c154" width="40%" /> 
<p>
<br>
RUBus features real-time bus locations, bearings, capacities, speeds, time stopped, ETAs, and ridership, alongside customization options. Bus positioning is fetched from the Passio API while live speed and ridership estimations are calculated on the client.

This repo does not provide or include a method by which to calculate ETAs. Your own external endpoints or sockets will have to be set if you're computing these server-side.
<br><br>
Alternatively, you can use Passio's own ETA endpoint, although the methodology they use to calculate ETA is unclear:
<br>
`GET passiogo.com/mapGetData.php?eta=<int>&routeId=<int>&stopIds=<int list>&routeIds=<int list>`
<br><br>
You will also need to supply your own map tiles API key in `js/maps.js`' and LineString, routes, and stops endpoints in `js/poly.js` if you're not serving these locally.
<br><br>
This app can easily be made to service another bus network Passio handles by changing the form data parameters in `js/pre.js` and map coordinates and bounds in `js/map.js`.