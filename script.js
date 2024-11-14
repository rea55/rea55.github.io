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

const throbber = document.getElementById('throbber');

let finalBikePathsArray = [[], [], [], [], [], [], [], [], [69, 69, 69]];

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

var oneRoute = true;

let metersuplist = [];
let metersdownlist = [];

let weight_Distance = 0.5;
let weight_Elevation_Gain = 0.5;
let weight_Elevation_Loss = 0.5;
let weight_highway_cycleway = 0.5;
let weight_bicycle_yes = 0.5;
let weight_surface_paved = 0.5;
let weight_surface_asphalt = 0.5;
let weight_route_bicycle = 0.5;
let weight_bicycle_designated = 0.5;
let weight_surface_concrete = 0.5;
let weight_surface_sett = 0.5;
let weight_traffic_lights = 0.5;

var Distance_ratingList = [];
var Elevation_Gain_ratingList = [];
var Elevation_Loss_ratingList = [];
var highway_cycleway_ratingList = [];
var bicycle_yes_ratingList = [];
var surface_paved_ratingList = [];
var surface_asphalt_ratingList = [];
var route_bicycle_ratingList = [];
var bicycle_designated_ratingList = [];
var surface_concrete_ratingList = [];
var surface_sett_ratingList = [];
var traffic_lights_ratingList = [];

var finalRatingList = []; 


function ResetVars() {
    console.log('RESETTING VARIABLES')
    coordinates = [];
    RoutesDistancesList = [];
    percentageIntersectingAreaList = [];
    finalBikePathsArray = [[], [], [], [], [], [], [], [], [69, 69, 69]];
    metersuplist = [];
    metersdownlist = [];
    metersup = 0;
    metersdown = 0;
    BikePathsFound = false;
    clearAllPolylines();
    //ratingsList.innerHTML = '';
}

function addMarker(name, lat, lng, Label) {         //Adds a Marker to the map, taking its Name, position, and a label and adds it to a list of all markers
    console.log('addMarker')
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
    console.log('delMarker')
    if (markers[name]) {
        markers[name].setMap(null);
        delete markers[name];
    } else {
        console.error("Tried to delete a marker; marker not found");
    }
}

function intersectTrafficLights(segments, bufferedTrafficLights) {
    console.log('intersectTrafficLights')
    let numberofTrafficLightIntersections = 0;

    outerLoop:
    for (const bufferedLight of bufferedTrafficLights) {
        for (const segment of segments) {
            const lineSegment = turf.lineString(segment);
            const bufferedSegment = turf.buffer(lineSegment, 0.1, { units: 'meters' });
            const intersection = turf.intersect(bufferedSegment, bufferedLight);
            if (intersection) {
                numberofTrafficLightIntersections += 1;
                continue outerLoop;
            } else {
            }
        }
    }
    
    TrafficLightIntersectionList.push(numberofTrafficLightIntersections)
    return TrafficLightIntersectionList;
}

