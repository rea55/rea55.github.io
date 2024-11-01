let map;                        
let latcenter = 47.367194;      //The Center of the Map
let lngcenter = 8.545139;       
let lat1 = 47.367194;           //The Coordinates of the Marker no1
let lng1 = 8.545139;            
let lat2 = 47.366389;           //The Coordinates of the Marker no2
let lng2 = 8.541444;                                      
let chosenlat = 0;              //the Coordinates of the new chosen location
let chosenlng = 0;              
const searchBar = document.getElementById('searchBar');     //the search Bar
const markers = {};             //An Array of all the Markers

let finalBikePathsArray = [[], []]    //An Array of the percentage of the route that intersects with different types of bike paths. Geometry: [[percentage1.1, percentage1.2, percentage1.3], [percentage2.1, percentage2.2, percentage2.3], ...]

let TrafficLightIntersectionList = [] //A list of the number of traffic lights that intersect with the route

const ratingsList = document.getElementById('Ratings_List'); //The list of all the ratings of the routes

let percentageIntersectingAreaList = [] //A list of the percentage of the route that intersects with bike paths

var coordinates = []            

let RoutesDistancesList = [];   //A list the distance for each route

let polylinesArray = []; // Array to store polylines

let routeColors = ['#FF0000', '#000000', '#0000FF']; // Red, Black, Blue

let RouteNames = ['Red', 'Black', 'Blue']; //A list of the names of all the routes which will be displayed in the "Ratings" part of the HTML

const apiKey = 'AIzaSyAG8M_Uhho1glaT4N1MRY3ZsaNkywROGTk';   //my google maps API key
const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';    //The link that is used to make a request to google maps to compute the routes

let BikePathsFound = false



function ResetVars() {
    console.log('RESETTING VARIABLES')
    coordinates = [];
    RoutesDistancesList = [];
    percentageIntersectingAreaList = [];
    finalBikePathsArray = [[], []];
    metersuplist = [];
    metersdownlist = [];
    metersup = 0;
    metersdown = 0;
    BikePathsFound = false;
    clearAllPolylines();
    //ratingsList.innerHTML = '';
}

function addMarker(name, lat, lng, Label) {         //Adds a Marker to the map, taking its Name, position, and a label and adds it to a list of all markers
    const pos = { lat: lat, lng: lng };            
        const marker = new google.maps.Marker({         
        position: pos,
        map: map,
        title: name,
        label: Label,
    });
    markers[name] = marker;                   
}

function delMarker(name) {                          //deletes a marker by it name in the "markers" list.
    if (markers[name]) {
        markers[name].setMap(null);
        delete markers[name];
    } else {
        console.error("Tried to delete a marker; marker not found");
    }
}

function intersectTrafficLights(segments, bufferedTrafficLights) {
    console.log('AWWOOOOOO', segments)
    let numberofTrafficLightIntersections = 0;

    outerLoop:
    for (const bufferedLight of bufferedTrafficLights) {
        for (const segment of segments) {
            const lineSegment = turf.lineString(segment);
            const bufferedSegment = turf.buffer(lineSegment, 0.1, { units: 'meters' });
            const intersection = turf.intersect(bufferedSegment, bufferedLight);
            if (intersection) {
                console.log("Intersection found between segment and traffic light.");
                numberofTrafficLightIntersections += 1;
                continue outerLoop;
            } else {
                console.log("No intersection found for segment and traffic light.");
            }
        }
    }
    
    console.log('Number of traffic light intersections:', numberofTrafficLightIntersections);
    TrafficLightIntersectionList.push(numberofTrafficLightIntersections)
}

