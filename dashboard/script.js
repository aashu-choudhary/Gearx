/* =========================================================
   KAVACH SMART HELMET DASHBOARD
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let helmetIP = "";

let connected = false;

let dataTimer = null;

let locationWatchId = null;

let map = null;

let userMarker = null;

let currentPosition = null;

let accidentActive = false;

let countdownTimer = null;

let countdownValue = 10;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const helmetIPInput =
    document.getElementById("helmetIP");

const connectBtn =
    document.getElementById("connectBtn");

const locationBtn =
    document.getElementById("locationBtn");


/* =========================================================
   STATUS ELEMENTS
========================================================= */

const helmetStatus =
    document.getElementById("helmetStatus");

const helmetStatusDot =
    document.getElementById("helmetStatusDot");

const helmetCardStatus =
    document.getElementById("helmetCardStatus");

const helmetCardDot =
    document.getElementById("helmetCardDot");

const sidebarStatus =
    document.getElementById("sidebarStatus");

const sidebarStatusDot =
    document.getElementById("sidebarStatusDot");

const lastUpdate =
    document.getElementById("lastUpdate");


/* =========================================================
   SENSOR ELEMENTS
========================================================= */

const mpuStatus =
    document.getElementById("mpuStatus");

const mpuDot =
    document.getElementById("mpuDot");

const wifiStatus =
    document.getElementById("wifiStatus");

const wifiDot =
    document.getElementById("wifiDot");

const loraStatus =
    document.getElementById("loraStatus");

const loraDot =
    document.getElementById("loraDot");


const gForce =
    document.getElementById("gForce");

const accX =
    document.getElementById("accX");

const accY =
    document.getElementById("accY");

const accZ =
    document.getElementById("accZ");


const gyroX =
    document.getElementById("gyroX");

const gyroY =
    document.getElementById("gyroY");

const gyroZ =
    document.getElementById("gyroZ");


const gyroMagnitude =
    document.getElementById("gyroMagnitude");


/* =========================================================
   GPS ELEMENTS
========================================================= */

const latitude =
    document.getElementById("latitude");

const longitude =
    document.getElementById("longitude");

const gpsAccuracy =
    document.getElementById("gpsAccuracy");

const gpsSpeed =
    document.getElementById("gpsSpeed");

const gpsHeading =
    document.getElementById("gpsHeading");

const gpsDot =
    document.getElementById("gpsDot");

const gpsText =
    document.getElementById("gpsText");


/* =========================================================
   ACCIDENT ELEMENTS
========================================================= */

const accidentPanel =
    document.getElementById("accidentPanel");

const normalAccidentState =
    document.getElementById(
        "normalAccidentState"
    );

const accidentAlertState =
    document.getElementById(
        "accidentAlertState"
    );

const countdown =
    document.getElementById("countdown");

const terminateBtn =
    document.getElementById("terminateBtn");


/* =========================================================
   CONNECT BUTTON
========================================================= */

connectBtn.addEventListener(
    "click",
    connectHelmet
);


/* =========================================================
   ENTER KEY CONNECTION
========================================================= */

helmetIPInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            connectHelmet();

        }

    }
);


/* =========================================================
   CONNECT TO HELMET
========================================================= */

async function connectHelmet() {

    let ip =
        helmetIPInput.value.trim();


    if (!ip) {

        alert(
            "Please enter your helmet IP address."
        );

        return;

    }


    /*
       Remove http:// if user enters it.
    */

    ip = ip
        .replace("http://", "")
        .replace("https://", "")
        .replace(/\/$/, "");


    helmetIP = ip;


    connectBtn.disabled = true;

    connectBtn.classList.add(
        "connecting"
    );

    connectBtn.textContent =
        "Connecting...";


    try {

        /*
           Test ESP32 connection
           by requesting /data.
        */

        const response =
            await fetch(
                `http://${helmetIP}/data`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "ESP32 did not respond correctly."
            );

        }


        const data =
            await response.json();


        connected = true;


        updateHelmetStatus(true);


        /*
           Process first data packet
        */

        updateDashboard(data);


        /*
           Start continuous sensor polling
        */

        startDataPolling();


        /*
           Start phone GPS
        */

        startPhoneGPS();


        connectBtn.classList.remove(
            "connecting"
        );

        connectBtn.classList.add(
            "connected"
        );

        connectBtn.textContent =
            "Helmet Connected";


    }

    catch (error) {

        console.error(
            "Connection error:",
            error
        );


        connected = false;


        updateHelmetStatus(false);


        connectBtn.disabled = false;

        connectBtn.classList.remove(
            "connecting"
        );

        connectBtn.textContent =
            "Connect Helmet";


        alert(
            "Could not connect to the helmet.\n\n" +
            "Check the IP address and make sure your device and ESP32 are connected to the same Wi-Fi/hotspot."
        );

    }

}