function checkSegmentOnBikePath(segment, bikePaths, type, bufferSize = 10) {
    console.log('checkSegmentOnBikePath')
    totalIntersectionArea = 0; // Initialize totalIntersectionArea here


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

    // Buffer the segment to create a polygon around it
    const bufferedSegment = turf.buffer(lineSegment, 0.1, { units: 'meters' });

    const bufferedSegmentArea = turf.area(bufferedSegment);

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

        if (coordinates.length === 0) {
            console.error("Empty bike path coordinates:", path);
            continue;
        }

        const bikePath = turf.lineString(coordinates);

        // Buffer the bike path (optional for tolerance)
        const bufferedBikePath = turf.buffer(bikePath, bufferSize, { units: 'meters' });

        // Check if the buffered segment intersects with the buffered bike path
        const intersection = turf.intersect(bufferedSegment, bufferedBikePath);
        if (intersection) {
            const intersectionLength = turf.length(intersection, { units: 'meters' });
            totalIntersectingLength += intersectionLength;

            // Calculate the area of the intersection and add to totalIntersectionArea
            const intersectionArea = turf.area(intersection);
            totalIntersectionArea += intersectionArea;
            
        } else {
            continue; // Skip to the next path
        }
    }
    const totalSegmentLength = turf.length(lineSegment, { units: 'meters' });
    const percentageIntersecting = (totalIntersectingLength / totalSegmentLength) * 100;
    percentageIntersectingArea = ((totalIntersectionArea/bufferedSegmentArea)*100)
    percentageIntersectingAreaList.push(percentageIntersectingArea)
    if (percentageIntersectingAreaList.length == polylinesArray.length) {
        if (type == 'highway=cycleway' && document.getElementById('highway=cyclewayCheck').checked){
            finalBikePathsArray[0] = percentageIntersectingAreaList
        } 
        else if (type == 'bicycle=yes' && document.getElementById('bicycle=yesCheck').checked){
            finalBikePathsArray[1] = percentageIntersectingAreaList
        }
        else if (type == 'surface=paved' && document.getElementById('surface=pavedCheck').checked){
            finalBikePathsArray[2] = percentageIntersectingAreaList
        }
        else if(type == 'surface=asphalt' && document.getElementById('surface=asphaltCheck').checked){
            finalBikePathsArray[3] = percentageIntersectingAreaList
        }
        else if(type == 'route=bicycle' && document.getElementById('route=bicycleCheck').checked){
            finalBikePathsArray[4] = percentageIntersectingAreaList
        }
        else if(type == 'bicycle=designated'&& document.getElementById('bicycle=designatedCheck').checked){
            finalBikePathsArray[5] = percentageIntersectingAreaList
        }
        else if(type == 'surface=concrete' && document.getElementById('surface=concreteCheck').checked){
            finalBikePathsArray[6] = percentageIntersectingAreaList
        }
        else if(type == 'surface=sett'&& document.getElementById('surface=settCheck').checked){
            finalBikePathsArray[7] = percentageIntersectingAreaList
        }


        percentageIntersectingAreaList = []
    }
    return finalBikePathsArray;
}

function initMap() {
    console.log('initMap')
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
    console.log('ChooseAAsButton')
    if (throbber) {
        throbber.style.display = 'block'; 
    }
    ResetVars()
    if (chosenlat == 0 && chosenlng == 0) {
        lat1 = 47.367194;
        lng1 = 8.545139;
    } else {
        lat1 = chosenlat;
        lng1 = chosenlng;
    }
    delMarker('Startpoint');
    addMarker('Startpoint', lat1, lng1, 'A');
    fetchRouteAndRender(elevationService);
}

function ChooseBAsButton(elevationService) {
    console.log('ChooseBAsButton')
    if (throbber) {
        throbber.style.display = 'block'; // or 'inline' or 'inline-block'
    }
    ResetVars()
    if (chosenlat == 0 && chosenlng == 0) {
        lat2 = 47.366389;
        lng2 = 8.541444;
    } else {    
        lat2 = chosenlat;
        lng2 = chosenlng;
    }
    delMarker('Endpoint');
    addMarker('Endpoint', lat2, lng2, 'B');
    fetchRouteAndRender(elevationService);
}

function scrolltoitem(itemid) {
    console.log('scrolltoitem')
    let element = document.getElementById(itemid);
    window.scrollTo({
        top: element.offsetTop - 75,
        behavior: 'smooth' // Optional for smooth scroll
    });

}

function scrolltotop() {
    console.log('scrolltotop')
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

document.addEventListener('DOMContentLoaded', (event) => {
    const rangeInputs = document.querySelectorAll('.rangeInputs input[type="range"]');
    rangeInputs.forEach(input => {
        
        // Add event listener to log the value when it changes
        input.addEventListener('input', (event) => {
            updateWeights(event.target.name, event.target.value);
        });
    });


    // Initialize the map after the DOM is fully loaded
    window.initMap = initMap;
    initMap();
});

function calculateRating(Valuelist, weight, ratinglist) {
    console.log('calculateRating')
    var ratingPreWeight = 0;
    var ratingPostWeight = 0;
    const min = Math.min(...Valuelist);
    const max = Math.max(...Valuelist);
    for (let i = 0; i < Valuelist.length; i++) {
        ratingPreWeight = ((Valuelist[i] - min) / (max - min));
        ratingPostWeight = ratingPreWeight * weight;
        ratinglist.push(ratingPostWeight);
    }
    if (ratingPostWeight == NaN) {  
        console.error('RatingPostWeight is NaN')
    }
    return ratingPostWeight;

}

function updateWeights(name, value) {
    console.log('updateWeights')
    switch(name) {
        case 'Distance':
            weight_Distance = parseFloat(value);
            break;
        case 'ElevationGain':
            weight_Elevation_Gain = parseFloat(value);
            break;
        case 'ElevationLoss':
            weight_Elevation_Loss = parseFloat(value);
            break;
        case 'highway=cycleway':
            weight_highway_cycleway = parseFloat(value);
            break;
        case 'bicycle=yes':
            weight_bicycle_yes = parseFloat(value);
            break;
        case 'surface=paved':
            weight_surface_paved = parseFloat(value);
            break;
        case 'surface=asphalt':
            weight_surface_asphalt = parseFloat(value);
            break;
        case 'route=bicycle':
            weight_route_bicycle = parseFloat(value);
            break;
        case 'bicycle=designated':
            weight_bicycle_designated = parseFloat(value);
            break;
        case 'surface=concrete':
            weight_surface_concrete = parseFloat(value);
            break;
        case 'surface=sett':
            weight_surface_sett = parseFloat(value);
            break;
        case 'trafficLights':
            weight_traffic_lights = parseFloat(value);
            break;
    }
    for(let i = 0; i < RoutesDistancesList.length; i++){
        displayRatings(RoutesDistancesList[i], metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, i);
    }
}

async function getBikePaths(bbox, type) {
    console.log('getBikePaths')
    if (type == 'route=bicycle'){
        const query = `
        [out:json];
        relation[${type}](${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]});
        out geom;
        `;
    }
    else {
        query = `
        [out:json];
        way[${type}](${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]});
        out geom;
        `; 
    }

    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching bike paths: ", error);
    }
    
}