function checkSegmentOnBikePath(segment, bikePaths, type, bufferSize = 10) {
    totalIntersectionArea = 0; // Initialize totalIntersectionArea here
    console.log('bikepath', bikePaths);
    console.log('Checking segment:', segment);

    // Validate segment
    if (!Array.isArray(segment) || segment.length < 2) {    
        console.error("Invalid segment:", segment);
        return false;
    }

    // Ensure segment coordinates are numbers
    const validsegment = [segment[0][0]];
    for (let i = 0; i < segment.length; i++) {
        validsegment.push(segment[i][1]);
    }

    for (let i = 0; i < validsegment.length; i++) {
        validsegment[i].push(validsegment[i][0]);
        validsegment[i].shift();
    }
    const lineSegment = turf.lineString(validsegment);
    //console.log("GeoJSON segment:", JSON.stringify(lineSegment, null, 2)); // Log GeoJSON format of the segment

    // Buffer the segment to create a polygon around it
    const bufferedSegment = turf.buffer(lineSegment, 0.1, { units: 'meters' });
    //console.log("Buffered segment:", JSON.stringify(bufferedSegment, null, 2));

    const bufferedSegmentArea = turf.area(bufferedSegment);
    //console.log(`Area of buffered segment: ${bufferedSegmentArea.toFixed(2)} square meters`);

    let totalIntersectingLength = 0; // Initialize totalIntersectingLength here

    for (const path of bikePaths) {
        // Validate bike path geometry
        if (!path.geometry || !Array.isArray(path.geometry)) {
            console.error("Invalid path geometry:", path);
            continue; // Skip to the next path
        }

        // Ensure bike path coordinates are numbers and in [lon, lat] order
        const coordinates = path.geometry.map(coord => [
            parseFloat(coord.lon),
            parseFloat(coord.lat)
        ]);

        //console.log('Coordinates UwU:', coordinates, path);

        if (coordinates.length === 0) {
            console.error("Empty bike path coordinates:", path);
            continue;
        }

        const bikePath = turf.lineString(coordinates);
        //console.log("GeoJSON bike path:", JSON.stringify(bikePath, null, 2));

        // Buffer the bike path (optional for tolerance)
        const bufferedBikePath = turf.buffer(bikePath, bufferSize, { units: 'meters' });
        //console.log("Buffered bike path:", JSON.stringify(bufferedBikePath, null, 2));

        // Check if the buffered segment intersects with the buffered bike path
        const intersection = turf.intersect(bufferedSegment, bufferedBikePath);
        if (intersection) {
            //console.log("GeoJSON intersection:", JSON.stringify(intersection, null, 2));
            console.log("Intersection found between segment and bike path.");
            const intersectionLength = turf.length(intersection, { units: 'meters' });
            totalIntersectingLength += intersectionLength;

            // Calculate the area of the intersection and add to totalIntersectionArea
            const intersectionArea = turf.area(intersection);
            totalIntersectionArea += intersectionArea;
            
        } else {
            console.log("No intersection found for segment.");
            continue; // Skip to the next path
        }
    }
    const totalSegmentLength = turf.length(lineSegment, { units: 'meters' });
    const percentageIntersecting = (totalIntersectingLength / totalSegmentLength) * 100;
    percentageIntersectingArea = ((totalIntersectionArea/bufferedSegmentArea)*100)
    percentageIntersectingAreaList.push(percentageIntersectingArea)
    //console.log('BOOP', totalSegmentLength, totalIntersectingLength)
    //console.log(`Percentage of segment intersecting with bike paths: ${percentageIntersecting.toFixed(2)}%`);
    //console.log(`Percentage of segment areaintersecting with bike paths: ${percentageIntersectingArea.toFixed(2)}%`);
    //console.log(`Total area of intersections: ${totalIntersectionArea.toFixed(2)} square meters`);
    //console.log('PERCENTAGE', percentageIntersectingAreaList)

    if (percentageIntersectingAreaList.length == polylinesArray.length) {
        if (type == 'highway=cycleway' ){
            finalBikePathsArray[0] = percentageIntersectingAreaList
        } else if (type == 'bicycle=yes' ){
            finalBikePathsArray[1] = percentageIntersectingAreaList
        }
        console.log('FINAL', finalBikePathsArray, type)
        percentageIntersectingAreaList = []
    }
}