/* =========================================================
   START DATA POLLING
========================================================= */

function startDataPolling() {

    /*
       Prevent duplicate timers.
    */

    if (dataTimer) {

        clearInterval(
            dataTimer
        );

    }


    /*
       Get sensor data immediately.
    */

    fetchHelmetData();


    /*
       Continue every 500 ms.
    */

    dataTimer =
        setInterval(
            fetchHelmetData,
            500
        );

}


/* =========================================================
   FETCH ESP32 DATA
========================================================= */

async function fetchHelmetData() {

    if (!helmetIP) {

        return;

    }


    try {

        const response =
            await fetch(
                `http://${helmetIP}/data?t=${Date.now()}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "ESP32 data request failed."
            );

        }


        const data =
            await response.json();


        connected = true;


        updateHelmetStatus(true);


        updateDashboard(data);


        lastUpdate.textContent =
            "Live data • " +
            new Date().toLocaleTimeString();


    }

    catch (error) {

        console.error(
            "Data error:",
            error
        );


        connected = false;


        updateHelmetStatus(false);

    }

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard(data) {


    /* -----------------------------------------------------
       MPU STATUS
    ----------------------------------------------------- */

    /*
       Your ESP32 should eventually send:

       "mpuDetected": true

       or

       "mpuDetected": false
    */


    if (
        data.mpuDetected === true ||
        data.mpu === true
    ) {

        mpuStatus.textContent =
            "Detected";

        setStatusDot(
            mpuDot,
            "online"
        );

    }

    else if (
        data.mpuDetected === false ||
        data.mpu === false
    ) {

        mpuStatus.textContent =
            "Detection Failed";

        setStatusDot(
            mpuDot,
            "danger"
        );

    }

    else {

        /*
           Backward compatibility.

           If old ESP32 firmware doesn't
           send mpuDetected, we assume the
           sensor is responding because
           accelerometer data is present.
        */

        if (
            data.accX !== undefined &&
            data.accY !== undefined &&
            data.accZ !== undefined
        ) {

            mpuStatus.textContent =
                "Detected";

            setStatusDot(
                mpuDot,
                "online"
            );

        }

        else {

            mpuStatus.textContent =
                "Unknown";

            setStatusDot(
                mpuDot,
                "warning"
            );

        }

    }


    /* -----------------------------------------------------
       WIFI
    ----------------------------------------------------- */

    if (
        data.wifiConnected === true
    ) {

        wifiStatus.textContent =
            "Connected";

        setStatusDot(
            wifiDot,
            "online"
        );

    }

    else {

        wifiStatus.textContent =
            "Disconnected";

        setStatusDot(
            wifiDot,
            "danger"
        );

    }


    /* -----------------------------------------------------
       LORA
    ----------------------------------------------------- */

    if (
        data.lora === true ||
        data.lora === "Connected" ||
        data.loraConnected === true
    ) {

        loraStatus.textContent =
            "Connected";

        setStatusDot(
            loraDot,
            "online"
        );

    }

    else if (
        data.lora === false ||
        data.loraConnected === false
    ) {

        loraStatus.textContent =
            "Disconnected";

        setStatusDot(
            loraDot,
            "danger"
        );

    }

    else {

        loraStatus.textContent =
            "Unknown";

        setStatusDot(
            loraDot,
            "warning"
        );

    }


    /* -----------------------------------------------------
       ACCELEROMETER
    ----------------------------------------------------- */

    if (data.accX !== undefined) {

        accX.textContent =
            Number(data.accX)
                .toFixed(2) +
            " G";

    }


    if (data.accY !== undefined) {

        accY.textContent =
            Number(data.accY)
                .toFixed(2) +
            " G";

    }


    if (data.accZ !== undefined) {

        accZ.textContent =
            Number(data.accZ)
                .toFixed(2) +
            " G";

    }


    /* -----------------------------------------------------
       G FORCE
    ----------------------------------------------------- */

    if (data.impactG !== undefined) {

        gForce.textContent =
            Number(data.impactG)
                .toFixed(2);

    }


    /* -----------------------------------------------------
       GYROSCOPE
    ----------------------------------------------------- */

    if (data.gyroX !== undefined) {

        gyroX.textContent =
            Number(data.gyroX)
                .toFixed(1) +
            " °/s";

    }


    if (data.gyroY !== undefined) {

        gyroY.textContent =
            Number(data.gyroY)
                .toFixed(1) +
            " °/s";

    }


    if (data.gyroZ !== undefined) {

        gyroZ.textContent =
            Number(data.gyroZ)
                .toFixed(1) +
            " °/s";

    }


    /* -----------------------------------------------------
       GYRO MAGNITUDE
    ----------------------------------------------------- */

    if (data.gyroMag !== undefined) {

        gyroMagnitude.textContent =
            Number(data.gyroMag)
                .toFixed(1);

    }


    /* -----------------------------------------------------
       ACCIDENT
    ----------------------------------------------------- */

    if (
        data.accident === true
    ) {

        if (!accidentActive) {

            startAccidentAlert();

        }

    }

    else {

        /*
           Don't automatically cancel an
           active countdown here.

           The user must explicitly terminate
           the emergency alert.

           This prevents a temporary sensor
           state change from cancelling the
           safety countdown.
        */

    }

}


/* =========================================================
   HELMET CONNECTION STATUS
========================================================= */

function updateHelmetStatus(isConnected) {


    if (isConnected) {

        helmetStatus.textContent =
            "Helmet Connected";

        helmetCardStatus.textContent =
            "Connected";

        sidebarStatus.textContent =
            "Helmet Online";


        setStatusDot(
            helmetStatusDot,
            "online"
        );

        setStatusDot(
            helmetCardDot,
            "online"
        );

        setStatusDot(
            sidebarStatusDot,
            "online"
        );

    }

    else {

        helmetStatus.textContent =
            "Helmet Disconnected";

        helmetCardStatus.textContent =
            "Disconnected";

        sidebarStatus.textContent =
            "Helmet Offline";


        setStatusDot(
            helmetStatusDot,
            "offline"
        );

        setStatusDot(
            helmetCardDot,
            "offline"
        );

        setStatusDot(
            sidebarStatusDot,
            "offline"
        );

    }

}


/* =========================================================
   STATUS DOT HELPER
========================================================= */

function setStatusDot(
    element,
    status
) {

    if (!element) {

        return;

    }


    element.classList.remove(
        "online",
        "offline",
        "warning",
        "danger"
    );


    element.classList.add(
        status
    );

}


/* =========================================================
   PHONE GPS
========================================================= */

locationBtn.addEventListener(
    "click",
    startPhoneGPS
);


/* =========================================================
   START PHONE GPS
========================================================= */

function startPhoneGPS() {

    if (!helmetIP) {

        alert(
            "Connect your helmet first."
        );

        return;

    }


    if (
        !navigator.geolocation
    ) {

        alert(
            "GPS is not supported by this browser."
        );

        return;

    }


    gpsText.textContent =
        "Requesting location...";


    setStatusDot(
        gpsDot,
        "warning"
    );


    /*
       Stop old GPS watcher.
    */

    if (
        locationWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            locationWatchId
        );

    }


    /*
       Watch phone location continuously.

       This means when the phone moves,
       the dashboard location changes.
    */

    locationWatchId =
        navigator.geolocation.watchPosition(

            handlePhoneLocation,

            handleLocationError,

            {
                enableHighAccuracy: true,

                maximumAge: 1000,

                timeout: 10000
            }

        );


    locationBtn.textContent =
        "GPS Tracking Active";

}


/* =========================================================
   PHONE LOCATION RECEIVED
========================================================= */

function handlePhoneLocation(
    position
) {

    const coords =
        position.coords;


    currentPosition = {

        latitude:
            coords.latitude,

        longitude:
            coords.longitude,

        accuracy:
            coords.accuracy,

        speed:
            coords.speed,

        heading:
            coords.heading

    };


    /*
       Update dashboard.
    */

    updateGPSDisplay(
        currentPosition
    );


    /*
       Update Google Map.
    */

    updateMapLocation(
        coords.latitude,
        coords.longitude
    );


    /*
       Send phone GPS to ESP32.
    */

    sendLocationToHelmet(
        currentPosition
    );

}


/* =========================================================
   GPS DISPLAY
========================================================= */

function updateGPSDisplay(
    position
) {

    latitude.textContent =
        position.latitude.toFixed(6);


    longitude.textContent =
        position.longitude.toFixed(6);


    gpsAccuracy.textContent =
        position.accuracy.toFixed(1) +
        " m";


    if (
        position.speed !== null &&
        position.speed >= 0
    ) {

        /*
           Browser speed is meters/sec.

           Convert to km/h.
        */

        const kmh =
            position.speed * 3.6;


        gpsSpeed.textContent =
            kmh.toFixed(1) +
            " km/h";

    }

    else {

        gpsSpeed.textContent =
            "0.0 km/h";

    }


    if (
        position.heading !== null &&
        position.heading >= 0
    ) {

        gpsHeading.textContent =
            position.heading.toFixed(0) +
            "°";

    }

    else {

        gpsHeading.textContent =
            "--";

    }


    gpsText.textContent =
        "Live phone GPS";


    setStatusDot(
        gpsDot,
        "online"
    );

}


/* =========================================================
   SEND LOCATION TO ESP32
========================================================= */

async function sendLocationToHelmet(
    position
) {

    if (!helmetIP) {

        return;

    }


    try {

        /*
           We use query parameters.

           Example:

           /location?lat=28.123&lon=77.123
        */

        const url =
            `http://${helmetIP}/location` +
            `?lat=${encodeURIComponent(position.latitude)}` +
            `&lon=${encodeURIComponent(position.longitude)}` +
            `&accuracy=${encodeURIComponent(position.accuracy)}` +
            `&speed=${encodeURIComponent(position.speed ?? 0)}` +
            `&heading=${encodeURIComponent(position.heading ?? 0)}`;


        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );

    }

    catch (error) {

        console.error(
            "Unable to send location to helmet:",
            error
        );

    }

}