function drawBoundaryBoxForOSMCheck(bottom_left, top_right){
    console.log('drawBoundaryBoxForOSMCheck')
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
    console.log('findAndCheckBikePaths')
    return getBikePaths(bbox, type).then(data => {
        if (data.elements.length == 0){
            BikePathsFound = false
            if (type == 'highway=cycleway' ){
                finalBikePathsArray[0].push(0)
            } 
            else if (type == 'bicycle=yes' ){
                finalBikePathsArray[1].push(0)
            }
            else if (type == 'surface=paved' ){
                finalBikePathsArray[2].push(0)
            }
            else if(type == 'surface=asphalt'){
                finalBikePathsArray[3].push(0)
            }
            else if(type == 'route=bicycle'){
                finalBikePathsArray[4].push(0)
            }
            else if(type == 'bicycle=designated'){
                finalBikePathsArray[5].push(0)
            }
            else if(type == 'surface=concrete'){
                finalBikePathsArray[6].push(0)
            }
            else if(type == 'surface=sett'){
                finalBikePathsArray[7].push(0)
            }
            
        }
        else{
            BikePathsFound = true

           checkSegmentOnBikePath(segments, data.elements, type)

        }
    });
}

async function getTrafficLights(bbox, segments) {   //Function to get the traffic lights in a certain area  
    console.log('getTrafficLights')
    const query = `
    [out:json];
    node[highway=traffic_signals](${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]});
    out geom;
    `; 
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;   
    try {
        const response = await axios.get(url);
        checkTrafficLights(response.data.elements, segments);
        return response.data.elements;
    } catch (error) {
        console.error("Error fetching traffic lights: ", error);
    }
}

function checkTrafficLights(trafficLights, segments) {
    console.log('checkTrafficLights')
    const bufferedPolygons = [];

    for (const light of trafficLights) {
        const lat = light.lat;
        const lon = light.lon;

        // Create a point for the traffic light
        const point = turf.point([lon, lat]);

        // Buffer the point by 5 meters
        const buffered = turf.buffer(point, 20, { units: 'meters' });
        bufferedPolygons.push(buffered);
    }
    intersectTrafficLights(segments, bufferedPolygons);
}

function checkForOSMBikepaths(PolylineCoords, routeIndex) {
    console.log('checkForOSMBikepaths')
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

    Promise.all([
        findAndCheckBikePaths('highway=cycleway', bbox, segments),
        findAndCheckBikePaths('bicycle=yes', bbox, segments),
        findAndCheckBikePaths('surface=paved', bbox, segments),
        findAndCheckBikePaths('surface=asphalt', bbox, segments),
        findAndCheckBikePaths('route=bicycle', bbox, segments),
        findAndCheckBikePaths('bicycle=designated', bbox, segments),
        findAndCheckBikePaths('surface=concrete', bbox, segments),
        findAndCheckBikePaths('surface=sett', bbox, segments),
        getTrafficLights(bbox, segments)
    ]).then(() => {
        console.log('All bike paths and traffic lights checked');
        displayRatings(RoutesDistancesList[routeIndex], metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, routeIndex);
    });
}