function initMap() {
    var directionsService = new google.maps.DirectionsService();
    var directionsRenderer = new google.maps.DirectionsRenderer();
    var elevationService = new google.maps.ElevationService();

    //calculateAndDisplayRoute(directionsService, directionsRenderer)

    const center = { lat: latcenter, lng: lngcenter };
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 16,
        streetViewControl: false, //enable Anubis by turning streetViewControl to TRUE
        mapTypeControl: false, //enable Sattelite by turning mapTypeControl to TRUE
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DEFAULT,
            position: google.maps.ControlPosition.BOTTOM_LEFT
        }
    });

    directionsRenderer.setMap(map);

    const bikeLayer = new google.maps.BicyclingLayer();

    bikeLayer.setMap(map);

    addMarker('Startpoint', lat1, lng1, 'A');
    addMarker('Endpoint', lat2, lng2, 'B');

    fetchRouteAndRender(elevationService);

    const searchBox = new google.maps.places.SearchBox(searchBar);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBar);

    map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
    });

    let markers = [];

    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        const selectedPlace = places[0];

        if (!selectedPlace.geometry || !selectedPlace.geometry.location) {
            console.error('Returned place contains no geometry');
            return;
        }

        const latitude = selectedPlace.geometry.location.lat();
        const longitude = selectedPlace.geometry.location.lng();

        chosenlat = latitude;
        chosenlng = longitude;

        markers.forEach((marker) => {
            marker.setMap(null);
        });

        const bounds = new google.maps.LatLngBounds();

        markers.push(
            new google.maps.Marker({
                map,
                title: selectedPlace.name,
                position: { lat: latitude, lng: longitude },
            })
        );

        map.fitBounds(selectedPlace.geometry.viewport);
    });

    // Create the button for 'Choose As B'
    const chooseBButton = document.createElement('button');
    chooseBButton.textContent = 'Choose As B';
    chooseBButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(chooseBButton);
    chooseBButton.addEventListener('click', () => ChooseBAsButton(elevationService));

    // Create the button for 'Choose As A'
    const chooseAButton = document.createElement('button');
    chooseAButton.textContent = 'Choose As A';
    chooseAButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(chooseAButton);
    chooseAButton.addEventListener('click', () => ChooseAAsButton(elevationService));

    const HowToUseBTN = document.getElementById('HowToUseBTN');
    const AboutMeBTN = document.getElementById('AboutMeBTN');
    const ContactBTN = document.getElementById('ContactBTN');
    HowToUseBTN.addEventListener('click', () => scrolltoitem('HowToUse'));
    AboutMeBTN.addEventListener('click', () => scrolltoitem('AboutMe'));
    ContactBTN.addEventListener('click', () => scrolltoitem('Contact'));

    ScrollUpBTN.addEventListener('click', () => scrolltotop());

    window.addEventListener('scroll', function () {
        const scrollUpButton = document.getElementById('ScrollUpBTN');
        const scrollPosition = window.scrollY;

        // Calculate opacity based on scroll position
        let opacity = 0;
        if (scrollPosition < 100) {
            opacity = scrollPosition / 100; // Gradual increase from 0 to 1
        } else {
            opacity = 1; // Full opacity after 100 pixels of scroll
        }

        // Apply opacity to the button
        scrollUpButton.style.opacity = opacity.toString();

        // Show or hide based on scroll position
        if (scrollPosition < 100) {
            scrollUpButton.style.display = 'block';
        } else {
            scrollUpButton.style.display = 'block'; // Keep button visible after 100px
        }
    });
}

function ChooseAAsButton(elevationService) {
    ResetVars()
    lat1 = chosenlat;
    lng1 = chosenlng;
    delMarker('Startpoint');
    addMarker('Startpoint', lat1, lng1, 'A');
    fetchRouteAndRender(elevationService);
}

function ChooseBAsButton(elevationService) {
    ResetVars()
    lat2 = chosenlat;
    lng2 = chosenlng;
    delMarker('Endpoint');
    addMarker('Endpoint', lat2, lng2, 'B');
    fetchRouteAndRender(elevationService);
}