/* =========================================================
   GPS ERROR
========================================================= */

function handleLocationError(
    error
) {

    console.error(
        "GPS Error:",
        error
    );


    setStatusDot(
        gpsDot,
        "danger"
    );


    switch (error.code) {

        case 1:

            gpsText.textContent =
                "Location permission denied";

            break;


        case 2:

            gpsText.textContent =
                "Location unavailable";

            break;


        case 3:

            gpsText.textContent =
                "GPS request timeout";

            break;


        default:

            gpsText.textContent =
                "GPS error";

    }

}


/* =========================================================
   GOOGLE MAP INITIALIZATION
========================================================= */

function initMap() {

    /*
       Default map position.

       IMPORTANT:

       This is only used while waiting
       for the phone GPS.

       It is NOT sent to the ESP32.
    */

    const defaultPosition = {

        lat: 28.6139,

        lng: 77.2090

    };


    map =
        new google.maps.Map(
            document.getElementById("map"),
            {

                center:
                    defaultPosition,

                zoom: 15,

                mapTypeControl: false,

                streetViewControl: false,

                fullscreenControl: true

            }
        );


    /*
       If GPS was obtained before Google
       Maps finished loading, update map.
    */

    if (currentPosition) {

        updateMapLocation(
            currentPosition.latitude,
            currentPosition.longitude
        );

    }

}


