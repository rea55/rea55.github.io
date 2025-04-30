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
 

 
let best_route = 0;
 

 
let weight_Distance = (parseFloat(document.getElementById('Distance').value));
 
let weight_Elevation_Gain = parseFloat(document.getElementById('ElevationGain').value);
 
let weight_Elevation_Loss = parseFloat(document.getElementById('ElevationGain').value);
 
let weight_highway_cycleway = parseFloat(document.getElementById('highway=cycleway').value);
 
let weight_bicycle_yes = parseFloat(document.getElementById('highway=cycleway').value);
 
let weight_surface_paved = parseFloat(document.getElementById('surface=paved').value);
 
let weight_surface_asphalt = parseFloat(document.getElementById('surface=paved').value);
 
let weight_route_bicycle = parseFloat(document.getElementById('highway=cycleway').value);
 
let weight_bicycle_designated = parseFloat(document.getElementById('highway=cycleway').value);
 
let weight_surface_concrete = parseFloat(document.getElementById('surface=paved').value);
 
let weight_surface_sett = parseFloat(document.getElementById('surface=paved').value);
 
let weight_traffic_lights = parseFloat(document.getElementById('trafficLights').value);
 
const throbber = document.getElementById('throbber');
 

 
var numberOfRoutes = 0;
 

 
let finalBikePathsArray = [[], [], [], [], [], [], [], [], [69, 69, 69]];
 

 
let TrafficLightIntersectionList = [] //A list of the number of traffic lights that intersect with the route
 

 
const ratingsList = document.getElementById('Ratings_List'); //The list of all the ratings of the routes
 

 
let percentageIntersectingAreaList = [] //A list of the percentage of the route that intersects with bike paths
 

 
var coordinates = []            
 

 
let RoutesDistancesList = [];   //A list the distance for each route
 

 
let polylinesArray = []; // Array to store polylines
 

 
let routeColors = ['#FF0000', '#000000', '#0000FF']; // Red, Black, Blue
 

 
let RouteNames = ['rot', 'schwarz', 'blau']; //A list of the names of all the routes which will be displayed in the "Ratings" part of the HTML
 

 
const apiKey = 'AIzaSyAG8M_Uhho1glaT4N1MRY3ZsaNkywROGTk';   //my google maps API key
 

 
const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';    //The link that is used to make a request to google maps to compute the routes
 

 
let BikePathsFound = false
 

 
var oneRoute = true;
 

 
let metersuplist = [];
 
let metersdownlist = [];
 

 
let export_url = [];
 

 
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
 

 
var BikepathsRatingsList = [];
 
var SurfaceRatingsList = [];
 