function scrolltoitem(itemid) {
    let element = document.getElementById(itemid);
    window.scrollTo({
        top: element.offsetTop - 75,
        behavior: 'smooth' // Optional for smooth scroll
    });

}

function scrolltotop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    const scrollUpButton = document.getElementById('ScrollUpBTN');
    if (window.scrollY === 0) {
        scrollUpButton.style.display = 'none'; // Hide the button
    } else {
        scrollUpButton.style.display = 'block'; // Show the button
    }
}




async function getBikePaths(bbox, type) {
    const query = `
    [out:json];
    way[${type}](${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]});
    out geom;
    `;
    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching bike paths: ", error);
    }
    
}


function drawBoundaryBoxForOSMCheck(bottom_left, top_right){

    if (rectangle) {
        rectangle.setMap(null); // Remove the rectangle from the map
        rectangle = null; // Optionally, reset the rectangle variable
    }

    var rectangleBounds = new google.maps.LatLngBounds(
        // Bottom-left corner (southwest)
        { lat: bottom_left[0], lng: bottom_left[1] },
        // Top-right corner (northeast)
        { lat: top_right[0], lng: top_right[1] }
      );

    var rectangle = new google.maps.Rectangle({
        bounds: rectangleBounds,
        //editable: true, // Makes it resizable by the user
        //draggable: true, // Makes it draggable by the user
        map: map,
        fillColor: "#555555",
        fillOpacity: 0,
        strokeOpacity: 0.5,
        strokeWeight: 2,
        strokeColor: "#555555",
      });
}

function findAndCheckBikePaths(type, bbox, segments) {
    console.log('Finding bike paths of type:', type);
    return getBikePaths(bbox, type).then(data => {
        if (data.elements.length == 0){
            console.log('No bike paths found for type:', type);
            BikePathsFound = false
            if (type == 'highway=cycleway' ){
                finalBikePathsArray[0].push(0)
            } else if (type == 'bicycle=yes' ){
                finalBikePathsArray[1].push(0)
            }
            //the following problem: if there are no bike paths found, the function will not be called again, so the finalBikePathsArray will not be filled with the percentage of the route that intersects with the bike paths
        }
        else{
            console.log('length', data.elements.length)
            BikePathsFound = true
            checkSegmentOnBikePath(segments, data.elements, type)
        }
    });
}


async function getTrafficLights(bbox, segments) {   //Function to get the traffic lights in a certain area  
    const query = `
    [out:json];
    node[highway=traffic_signals](${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]});
    out geom;
    `; 
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    console.log('traffic lights url:', url);   
    try {
        const response = await axios.get(url);
        console.log('Traffic lights:', response.data.elements);
        checkTrafficLights(response.data.elements, segments);
        return response.data.elements;
    } catch (error) {
        console.error("Error fetching traffic lights: ", error);
    }
}

function checkTrafficLights(trafficLights, segments) {

    const bufferedPolygons = [];

    for (const light of trafficLights) {
        const lat = light.lat;
        const lon = light.lon;
        console.log(`Traffic light at latitude ${lat} and longitude ${lon}`);

        // Create a point for the traffic light
        const point = turf.point([lon, lat]);

        // Buffer the point by 5 meters
        const buffered = turf.buffer(point, 20, { units: 'meters' });
        bufferedPolygons.push(buffered);
    }
    intersectTrafficLights(segments, bufferedPolygons);
}