/* =========================================================
   UPDATE MAP
========================================================= */

function updateMapLocation(
    lat,
    lon
) {

    if (!map) {

        return;

    }


    const position = {

        lat: Number(lat),

        lng: Number(lon)

    };


    /*
       Create marker once.
    */

    if (!userMarker) {

        userMarker =
            new google.maps.Marker(
                {

                    position: position,

                    map: map,

                    title:
                        "Kavach Live Location",

                    animation:
                        google.maps.Animation.DROP

                }
            );

    }

    else {

        /*
           Move existing marker.
        */

        userMarker.setPosition(
            position
        );

    }


    /*
       Move map with user.

       This means the map follows the phone
       as the user moves.
    */

    map.panTo(
        position
    );

}


/* =========================================================
   ACCIDENT ALERT
========================================================= */

function startAccidentAlert() {

    /*
       Prevent duplicate alerts.
    */

    if (accidentActive) {

        return;

    }


    accidentActive = true;


    countdownValue = 10;


    countdown.textContent =
        countdownValue;


    /*
       Change UI.
    */

    accidentPanel.classList.remove(
        "normal"
    );

    accidentPanel.classList.add(
        "alert"
    );


    normalAccidentState.classList.add(
        "hidden"
    );


    accidentAlertState.classList.remove(
        "hidden"
    );


    /*
       Start countdown.
    */

    countdownTimer =
        setInterval(
            accidentCountdown,
            1000
        );

}