var ElevationRatingsList = [];
 

 

 
function ResetVars() {
 
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
 
    BikepathsRatingsList = [];
 
    SurfaceRatingsList = [];
 
    export_url = [];
 
}
 

 
function addMarker(name, lat, lng, Label) {
 
    const pos = { lat: lat, lng: lng };
 
    const marker = new google.maps.Marker({
 
        position: pos,
 
        map: map,
 
        title: name,
 
        label: Label,
 
    });
 
    markers[name] = marker;
 

 
    // Create a LatLngBounds object
 
    const bounds = new google.maps.LatLngBounds();
 

 
    // Extend the bounds to include each marker's position
 
    for (const key in markers) {
 
        if (markers.hasOwnProperty(key)) {
 
            bounds.extend(markers[key].getPosition());
 
        }
 
    }
 

 
    // Adjust the map to fit the bounds
 
    map.fitBounds(bounds);
 
}
 

 
function delMarker(name) {                          //deletes a marker by it name in the "markers" list.
 
    if (markers[name]) {
 
        markers[name].setMap(null);
 
        delete markers[name];
 
    } else {
 
        console.error("Tried to delete a marker; marker not found");
 
    }
 
}
 

 
function transposeLists(listspos, listsneg, resultinglist) {
 
    let noneg = false;
 
    let transposedpos = listspos[0].map((_, colIndex) => listspos.map(row => row[colIndex]));
 
    if (listsneg.length == []) {
 
        noneg = true
 
    }
 
    else {
 
        let transposedneg = listsneg[0].map((_, colIndex) => listsneg.map(row => row[colIndex]));
 
    }
 
    for (let i = 0; i < transposedpos.length; i++) {
 
        let numerator = transposedpos[i].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
        if (noneg) {
 
            denominator = 1;
 
        } else{
 
            let denominator = transposedneg[i].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 
        }
 
        resultinglist.push(numerator / denominator);
 
    }
 
}
 

 
function intersectTrafficLights(segments, bufferedTrafficLights) {
 
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
 
    const percentageIntersectingArea = ((totalIntersectionArea / bufferedSegmentArea) * 100);
 
    percentageIntersectingAreaList.push(percentageIntersectingArea);
 
    if (percentageIntersectingAreaList.length == polylinesArray.length) {
 
        if (type == 'highway=cycleway' && document.getElementById('highway=cyclewayCheck').checked) {
 
            finalBikePathsArray[0] = percentageIntersectingAreaList;
 
        } else if (type == 'bicycle=yes' && document.getElementById('bicycle=yesCheck').checked) {
 
            finalBikePathsArray[1] = percentageIntersectingAreaList;
 
        } else if (type == 'surface=paved' && document.getElementById('surface=pavedCheck').checked) {
 
            finalBikePathsArray[2] = percentageIntersectingAreaList;
 
        } else if (type == 'surface=asphalt' && document.getElementById('surface=asphaltCheck').checked) {
 
            finalBikePathsArray[3] = percentageIntersectingAreaList;
 
        } else if (type == 'route=bicycle' && document.getElementById('route=bicycleCheck').checked) {
 
            finalBikePathsArray[4] = percentageIntersectingAreaList;
 
        } else if (type == 'bicycle=designated' && document.getElementById('bicycle=designatedCheck').checked) {
 
            finalBikePathsArray[5] = percentageIntersectingAreaList;
 
        } else if (type == 'surface=concrete' && document.getElementById('surface=concreteCheck').checked) {
 
            finalBikePathsArray[6] = percentageIntersectingAreaList;
 
        } else if (type == 'surface=sett' && document.getElementById('surface=settCheck').checked) {
 
            finalBikePathsArray[7] = percentageIntersectingAreaList;
 
        }
 

 
        percentageIntersectingAreaList = [];
 

 
    } else {
 
        //console.error('Error: percentageIntersectingAreaList is not the same length as polylinesArray, type:', type);
 
        checkSegmentOnBikePath(segment, bikePaths, type);
 
    }
 
    return finalBikePathsArray;
 
}
 

 
function toggleMenu() {
 
    const menuContent = document.getElementById('menu-content');
 
    if (menuContent.style.display === 'block') {
 
        menuContent.style.display = 'none';
 
    } else {
 
        menuContent.style.display = 'block';
 
    }
 
}
 

 
function SubmitButton() {
 
    const submitButton = document.getElementById('SubmitButton');
 
    if (submitButton) {
 
        submitButton.style.display = 'none';
 
    }
 
    if (throbber_container) {
 
        throbber_container.style.display = 'flex';
 
        results_container.style.display = 'none';
 
    }
 
    fetchRouteAndRender();
 
}
 

 
function initMap() {
 
    var directionsService = new google.maps.DirectionsService();
 
    var directionsRenderer = new google.maps.DirectionsRenderer();
 

 
    const center = { lat: latcenter, lng: lngcenter };
 
    map = new google.maps.Map(document.getElementById('map'), {
 
        center: center,
 
        zoom: 16,
 
        mapTypeControl: false,
 
        streetViewControl: false,
 
        fullscreenControl: false,
 
        zoomControlOptions: {
 
            position: google.maps.ControlPosition.RIGHT_BOTTOM
 
        }
 
    });
 

 
    directionsRenderer.setMap(map);
 

 
    const bikeLayer = new google.maps.BicyclingLayer();
 
    bikeLayer.setMap(map);
 

 
    addMarker('Startpoint', lat1, lng1, 'A');
 
    addMarker('Endpoint', lat2, lng2, 'B');
 

 

 
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
 

 
    // Add the hamburger menu to the map controls
 
    const hamburgerMenu = document.getElementById('hamburger-menu');
 
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(hamburgerMenu);
 

 
    // Add the new buttons to the map controls
 
    const chooseAButton = document.getElementById('chooseAButton');
 
    const chooseBButton = document.getElementById('chooseBButton');
 
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(chooseAButton);
 
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(chooseBButton);
 

 
    const HowToUseBTN = document.getElementById('HowToUseBTN');
 
    const AboutMeBTN = document.getElementById('AboutMeBTN');
 
    const ContactBTN = document.getElementById('ContactBTN');
 
    HowToUseBTN.addEventListener('click', () => scrolltoitem('HowToUse'));
 
    AboutMeBTN.addEventListener('click', () => scrolltoitem('AboutMe'));
 
    ContactBTN.addEventListener('click', () => scrolltoitem('Contact'));
 
    ScrollUpBTN.addEventListener('click', () => scrolltotop());
 

 

 
    const container = document.getElementById('container');
 
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(container);
 

 
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
 

 
function ChooseAAsButton() {
 
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
 
    if (throbber_container.style.display = 'block'|| results_container.style.display == 'block') {
 
        throbber_container.style.display = 'none';
 
        results_container.style.display = 'none';
 
        document.querySelector('.Submit_Button').style.display = 'block';
 
    }
 

 
}
 

 

 
function ChooseBAsButton() {
 
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
 

 
    var ratingPreWeight = 0;
 
    var ratingPostWeight = 0;
 
    const min = Math.min(...Valuelist);
 
    const max = Math.max(...Valuelist);
 
    for (let i = 0; i < Valuelist.length; i++) {
 
        ratingPreWeight = ((Valuelist[i] - min) / (max - min));  //If max == min then max-min = 0, => ratingPreWeight = NaN. this error is resolved further down by setting the value to 0
 
        ratingPostWeight = ratingPreWeight * weight;
 
        if (max == min) {           
 
            ratingPostWeight = 0;
 
        }
 
        ratinglist.push(ratingPostWeight);
 
    }
 
    while (ratinglist.length > RoutesDistancesList.length) {
 
        ratinglist.shift();
 
    }
 

 
    return ratingPostWeight;
 

 
}
 

 

 
function updateWeights(name, value) {
 
    switch(name) {
 
        case 'Distance':
 
            weight_Distance = parseFloat(value);
 
            calculateRating(RoutesDistancesList, parseFloat(value), Distance_ratingList);
 
            for (let i = 0; i < RoutesDistancesList.length; i++) {
 
                appendRatingItem(ratingsList, RoutesDistancesList.length > 0, RoutesDistancesList, i, 'Distance', Distance_ratingList);
 
            }
 
            break;
 
        case 'ElevationGain':
 
        weight_Elevation_Gain = parseFloat(value);
 
            calculateRating(metersuplist, parseFloat(value), Elevation_Gain_ratingList);
 
            for (let i = 0; i < metersuplist.length; i++) {
 
                appendRatingItem(ratingsList, metersuplist.length > 0, metersuplist, i, 'Elevation Gain', Elevation_Gain_ratingList);
 
            }
 

 
            weight_Elevation_Loss = parseFloat(value);
 
            calculateRating(metersdownlist, parseFloat(value), Elevation_Loss_ratingList);
 
            for (let i = 0; i < metersdownlist.length; i++) {
 
                appendRatingItem(ratingsList, metersdownlist.length > 0, metersdownlist, i, 'Elevation Loss', Elevation_Loss_ratingList);
 
            }
 

 
            break;
 

 
        case 'highway=cycleway':
 
            weight_highway_cycleway = parseFloat(value);
 
            calculateRating(finalBikePathsArray[0], parseFloat(value), highway_cycleway_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[0].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[0] && finalBikePathsArray[0][i] !== undefined, finalBikePathsArray[0], i, 'highway=cycleway', highway_cycleway_ratingList);
 
            }
 

 
            weight_bicycle_yes = parseFloat(value);
 
            calculateRating(finalBikePathsArray[1], parseFloat(value), bicycle_yes_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[1].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[1] && finalBikePathsArray[1][i] !== undefined, finalBikePathsArray[1], i, 'bicycle=yes', bicycle_yes_ratingList);
 
            }
 

 
            weight_route_bicycle = parseFloat(value);
 
            calculateRating(finalBikePathsArray[4], parseFloat(value), route_bicycle_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[4].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[4] && finalBikePathsArray[4][i] !== undefined, finalBikePathsArray[4], i, 'route=bicycle', route_bicycle_ratingList);
 
            }
 

 
            weight_bicycle_designated = parseFloat(value);
 
            calculateRating(finalBikePathsArray[5], parseFloat(value), bicycle_designated_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[5].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[5] && finalBikePathsArray[5][i] !== undefined, finalBikePathsArray[5], i, 'bicycle=designated', bicycle_designated_ratingList);
 
            }
 

 
            break;
 

 
        case 'surface=paved':
 
            weight_surface_paved = parseFloat(value);
 
            calculateRating(finalBikePathsArray[2], parseFloat(value), surface_paved_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[2].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[2] && finalBikePathsArray[2][i] !== undefined, finalBikePathsArray[2], i, 'surface=paved', surface_paved_ratingList);
 
            }
 

 
            weight_surface_asphalt = parseFloat(value);
 
            calculateRating(finalBikePathsArray[3], parseFloat(value), surface_asphalt_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[3].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[3] && finalBikePathsArray[3][i] !== undefined, finalBikePathsArray[3], i, 'surface=asphalt', surface_asphalt_ratingList);
 
            }
 

 
            weight_surface_concrete = parseFloat(value);
 
            calculateRating(finalBikePathsArray[6], parseFloat(value), surface_concrete_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[6].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[6] && finalBikePathsArray[6][i] !== undefined, finalBikePathsArray[6], i, 'surface=concrete', surface_concrete_ratingList);
 
            }
 

 
            weight_surface_sett = parseFloat(value);
 
            calculateRating(finalBikePathsArray[7], parseFloat(value), surface_sett_ratingList);
 
            for (let i = 0; i < finalBikePathsArray[7].length; i++) {
 
                appendRatingItem(ratingsList, finalBikePathsArray[7] && finalBikePathsArray[7][i] !== undefined, finalBikePathsArray[7], i, 'surface=sett', surface_sett_ratingList);
 
            }
 

 
            break;
 

 
        case 'trafficLights':
 
            weight_traffic_lights = parseFloat(value);
 
            calculateRating(TrafficLightIntersectionList, parseFloat(value), traffic_lights_ratingList);
 
            for (let i = 0; i < TrafficLightIntersectionList.length; i++) {
 
                appendRatingItem(ratingsList, TrafficLightIntersectionList.length > 0, TrafficLightIntersectionList, i, 'Traffic lights', traffic_lights_ratingList);
 
            }
 
            break;
 
        default:
 
            console.error('Invalid input:', name, value);
 
    }
 
}
 

 

 

 

 

 

 
async function getBikePaths(bbox, type) {
 
    const maxRetries = 3;
 
    let attempts = 0;
 

 
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
 
    while (attempts < maxRetries) {
 
        try {
 
            const response = await axios.get(url);
 
            return response.data;
 
        } catch (error) {
 
            console.error("Error fetching bike paths: ", error);
 
            attempts++;
 
        }
 
    }
 
}
 

 

 
async function findAndCheckBikePaths(type, bbox, segments) {
 
    let transtype = type
 
    if (type == "ElevationLoss"){
 
        transtype = "ElevationGain"
 
    }
 
    else if (type == "bicycle=yes"|| type == "route=bicycle"|| type == "bicycle=designated"){
 
        transtype = "highway=cycleway"
 
    }
 
    else if(type == "surface=asphalt"|| type=="surface=concrete"||type =="surface=sett"){
 
        transtype = "surface=paved"
 
    }
 

 

 

 
    if (document.getElementById(transtype + 'Check').checked == false) {
 
        return; // Return if the checkbox is not checked
 
    } else {
 
        const data = await getBikePaths(bbox, type);
 
        if (data.elements.length == 0) {
 
            BikePathsFound = false;
 
            if (type == 'highway=cycleway') {
 
                finalBikePathsArray[0].push(0);
 
            } else if (type == 'bicycle=yes') {
 
                finalBikePathsArray[1].push(0);
 
            } else if (type == 'surface=paved') {
 
                finalBikePathsArray[2].push(0);
 
            } else if (type == 'surface=asphalt') {
 
                finalBikePathsArray[3].push(0);
 
            } else if (type == 'route=bicycle') {
 
                finalBikePathsArray[4].push(0);
 
            } else if (type == 'bicycle=designated') {
 
                finalBikePathsArray[5].push(0);
 
            } else if (type == 'surface=concrete') {
 
                finalBikePathsArray[6].push(0);
 
            } else if (type == 'surface=sett') {
 
                finalBikePathsArray[7].push(0);
 
            }
 
        } else {
 
            BikePathsFound = true;
 
            await checkSegmentOnBikePath(segments, data.elements, type);
 
        }
 
    }
 
}
 

 
async function getTrafficLights(bbox, segments) {
 
    if (document.getElementById('trafficLightsCheck').checked == false) {
 
        return;
 
    } else {
 
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
 
}
 

 
async function checkForOSMBikepaths(PolylineCoords, routeIndex, numberOfRoutes) {
 
    let bbox_bottom_left = [200, 200];
 
    let bbox_top_right = [-200, -200];
 
    const segments = [];
 

 
    for (let i = 0; i < PolylineCoords.length - 1; i++) {
 
        const start = PolylineCoords[i];
 
        const end = PolylineCoords[i + 1];
 
        segments.push([start, end]);
 

 
        if (PolylineCoords[i][0] < bbox_bottom_left[0]) {
 
            bbox_bottom_left[0] = PolylineCoords[i][0];
 
        }
 
        if (PolylineCoords[i][1] < bbox_bottom_left[1]) {
 
            bbox_bottom_left[1] = PolylineCoords[i][1];
 
        }
 
        if (PolylineCoords[i][0] > bbox_top_right[0]) {
 
            bbox_top_right[0] = PolylineCoords[i][0];
 
        }
 
        if (PolylineCoords[i][1] > bbox_top_right[1]) {
 
            bbox_top_right[1] = PolylineCoords[i][1];
 
        }
 
    }
 

 
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
 
        displayRatings(RoutesDistancesList[routeIndex], metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, routeIndex, numberOfRoutes);
 
    });
 
}
 

 
function NewRoute() {
 
    ResetVars();
 
    clearAllPolylines();
 
    document.getElementById('SubmitButton').style.display = 'block';
 
    document.getElementById('finalResultsContainer').style.display = 'none';  
 
    document.getElementById('Export_Button').style.display = 'none';
 
    document.getElementById('NewRoute_Button').style.display = 'none';
 

 
}
 

 
function Export_To_GMaps(routeIndex = best_route){
 
    console.log(RouteNames.indexOf(routeIndex)+1)
 

    window.open(export_url[RouteNames.indexOf(routeIndex)+1]);
 

    if (best_route == "rot"){
 

        window.open(export_url[0]);
 

    }
 

    else if (best_route == "schwarz"){
 

        window.open(export_url[1]);
 

    }
 

    else if (best_route == "blau"){
 

        window.open(export_url[2]);
 

    }
 


 
}
 

 
async function fetchRouteAndRender(retryCount = 10) {
 
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
 
        travelMode: 'BICYCLE',
 
        computeAlternativeRoutes: true,
 
        languageCode: 'en-US',
 
        units: 'METRIC',
 
    };
 

 
    try {
 
        const response = await fetch(url, {
 
            method: 'POST',
 
            headers: {
 
                'Content-Type': 'application/json',
 
                'X-Goog-Api-Key': apiKey,
 
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps',
 
            },
 
            body: JSON.stringify(requestData),
 
        });
 

 
        const data = await response.json();
 

 
        if (!data.routes || data.routes.length === 0) {
 
            throw new Error('No routes found in the response');
 
        }
 

 
        numberOfRoutes = data.routes.length;
 
        clearAllPolylines();
 
        ratingsList.innerHTML = '';
 

 
        const polylines = data.routes.map((route) => route.polyline.encodedPolyline);
 

 
        for (const [index, polyline] of polylines.entries()) {
 
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
 
                strokeColor: routeColors[index % routeColors.length],
 
                strokeOpacity: 1.0,
 
                strokeWeight: 2,
 
            });
 

 
            routePolyline.setMap(map);
 
            polylinesArray.push(routePolyline);
 
            export_url.push(`https://www.google.com/maps/dir/?api=1&travelmode=bicycling&origin=${lat1},${lng1}&destination=${lat2},${lng2}&waypoints=${PolylineCoords.map(coord => coord.join(',')).join('|')}`)
 
            console.log(export_url)
 

 
            if (document.getElementById('ElevationGainCheck').checked || document.getElementById('ElevationLossCheck').checked) {
 
                await fetchElevationData(decodedPolyline, index);
 
            }
 

 
            await checkForOSMBikepaths(PolylineCoords, index, numberOfRoutes);
 
        }
 
    } catch (error) {
 
        console.error('Error:', error);
 
        console.error('Request Data:', requestData);
 

 
        if (retryCount > 0) {
 
            console.error(`Retrying... (${retryCount + 1})`);
 
            setTimeout(() => fetchRouteAndRender(retryCount - 1), 3000);
 
        } else {
 
            console.error('Max retries reached. Could not fetch routes.');
 
        }
 
    }
 
}
 

 
function checkTrafficLights(trafficLights, segments) {
 
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
 

 
function createRatingItem(id, text) {
 
    const ratingItem = document.createElement('li');
 
    ratingItem.id = id;
 
    ratingItem.innerText = text;
 
    return ratingItem;
 
}
 

 
function appendRatingItem(ratingsList, condition, value, index, label, ratingList, type = "percentage") {
 
    const id = `${label}-${index}`;
 
    if (condition) {
 
        const text = type === "percentage" 
 
            ? `${label}: ${value[index].toFixed(2)}%, Index: ${ratingList[index].toFixed(2)}\n`
 
            : type === "meters"
 
                ? `${label}: ${value[index].toFixed(2)}m, Index: ${ratingList[index].toFixed(2)}\n`
 
                : `${label}: ${value[index].toFixed(2)}, Index: ${ratingList[index].toFixed(2)}\n`;
 

 
        const existingItem = document.getElementById(id);
 
        if (existingItem) {
 
            existingItem.innerText = text;
 
        } else {
 
            ratingsList.appendChild(createRatingItem(id, text));
 
        }
 
    } else {
 
        const existingItem = document.getElementById(id);
 
        if (existingItem) {
 
            existingItem.innerText = `${label}: NO DATA\n`;
 
        } else {
 
            ratingsList.appendChild(createRatingItem(id, `${label}: NO DATA\n`));
 
        }
 
    }
 
}
 

 
function displayRatings(routeDistance, metersuplist, metersdownlist, finalBikePathsArray, TrafficLightIntersectionList, index, numberOfRoutes) {
 
    if (index == 0) { 
 
        ratingsList.innerHTML = '';
 
    }
 

 
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
 

 
            if (polylinesArray.length > 1) {
 
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
 

 
            } else {
 
                oneRoute = true;
 
            }
 

 
            resolve();
 
        } catch (error) {
 
            reject(error);
 
        }
 
    }).then(() => {
 
        BikepathsRatingsList = [];
 

 
        for (let i = 0; i < Distance_ratingList.length; i++) {
 
            let numerator = [
 
                highway_cycleway_ratingList[i],
 
                bicycle_yes_ratingList[i],
 
                route_bicycle_ratingList[i],
 
                bicycle_designated_ratingList[i],
 
            ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
            let denominator = 1
 

 
            if (denominator !== 0) {
 
                BikepathsRatingsList.push(numerator / denominator);
 
            } else {
 
                BikepathsRatingsList.push(0); // or handle the zero denominator case as needed
 
            }
 
        }
 

 
        SurfaceRatingsList = [];
 
        for (let i = 0; i < Distance_ratingList.length; i++) {
 
            let numerator = [
 
                surface_paved_ratingList[i],
 
                surface_asphalt_ratingList[i],
 
                surface_concrete_ratingList[i]
 
            ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
            let denominator = [
 
                surface_sett_ratingList[i]
 
            ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
            if (denominator !== 0) {
 
                SurfaceRatingsList.push(numerator / denominator);
 
            } else {
 
                SurfaceRatingsList.push(0); // or handle the zero denominator case as needed
 
            }
 
        }
 

 
        ElevationRatingsList = [];
 
        for (let i = 0; i < Distance_ratingList.length; i++) {
 

 
            let numerator = [
 
                Elevation_Loss_ratingList[i],
 
            ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
            let denominator = [
 
                Elevation_Gain_ratingList[i],
 
            ].filter(value => !isNaN(value)).reduce((a, b) => a + b, 0);
 

 
            if (denominator !== 0) {
 
                ElevationRatingsList.push(numerator / denominator);
 
            } else {
 
                ElevationRatingsList.push(0); // or handle the zero denominator case as needed
 
            }
 
        }
 

 
        finalRatingList = [];
 
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
 
        if (oneRoute) {
 
            ratingsList.appendChild(createRatingItem('only-one-route', `ONLY ONE ROUTE, NO RATINGS CAN BE CALCULATED\n`));
 
        } else {
 
            ratingsList.appendChild(createRatingItem(`route-name-${index}`, `${RouteNames[index]}: \n`));
 

 
            if (finalRatingList.length > 1) {
 
                ratingsList.appendChild(createRatingItem(`overall-rating-${index}`, `Overall Rating: ${finalRatingList[index].toFixed(2)} \n`));
 
            } else {
 
                ratingsList.appendChild(createRatingItem('only-one-route-overall', `Overall Rating: ONLY ONE ROUTE, NO RATINGS CAN BE CALCULATED\n`));
 
            }
 

 
            const distanceCheck = document.getElementById('DistanceCheck');
 
            appendRatingItem(ratingsList, RoutesDistancesList.length > 0 && distanceCheck.checked, RoutesDistancesList, index, 'Distance', Distance_ratingList, 'meters');
 

 
            const elevationGainCheck = document.getElementById('ElevationGainCheck');
 
            appendRatingItem(ratingsList, metersuplist.length > 0 && elevationGainCheck.checked, metersuplist, index, 'Elevation Gain', Elevation_Gain_ratingList, 'meters');
 

 
            const elevationLossCheck = document.getElementById('ElevationLossCheck');
 
            appendRatingItem(ratingsList, metersdownlist.length > 0 && elevationLossCheck.checked, metersdownlist, index, 'Elevation Loss', Elevation_Loss_ratingList, 'meters');
 

 
            const trafficLightsCheck = document.getElementById('trafficLightsCheck');
 
            appendRatingItem(ratingsList, TrafficLightIntersectionList.length > 0 && trafficLightsCheck.checked, TrafficLightIntersectionList, index, 'Traffic lights', traffic_lights_ratingList, false);
 

 
            const highwayCyclewayCheck = document.getElementById('highway=cyclewayCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[0] && finalBikePathsArray[0][index] !== undefined && highwayCyclewayCheck.checked, finalBikePathsArray[0], index, 'highway=cycleway', highway_cycleway_ratingList);
 

 
            const bicycleYesCheck = document.getElementById('bicycle=yesCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[1] && finalBikePathsArray[1][index] !== undefined && bicycleYesCheck.checked, finalBikePathsArray[1], index, 'bicycle=yes', bicycle_yes_ratingList);
 

 
            const surfacePavedCheck = document.getElementById('surface=pavedCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[2] && finalBikePathsArray[2][index] !== undefined && surfacePavedCheck.checked, finalBikePathsArray[2], index, 'surface=paved', surface_paved_ratingList);
 

 
            const surfaceAsphaltCheck = document.getElementById('surface=asphaltCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[3] && finalBikePathsArray[3][index] !== undefined && surfaceAsphaltCheck.checked, finalBikePathsArray[3], index, 'surface=asphalt', surface_asphalt_ratingList);
 

 
            const routeBicycleCheck = document.getElementById('route=bicycleCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[4] && finalBikePathsArray[4][index] !== undefined && routeBicycleCheck.checked, finalBikePathsArray[4], index, 'route=bicycle', route_bicycle_ratingList);
 

 
            const bicycleDesignatedCheck = document.getElementById('bicycle=designatedCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[5] && finalBikePathsArray[5][index] !== undefined && bicycleDesignatedCheck.checked, finalBikePathsArray[5], index, 'bicycle=designated', bicycle_designated_ratingList);
 

 
            const surfaceConcreteCheck = document.getElementById('surface=concreteCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[6] && finalBikePathsArray[6][index] !== undefined && surfaceConcreteCheck.checked, finalBikePathsArray[6], index, 'surface=concrete', surface_concrete_ratingList);
 

 
            const surfaceSettCheck = document.getElementById('surface=settCheck');
 
            appendRatingItem(ratingsList, finalBikePathsArray[7] && finalBikePathsArray[7][index] !== undefined && surfaceSettCheck.checked, finalBikePathsArray[7], index, 'surface=sett', surface_sett_ratingList);
 
        }
 

 
        if (index==numberOfRoutes - 1) {
 
            if (throbber_container.style.display = 'block'){
 
                best_route=RouteNames[finalRatingList.indexOf(Math.max(...finalRatingList))]
 
                throbber_container.style.display = 'none';
 
                results_container.style.display = 'block';
 
                document.getElementById('finalResultsContainer').style.display = 'block';
 
                document.getElementById('Export_Button').style.display = 'inline-block';
 
                document.getElementById('NewRoute_Button').style.display = 'inline-block';
 
                if (numberOfRoutes == 1) {
 
                    best_route = RouteNames[0]
 
                }
 
                document.getElementById('finalResultsContainer').innerText = `Basierend auf deinen Parametern wird die ${best_route}e Route empfohlen.`;
 
            }
 
        }
 

 
        /*if (index === numberOfRoutes - 1) {
 
            if (throbber_container.style.display = 'block'){
 
                throbber_container.style.display = 'none';
 
                results_container.style.display = 'block';
 
                console.log('finalRatingList:', finalRatingList);
 
                if (numberOfRoutes == 1){
 
                    document.getElementById('result_1').style.display = 'block';
 
                    document.getElementById('result_2').style.display = 'none';
 
                    document.getElementById('result_3').style.display = 'none';
 

 
                    document.getElementById('result_1').innerText = 'Only one viable route found';
 
                }
 
                else if (numberOfRoutes == 2){
 
                    document.getElementById('result_1').style.display = 'block';
 
                    document.getElementById('result_2').style.display = 'block';
 
                    document.getElementById('result_3').style.display = 'none';
 

 
                    document.getElementById('result_1').innerText = RouteNames[0] + ' - Rating: ' + finalRatingList[0].toFixed(2);
 
                    document.getElementById('result_2').innerText = RouteNames[1] + ' - Rating: ' + finalRatingList[1].toFixed(2);
 
                }
 
                else if (numberOfRoutes ==3){
 
                    document.getElementById('result_1').style.display = 'block';
 
                    document.getElementById('result_2').style.display = 'block';
 
                    document.getElementById('result_3').style.display = 'block';
 
          
 
                    document.getElementById('result_1').innerText = RouteNames[0] + ' - Rating: ' + finalRatingList[0].toFixed(2);
 
                    document.getElementById('result_2').innerText = RouteNames[1] + ' - Rating: ' + finalRatingList[1].toFixed(2);
 
                    document.getElementById('result_3').innerText = RouteNames[2] + ' - Rating: ' + finalRatingList[2].toFixed(2);
 
                }
 
                else{
 
                    console.log('???')
 
                }
 
            }
 
        }
 
*/
 
    }).catch(error => {
 
        console.error('Error in displayRatings:', error);
 
    });
 
}
 

 
async function fetchElevationData(path, routeIndex) {
 
    var elevationService = new google.maps.ElevationService();
 
    let numbersOfSamples = Math.round(RoutesDistancesList[routeIndex] / 50);
 

 
    if (!path || path.length === 0) {
 
        console.error('Invalid path data');
 
        return;
 
    }
 

 
    // Prepare the path coordinates for the OpenElevation API
 
    const coordinates = path.map(point => `${point.lat()},${point.lng()}`).join('|');
 
    const openElevationUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${coordinates}`;
 
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${coordinates}&key=${apiKey}`;
 
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
 

 
    const pathRequest ={
 
        path:path, 
 
        samples: numbersOfSamples,
 
    };
 

 
    elevationService.getElevationAlongPath(pathRequest, (results, status) => {
 
        if (status === 'OK') {
 
            if (results) {
 
                metersdown = 0
 
                metersup = 0
 

 

 
                // Extract elevation values
 
                const elevations = results.map(result => result.elevation);
 
                results.forEach(result => {
 
                    const location = result.location;
 
                  });
 
                lastElevation = elevations[0]
 
                for(const value of elevations) {
 
                    if (value > (lastElevation)){
 
                        metersup = metersup + (value - lastElevation) 
 
                    }
 
                    else if (value < (lastElevation)){
 
                        metersdown = metersdown + (lastElevation - value) 
 
                    }
 
                }
 
                metersdownlist.push(metersdown)
 
                metersuplist.push(metersup)
 
                if (metersuplist.length === polylinesArray.length) {
 
                    minElevation = Math.min(...metersuplist)
 
                    maxElevation = Math.max(...metersuplist)
 
                    ElevationRatings = []
 
                    for (let i of metersuplist) {
 
                        ElevationRatings.push((i-minElevation)/(maxElevation-minElevation)); 
 
                    }
 
                }
 
            } else {
 
                console.error('No elevation results found');
 
            }
 
        } else {
 
            console.error('Elevation service failed due to:', status);
 
        }
 

 
    });
 
}
 

 
function clearAllPolylines() {
 
    polylinesArray.forEach((polyline) => {
 
        polyline.setMap(null);
 
    });
 
    polylinesArray = [];
 
}
 

 
const width_of_map_container = document.querySelector('#map_container').offsetWidth;
 
searchBar.style.width = `${width_of_map_container}px`;
 

 

 

 

 
//key page: AIzaSyAG8M_Uhho1glaT4N1MRY3ZsaNkywROGTk
 
// MAYBE CHANGE INTERSECTION FUNCTIONS SO THAT IT CHECKS IF SAMPLES ARE IN POLYGON. TURF.JS HAS FOLLOWING FUNCTION: BOOLEANPOINTINPOLYGON. THIS COULD INPROVE ACCURACY, ELIMINATE OVER 100% INTERSECTING AND COULD EVEN IMPROVE RUNTIME DUE TUE LACK OF BUFFERING OF THE ROUTE