function checkForOSMBikepaths(PolylineCoords) {
    let bbox_bottom_left =[200,200]
    let bbox_top_right = [-200,-200]
    const segments = [];
    
    for (let i = 0; i < PolylineCoords.length - 1; i++) {
        const start = PolylineCoords[i];
        const end = PolylineCoords[i + 1];
        segments.push([start, end]);
        
        if (PolylineCoords[i][0] < bbox_bottom_left[0]){
            bbox_bottom_left[0] = PolylineCoords[i][0]
        }
        if (PolylineCoords[i][1] < bbox_bottom_left[1]){
            bbox_bottom_left[1] = PolylineCoords[i][1]
        }
        if (PolylineCoords[i][0] > bbox_top_right[0]){
            bbox_top_right[0] = PolylineCoords[i][0]
        }
        if (PolylineCoords[i][1] > bbox_top_right[1]){
            bbox_top_right[1] = PolylineCoords[i][1]
        }

    }
    //drawBoundaryBoxForOSMCheck(bbox_bottom_left, bbox_top_right)
    
    const bbox = [bbox_bottom_left[0], bbox_bottom_left[1], bbox_top_right[0], bbox_top_right[1]];

    findAndCheckBikePaths('highway=cycleway', bbox, segments).then(() => {
        return findAndCheckBikePaths('bicycle=yes', bbox, segments);
    });
    getTrafficLights(bbox,segments);
}

    


function fetchRouteAndRender(elevationService) {
    const requestData = {
        origin: {
            location: {
                latLng: {
                    latitude: lat1,
                    longitude: lng1,
                },
            },
        },
        destination: {
            location: {
                latLng: {
                    latitude: lat2,
                    longitude: lng2,
                },
            },
        },
        travelMode: 'BICYCLE',  // Correct, valid value
        computeAlternativeRoutes: true,  // Correct
        languageCode: 'en-US',  // Correct
        units: 'METRIC',  // Correct
    };
    

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps',
        },
        body: JSON.stringify(requestData),
    })
    .then((response) => response.json())
    .then((data) => {
        // Clear existing polylines and ratings list
        clearAllPolylines();
        ratingsList.innerHTML = '';

        const polylines = data.routes.map((route) => route.polyline.encodedPolyline);
        const totalDistance = data.routes.reduce((sum, route) => sum + route.distanceMeters, 0);

        polylines.forEach((polyline, index) => {
            const decodedPolyline = google.maps.geometry.encoding.decodePath(polyline);
            //console.log('POLYSEXUAL', decodedPolyline)
            let PolylineCoords = []
            decodedPolyline.forEach((point, pointIndex) => {
                PolylineCoords.push([point.lat(), point.lng()])
                //console.log(`Point ${pointIndex}: Latitude = ${point.lat()}, Longitude = ${point.lng()}`);
            });  
            
            const routeDistance = data.routes[index].distanceMeters;
            RoutesDistancesList.push(routeDistance);
            

            
            const routePolyline = new google.maps.Polyline({
                path: decodedPolyline,
                geodesic: true,
                strokeColor: routeColors[index % routeColors.length], // Cycle through colors
                strokeOpacity: 1.0,
                strokeWeight: 2,
            });
        
            routePolyline.setMap(map);
            polylinesArray.push(routePolyline); // Store the polyline in the array

            // Fetch elevation data for the route
            fetchElevationData(elevationService, decodedPolyline, index);
            
            checkForOSMBikepaths(PolylineCoords);

            setTimeout(() => {
                const ratingItem = document.createElement('p');
                console.log('agag', metersuplist, finalBikePathsArray); // Debugging log

                // Check if finalBikePathsArray[1] and finalBikePathsArray[0] are defined
                if (finalBikePathsArray[1] && finalBikePathsArray[1][index] !== undefined && finalBikePathsArray[0] && finalBikePathsArray[0][index] !== undefined) {
                    ratingItem.innerText = `${RouteNames[index]}: \n 
                    Distance: ${routeDistance.toFixed(2)} meters\n
                    Elevation Gain: ${metersuplist[index].toFixed(2)} meters\n
                    Elevation Loss: ${metersdownlist[index].toFixed(2)} meters\n
                    highway=cycleway: ${finalBikePathsArray[0][index].toFixed(2)}%\n
                    bicycle=yes: ${finalBikePathsArray[1][index].toFixed(2)}%\n
                    traffic lights: ${TrafficLightIntersectionList[index]}\n`;
                } else if (finalBikePathsArray[0] && finalBikePathsArray[0][index] !== undefined) {
                    ratingItem.innerText = `${RouteNames[index]}: \n 
                    Distance: ${routeDistance.toFixed(2)} meters\n
                    Elevation Gain: ${metersuplist[index].toFixed(2)} meters\n
                    Elevation Loss: ${metersdownlist[index].toFixed(2)} meters\n
                    highway=cycleway: ${finalBikePathsArray[0][index].toFixed(2)}%\n
                    bicycle=yes: Data not available\n
                    traffic lights: ${TrafficLightIntersectionList[index]}\n`;
                } else {
                    ratingItem.innerText = `${RouteNames[index]}: \n 
                    Distance: ${routeDistance.toFixed(2)} meters\n
                    Elevation Gain: ${metersuplist[index].toFixed(2)} meters\n
                    Elevation Loss: ${metersdownlist[index].toFixed(2)} meters\n
                    highway=cycleway: Data not available\n
                    bicycle=yes: Data not available\n
                    traffic lights: ${TrafficLightIntersectionList[index]}\n`;
                }

                ratingsList.appendChild(ratingItem);
            }, 5000); // Ensure the timeout duration is sufficient for async operations
            

        });
        
                
        
    })
    .catch((error) => console.error('Error:', error));
}