/* =========================================================
   ACCIDENT COUNTDOWN
========================================================= */

function accidentCountdown() {

    countdownValue--;


    countdown.textContent =
        countdownValue;


    if (
        countdownValue <= 0
    ) {

        clearInterval(
            countdownTimer
        );


        countdownTimer =
            null;


        /*
           Countdown finished.

           Tell ESP32 to send Telegram alert.
        */

        sendEmergencyAlert();

    }

}


/* =========================================================
   TERMINATE ACCIDENT ALERT
========================================================= */

terminateBtn.addEventListener(
    "click",
    terminateAccident
);


/* =========================================================
   TERMINATE
========================================================= */

function terminateAccident() {

    /*
       Stop countdown.
    */

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

        countdownTimer =
            null;

    }


    accidentActive = false;


    /*
       Restore normal UI.
    */

    accidentPanel.classList.remove(
        "alert"
    );

    accidentPanel.classList.add(
        "normal"
    );


    accidentAlertState.classList.add(
        "hidden"
    );


    normalAccidentState.classList.remove(
        "hidden"
    );


    countdownValue = 10;


    countdown.textContent =
        "10";


    console.log(
        "Emergency alert terminated by user."
    );

}


/* =========================================================
   SEND EMERGENCY ALERT
========================================================= */

async function sendEmergencyAlert() {

    if (!helmetIP) {

        console.error(
            "Helmet IP is missing."
        );

        return;

    }


    try {

        /*
           This endpoint will be added to
           the ESP32 firmware.

           The ESP32 will then use the
           Telegram bot to send the alert.
        */

        const response =
            await fetch(
                `http://${helmetIP}/emergency`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Emergency request failed."
            );

        }


        console.log(
            "Emergency alert sent to ESP32."
        );


    }

    catch (error) {

        console.error(
            "Emergency alert error:",
            error
        );


        /*
           Keep the emergency UI visible.
        */

        alert(
            "Emergency alert could not be sent to the helmet."
        );

    }

}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
           Try to restore previously used
           helmet IP.
        */

        const savedIP =
            localStorage.getItem(
                "kavachHelmetIP"
            );


        if (savedIP) {

            helmetIPInput.value =
                savedIP;

        }

    }
);


/* =========================================================
   SAVE IP
========================================================= */

const originalConnect =
    connectHelmet;


connectBtn.addEventListener(
    "click",
    function () {

        if (
            helmetIPInput.value.trim()
        ) {

            const cleanIP =
                helmetIPInput.value
                    .trim()
                    .replace(
                        "http://",
                        ""
                    )
                    .replace(
                        "https://",
                        ""
                    )
                    .replace(
                        /\/$/,
                        ""
                    );


            localStorage.setItem(
                "kavachHelmetIP",
                cleanIP
            );

        }

    }
);


/* =========================================================
   GLOBAL MAP CALLBACK
========================================================= */

/*
   Google Maps calls this function because
   index.html contains:

   callback=initMap
*/

window.initMap =
    initMap;