function displayRatings(routeDistance, metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, index) {
    console.log('displayRatings')
    return new Promise((resolve, reject) => {
        try {
            // Hide the throbber element
            if (throbber) {
                throbber.style.display = 'none';
            }

            for (let i = 0; i < finalBikePathsArray.length; i++) {
                for (let j = 0; j < finalBikePathsArray[i].length; j++) {
                    if (finalBikePathsArray[i][j] > 100) {
                        finalBikePathsArray[i][j] = 100;
                    }
                }
            }

            if (metersuplist.length > 1) {
                oneRoute = false;
                calculateRating(metersuplist, weight_Elevation_Gain, Elevation_Gain_ratingList);
                calculateRating(metersdownlist, weight_Elevation_Loss, Elevation_Loss_ratingList);
                calculateRating(finalBikePathsArray[0], weight_highway_cycleway, highway_cycleway_ratingList);
                calculateRating(finalBikePathsArray[1], weight_bicycle_yes, bicycle_yes_ratingList);
                calculateRating(finalBikePathsArray[2], weight_surface_paved, surface_paved_ratingList);
                calculateRating(finalBikePathsArray[3], weight_surface_asphalt, surface_asphalt_ratingList);
                calculateRating(finalBikePathsArray[4], weight_route_bicycle, route_bicycle_ratingList);
                calculateRating(finalBikePathsArray[5], weight_bicycle_designated, bicycle_designated_ratingList);
                calculateRating(finalBikePathsArray[6], weight_surface_concrete, surface_concrete_ratingList);
                calculateRating(finalBikePathsArray[7], weight_surface_sett, surface_sett_ratingList);
                calculateRating(TrafficLightIntersectionList, weight_traffic_lights, traffic_lights_ratingList);
                calculateRating(RoutesDistancesList, weight_Distance, Distance_ratingList);

                for (let i = 0; i < Distance_ratingList.length; i++) {
                    let numerator = [
                        Elevation_Loss_ratingList[i],
                        highway_cycleway_ratingList[i],
                        bicycle_yes_ratingList[i],
                        surface_paved_ratingList[i],
                        surface_asphalt_ratingList[i],
                        route_bicycle_ratingList[i],
                        bicycle_designated_ratingList[i],
                        surface_concrete_ratingList[i]
                    ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);

                    let denominator = [
                        Distance_ratingList[i],
                        Elevation_Gain_ratingList[i],
                        traffic_lights_ratingList[i],
                        surface_sett_ratingList[i]
                    ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);

                    if (denominator !== 0) {
                        finalRatingList.push(numerator / denominator);
                    } else {
                        finalRatingList.push(0); // or handle the zero denominator case as needed
                    }
                }
            } else {
                oneRoute = true;
                console.log('only one viable route found, creating Ratings is not possible');
            }

            resolve();
        } catch (error) {
            reject(error);
        }
    }).then(() => {
        const createRatingItem = (text) => {
            const ratingItem = document.createElement('li');
            ratingItem.innerText = text;
            return ratingItem;
        };

        if (oneRoute) {
            ratingsList.appendChild(createRatingItem(`ONLY ONE ROUTE, NO RATINGS CAN BE CALCULATED\n`));
        } else {
            ratingsList.appendChild(createRatingItem(`${RouteNames[index]}: \n`));

            if (finalRatingList.length > 1) {
                ratingsList.appendChild(createRatingItem(`Overall Rating: ${finalRatingList[index].toFixed(2)} \n`));
            } else {
                ratingsList.appendChild(createRatingItem(`Overall Rating: ONLY ONE ROUTE, NO RATINGS CAN BE CALCULATED\n`));
            }

            const distanceCheck = document.getElementById('DistanceCheck');
            if (RoutesDistancesList.length > 0  && distanceCheck.checked) {
                ratingsList.appendChild(createRatingItem(`Distance: ${RoutesDistancesList[index].toFixed(2)} meters, Index: ${Distance_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`Distance: NO DATA\n`));
            }

            const elevationGainCheck = document.getElementById('ElevationGainCheck');
            if (metersuplist.length > 0  && elevationGainCheck.checked) {
                ratingsList.appendChild(createRatingItem(`Elevation Gain: ${metersuplist[index].toFixed(2)} meters, Index: ${Elevation_Gain_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`Elevation Gain: NO DATA\n`));
            }

            const elevationLossCheck = document.getElementById('ElevationLossCheck');
            if (metersdownlist.length > 0  && elevationLossCheck.checked) {
                ratingsList.appendChild(createRatingItem(`Elevation Loss: ${metersdownlist[index].toFixed(2)} meters, Index: ${Elevation_Loss_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`Elevation Loss: NO DATA\n`));
            }

            const trafficLightsCheck = document.getElementById('trafficLightsCheck');
            if (TrafficLightIntersectionList.length > 0 && trafficLightsCheck.checked) {
                ratingsList.appendChild(createRatingItem(`Traffic lights: ${TrafficLightIntersectionList[index]}, Index: ${traffic_lights_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`Traffic lights: NO DATA\n`));
            }

            const highwayCyclewayCheck = document.getElementById('highway=cyclewayCheck');
            if (finalBikePathsArray[0] && finalBikePathsArray[0][index] !== undefined  && highwayCyclewayCheck.checked) {
                ratingsList.appendChild(createRatingItem(`highway=cycleway: ${finalBikePathsArray[0][index].toFixed(2)}%, Index: ${highway_cycleway_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`highway=cycleway: NO DATA\n`));
            }

            const bicycleYesCheck = document.getElementById('bicycle=yesCheck');
            if (finalBikePathsArray[1] && finalBikePathsArray[1][index] !== undefined && bicycleYesCheck.checked) {
                ratingsList.appendChild(createRatingItem(`bicycle=yes: ${finalBikePathsArray[1][index].toFixed(2)}%, Index: ${bicycle_yes_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`bicycle=yes: NO DATA\n`));
            }

            const surfacePavedCheck = document.getElementById('surface=pavedCheck');
            if (finalBikePathsArray[2] && finalBikePathsArray[2][index] !== undefined && surfacePavedCheck.checked) {
                ratingsList.appendChild(createRatingItem(`surface=paved: ${finalBikePathsArray[2][index].toFixed(2)}%, Index: ${surface_paved_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`surface=paved: NO DATA\n`));
            }

            const surfaceAsphaltCheck = document.getElementById('surface=asphaltCheck');
            if (finalBikePathsArray[3] && finalBikePathsArray[3][index] !== undefined && surfaceAsphaltCheck.checked) {
                ratingsList.appendChild(createRatingItem(`surface=asphalt: ${finalBikePathsArray[3][index].toFixed(2)}%, Index: ${surface_asphalt_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`surface=asphalt: NO DATA\n`));
            }

            const routeBicycleCheck = document.getElementById('route=bicycleCheck');
            if (finalBikePathsArray[4] && finalBikePathsArray[4][index] !== undefined && routeBicycleCheck.checked) {
                ratingsList.appendChild(createRatingItem(`route=bicycle: ${finalBikePathsArray[4][index].toFixed(2)}%, Index: ${route_bicycle_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`route=bicycle: NO DATA\n`));
            }

            const bicycleDesignatedCheck = document.getElementById('bicycle=designatedCheck');
            if (finalBikePathsArray[5] && finalBikePathsArray[5][index] !== undefined && bicycleDesignatedCheck.checked) {
                ratingsList.appendChild(createRatingItem(`bicycle=designated: ${finalBikePathsArray[5][index].toFixed(2)}%, Index: ${bicycle_designated_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`bicycle=designated: NO DATA\n`));
            }

            const surfaceConcreteCheck = document.getElementById('surface=concreteCheck');
            if (finalBikePathsArray[6] && finalBikePathsArray[6][index] !== undefined && surfaceConcreteCheck.checked) {
                ratingsList.appendChild(createRatingItem(`surface=concrete:  ${finalBikePathsArray[6][index].toFixed(2)}%, Index: ${surface_concrete_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`surface=concrete: NO DATA\n`));
            }

            const surfaceSettCheck = document.getElementById('surface=settCheck');
            if (finalBikePathsArray[7] && finalBikePathsArray[7][index] !== undefined && surfaceSettCheck.checked) {
                ratingsList.appendChild(createRatingItem(`surface=sett:  ${finalBikePathsArray[7][index].toFixed(2)}%, Index: ${surface_sett_ratingList[index].toFixed(2)}\n`));
            } else {
                ratingsList.appendChild(createRatingItem(`surface=sett: NO DATA\n`));
            }
        }
    }).catch(error => {
        console.error('Error in displayRatings:', error);
    });
}

function fetchRouteAndRender(elevationService, retryCount = 10) {
    console.log('fetchRouteAndRender')
    if (lat1 == 0 || lng1 == 0) {
        console.error('No start point selected, resetting to default');
        lat1 = chosenlat;
        lng1 = chosenlng;
    }
    if (lat2 == 0 || lng2 == 0) {
        console.error('No end point selected, resetting to default');
        lat2 = chosenlat;
        lng2 = chosenlng;
    }
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

        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found in the response');
        }

        // Clear existing polylines and ratings list
        clearAllPolylines();
        ratingsList.innerHTML = '';

        const polylines = data.routes.map((route) => route.polyline.encodedPolyline);
        const totalDistance = data.routes.reduce((sum, route) => sum + route.distanceMeters, 0);

        polylines.forEach((polyline, index) => {
            const decodedPolyline = google.maps.geometry.encoding.decodePath(polyline);
            let PolylineCoords = [];
            decodedPolyline.forEach((point, pointIndex) => {
                PolylineCoords.push([point.lat(), point.lng()]);
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

            if (document.getElementById('ElevationGainCheck').checked || document.getElementById('ElevationLossCheck').checked) {
                // Fetch elevation data for the route
                fetchElevationData(decodedPolyline, index);
            }

            checkForOSMBikepaths(PolylineCoords, index);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
        console.error('Request Data:', requestData); // Log the request data for debugging

        if (retryCount > 0) {
            console.error(`Retrying... (${retryCount + 1})`);
            setTimeout(() => fetchRouteAndRender(elevationService, retryCount - 1, routeIndex), 3000);
        } else {
            console.error('Max retries reached. Could not fetch routes.');
        }
    });
}

async function fetchElevationData(path, routeIndex) {
    console.log('fetchElevationData')
    let numbersOfSamples = Math.round(RoutesDistancesList[routeIndex] / 50);

    if (!path || path.length === 0) {
        console.error('Invalid path data');
        return;
    }

    // Prepare the path coordinates for the OpenElevation API
    const coordinates = path.map(point => `${point.lat()},${point.lng()}`).join('|');
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${coordinates}`;

    const fetchWithRetry = async (url, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                console.warn(`Retrying fetch... (${i + 1}/${retries})`);
            }
        }
    };

    try {
        const data = await fetchWithRetry(url);

        if (data.results) {
            let metersdown = 0;
            let metersup = 0;

            // Extract elevation values
            const elevations = data.results.map(result => result.elevation);

            const extractedCoordinates = []; // New array to store extracted coordinates
            data.results.forEach(result => {
                const { latitude, longitude } = result;
                extractedCoordinates.push({ lat: latitude, lng: longitude }); // Extract lat and lng
            });

            let lastElevation = elevations[0];
            for (const value of elevations) {
                if (value > lastElevation) {
                    metersup += (value - lastElevation);
                } else if (value < lastElevation) {
                    metersdown += (lastElevation - value);
                }
                lastElevation = value;
            }

            metersdownlist[routeIndex] = metersdown / 10;
            metersuplist[routeIndex] = metersup / 10;

            // Check if finalBikePathsArray is defined and call displayRatings !!!!MAYBE LET DISPLAY RATING BE CALLED WHEN ALL DATA IS FETCHEND IN RETURN PROMISE ALL!!!!!
            const checkBikePathsArray = () => {         
                if (finalBikePathsArray.every(arr => arr && arr.length > 0 || finalBikePathsArray.indexOf(arr) === 4)) {
                    displayRatings(RoutesDistancesList[routeIndex], metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, routeIndex);
                } else {
                    setTimeout(checkBikePathsArray, 1000);
                }
            };

            // Start the initial check
            checkBikePathsArray();
        } else {
            console.error('No elevation results found');
        }
    } catch (error) {
        console.error('Error fetching elevation data:', error);
    }
}

function clearAllPolylines() {
    console.log('clearAllPolylines')
    polylinesArray.forEach((polyline) => {
        polyline.setMap(null);
    });
    polylinesArray = [];
}

const width_of_map_container = document.querySelector('#map_container').offsetWidth;
searchBar.style.width = `${width_of_map_container}px`;

function run(){
window.initMap = initMap;
}

setTimeout(run, 1000)


//key page: AIzaSyAG8M_Uhho1glaT4N1MRY3ZsaNkywROGTk