function fetchElevationData(elevationService, path, routeIndex) {
    metersuplist = []
    metersdownlist =[]
    //console.log('yaaasass', RoutesDistancesList)
    numbersOfSamples = Math.round(RoutesDistancesList[0]/100)                                      //WORK ON THIS ONLY WORKS IF LEN(RoutesDisatancesList === 1)
    //console.log('NOMBER OF SAMPLES', numbersOfSamples)
    const pathRequest = {
        path: path,
        samples: numbersOfSamples, // You can adjust the number of samples
        
    };


    elevationService.getElevationAlongPath(pathRequest, (results, status) => {
        if (status === 'OK') {
            if (results) {
                metersdown = 0
                metersup = 0
                //console.log(`Elevation data for route ${routeIndex + 1}:`, results);
                
                

                // Extract elevation values
                const elevations = results.map(result => result.elevation);

                results.forEach(result => {
                    const location = result.location;
                    coordinates.push({ lat: location.lat(), lng: location.lng() }); // Extract lat and lng
                  });
                //console.log('COORD', coordinates)


                lastElevation = elevations[0]
                for(const value of elevations) {
                    if (value > (lastElevation)){
                        metersup = metersup + (value - lastElevation) 
                    }
                    else if (value < (lastElevation)){
                        metersdown = metersdown + (lastElevation - value) 
                    }
                }
                //console.log('up', metersup, 'down', metersdown)
                metersdownlist.push(metersdown)
                metersuplist.push(metersup)



            } else {
                console.error('No elevation results found');
            }
        } else {
            console.error('Elevation service failed due to:', status);
        }

    //window.setTimeout(() => CheckForBicyclePathsAlongRoute(), 200);


    });
    
    
}


function clearAllPolylines() {
    polylinesArray.forEach((polyline) => {
        polyline.setMap(null);
    });
    polylinesArray = [];
}
/*
function CheckForBicyclePathsAlongRoute(){
    //('CHECKING WAA', coordinates)
    for (i in coordinates){
        //console.log('WAAAAAA', coordinates[i])
        checkBicyclePath(coordinates[i].lat, coordinates[i].lng)
    }
}
*/
function convertPolylineToRoute(){

}




const width_of_map_container = document.querySelector('#map_container').offsetWidth;
searchBar.style.width = `${width_of_map_container}px`;

function run(){
window.initMap = initMap;
}

setTimeout(run, 1000)


//key page: AIzaSyAG8M_Uhho1glaT4N1MRY3ZsaNkywROGTk



//Different forms of bikepath to add:
//route=bicycle
//bicycle=yes
//bicycle=designated
//


//surface and smoothness