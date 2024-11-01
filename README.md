# MapsProject

## MapsProject
This project is a web application that allows users to find and visualize bike routes on a map. It uses the Google Maps API to display the map and routes, and the Overpass API to fetch bike paths and traffic lights data. The application also calculates and displays various metrics for the routes, such as distance, elevation gain/loss, and intersections with bike paths and traffic lights.

## Features
Display a map centered at a specified location.
Search for locations using a search bar.
Add markers for start and end points of a route.
Fetch and display bike routes between the start and end points.
Calculate and display metrics for the routes, including:
Distance
Elevation gain and loss
Percentage of the route that intersects with bike paths
Number of traffic lights intersecting the route
Setup
Clone the repository to your local machine.
Open the index2.html file in a web browser.
Usage
Type your starting location into the search bar and press "Enter".
Click the "Choose As A" button to set the starting point.
Type your ending location into the search bar and press "Enter".
Click the "Choose As B" button to set the ending point.
The map will display up to 3 routes between the start and end points.
The metrics for each route will be displayed in the "Ratings" section.

## Functions
### initMap()
Initializes the map, adds event listeners for the search bar and buttons, and fetches and renders the routes.

### ResetVars()
Resets various global variables used in the application.

### addMarker(name, lat, lng, Label)
Adds a marker to the map at the specified latitude and longitude.

### delMarker(name)
Deletes a marker from the map by its name.

### intersectTrafficLights(segments, bufferedTrafficLights)
Calculates the number of intersections between the route segments and traffic lights.

### checkSegmentOnBikePath(segment, bikePaths, type, bufferSize)
Checks if a route segment intersects with bike paths and calculates the percentage of intersection.

### getBikePaths(bbox, type)
Fetches bike paths data from the Overpass API.

### drawBoundaryBoxForOSMCheck(bottom_left, top_right)
Draws a boundary box on the map for the specified coordinates.

### findAndCheckBikePaths(type, bbox, segments)
Finds and checks bike paths for intersections with the route segments.

### getTrafficLights(bbox, segments)
Fetches traffic lights data from the Overpass API.

### checkTrafficLights(trafficLights, segments)
Buffers the traffic lights and checks for intersections with the route segments.

### checkForOSMBikepaths(PolylineCoords)
Checks for bike paths and traffic lights along the route.

### fetchRouteAndRender(elevationService)
Fetches the routes from the Google Maps API and renders them on the map. Also calculates and displays the metrics for each route.

### fetchElevationData(elevationService, path, routeIndex)
Fetches elevation data for the route and calculates the elevation gain and loss.

### clearAllPolylines()
Clears all polylines from the map.

### scrolltoitem(itemid)
Scrolls to the specified item on the page.

### scrolltotop()
Scrolls to the top of the page.

## Dependencies
Google Maps JavaScript API
Overpass API
Axios
Turf.js

## License
This project is licensed under the MIT License.
