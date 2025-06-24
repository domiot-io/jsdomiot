/**
 * Interactive Perfume Display Unit
 * 
 * - Single looping video with 4 perfume commercials
 * - Pickup a perfume to seek to its commercial in the video
 * - Put down last perfume -> lights return to default (white)
 * - 8-second timeout returns to default state (white)
 * - Video plays continuously in loop
 * 
 **/

import { DOMIoT } from 'jsdomiot';

// collection of factories for retail IoT elements
import { retailElementFactoryCollection } from 'iot-elements-node';

// collection of factories for binding elements
import { linuxBindingFactoryCollection } from 'iot-bindings-node';

// description of the retail store podium system using HTML
const html = `
<html>
    <!-- IoT Bindings -->
    <iot-ibits-item-binding id="perfumeBinding" location="/dev/iohubx24-sim0"></iot-ibits-item-binding>
    <iot-obits-color-binding id="tileColorBinding" channels-per-element="1" colors-channel="white" location="/dev/ohubx24-sim0"></iot-obits-color-binding>
    <iot-obits-color-binding id="columnColorBinding" channels-per-element="1" colors-channel="white" location="/dev/ohubx24-sim1"></iot-obits-color-binding>
    <iot-iotext-video-binding id="videoBinding" location="/dev/video-sim0"></iot-iotext-video-binding>

    <!-- Main Display Unit Structure -->
    <iot-display-unit id="perfumeDisplayUnit">
        
        <!-- Video Screen for Commercials -->
        <iot-video id="commercialScreen" src="/commercials/all-perfumes.mp4" autoplay loop binding="videoBinding"></iot-video>
        
        <!-- Main Podium with 4 Tiles -->
        <iot-podium id="mainPodium">
            
            <!-- Tile 1 - Brand1 -->
            <iot-tile id="tile1" style="color:white;" binding="tileColorBinding">
                <iot-item id="perfume1" brand="Brand1" commercial-start-time="0" binding="perfumeBinding"></iot-item>
            </iot-tile>
            
            <!-- Tile 2 - Brand2 -->
            <iot-tile id="tile2" style="color:white;" binding="tileColorBinding">
                <iot-item id="perfume2" brand="Brand2" commercial-start-time="5" binding="perfumeBinding"></iot-item>
            </iot-tile>
            
            <!-- Tile 3 - Brand3 -->
            <iot-tile id="tile3" style="color:white;" binding="tileColorBinding">
                <iot-item id="perfume3" brand="Brand3" commercial-start-time="12.3" binding="perfumeBinding"></iot-item>
            </iot-tile>
            
            <!-- Tile 4 - Brand4 -->
            <iot-tile id="tile4" style="color:white;" binding="tileColorBinding">
                <iot-item id="perfume4" brand="Brand4" commercial-start-time="16.5" binding="perfumeBinding"></iot-item>
            </iot-tile>
            
        </iot-podium>
        
        <!-- Storage Columns beneath each Tile -->
        
        <!-- Column 1 - Brand1 Storage -->
        <iot-column id="column1" style="color:white;" binding="columnColorBinding">
            <iot-cubby id="cubby1-1"></iot-cubby>
            <iot-cubby id="cubby1-2"></iot-cubby>
            <iot-cubby id="cubby1-3"></iot-cubby>
        </iot-column>
        
        <!-- Column 2 - Brand2 Storage -->
        <iot-column id="column2" style="color:white;" binding="columnColorBinding">
            <iot-cubby id="cubby2-1"></iot-cubby>
            <iot-cubby id="cubby2-2"></iot-cubby>
            <iot-cubby id="cubby2-3"></iot-cubby>
        </iot-column>
        
        <!-- Column 3 - Brand3 Storage -->
        <iot-column id="column3" style="color:white;" binding="columnColorBinding">
            <iot-cubby id="cubby3-1"></iot-cubby>
            <iot-cubby id="cubby3-2"></iot-cubby>
            <iot-cubby id="cubby3-3"></iot-cubby>
        </iot-column>
        
        <!-- Column 4 - Brand4 Storage -->
        <iot-column id="column4" style="color:white;" binding="columnColorBinding">
            <iot-cubby id="cubby4-1"></iot-cubby>
            <iot-cubby id="cubby4-2"></iot-cubby>
            <iot-cubby id="cubby4-3"></iot-cubby>
        </iot-column>
        
    </iot-display-unit>
    
</html>`;

const domiot = new DOMIoT(html, [retailElementFactoryCollection, linuxBindingFactoryCollection]);
const document = domiot.window.document;

// State management
let lastPickedUp = null; // Track the most recently picked up item
let lightTimeout = null; // Track the 15-second timeout

// Get references to elements
const commercialScreen = document.getElementById('commercialScreen');
const tiles = document.querySelectorAll('#perfumeDisplayUnit iot-tile');
const columns = document.querySelectorAll('#perfumeDisplayUnit iot-column');
const perfumes = document.querySelectorAll('#perfumeDisplayUnit iot-item');

// Helper function to turn on all tile lights
function turnOnAllTileLights() {
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.setProperty('color', 'white');
        columns[i].style.setProperty('color', 'white');
    }
}

// Helper function to return to default state
function returnToDefaultState() {
    turnOnAllTileLights();
    lastPickedUp = null;
    
    // Video continues playing in loop - no need to change src or reload
    console.log('Returned to default state - all lights on, video continues looping');
}

// Helper function to selectively illuminate for a specific perfume
function illuminateForPerfume(activeIndex) {

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const column = columns[i];
        if (i == activeIndex) {
            tile.style.setProperty('color', 'white');
            column.style.setProperty('color', 'white');
            continue;
        }
        tile.style.setProperty('color', 'black');
        column.style.setProperty('color', 'black');
    }
}

// Helper function to start/restart the 15-second timeout
function startLightTimeout() {
    // Clear any existing timeout
    if (lightTimeout) {
        clearTimeout(lightTimeout);
    }
    
    // Set new timeout for 8 seconds
    lightTimeout = setTimeout(() => {
        if (lastPickedUp) {
            console.log('8 seconds elapsed since last pickup - turning all lights on');
            returnToDefaultState();
        }
    }, 8000);
}

// Handle pickup events
perfumes.forEach((perfume, index) => {
    perfume.addEventListener('pickup', (event) => {
        const brand = perfume.getAttribute('brand');
        console.log(`Perfume ${index + 1} (${brand}) picked up`);
        
        // Set as the last picked up item
        lastPickedUp = perfume;
        
        // Selectively turn off other tiles and columns, keep this one illuminated
        illuminateForPerfume(index);
        
        // Seek to the commercial start time for this perfume
        const commercialStartTime = parseFloat(perfume.getAttribute('commercial-start-time'));
        commercialScreen.currentTime = commercialStartTime;
        
        // Start the 15-second timeout
        startLightTimeout();
        
        console.log(`Seeking to commercial start time: ${commercialStartTime} seconds for ${brand}`);
    });
});

// Handle putdown events
perfumes.forEach((perfume, index) => {
    perfume.addEventListener('putdown', (event) => {
        const brand = perfume.getAttribute('brand');
        console.log(`Perfume ${index + 1} (${brand}) put down`);
        
        // Only process if this was the last picked up item
        if (lastPickedUp === perfume) {
            // Clear timeout and return to default state (turn all lights on)
            if (lightTimeout) {
                clearTimeout(lightTimeout);
                lightTimeout = null;
            }
            returnToDefaultState();
            console.log('Last perfume put down - returning to default state');
        } else {
            console.log('Not the last picked up perfume - ignoring putdown');
        }
    });
});

console.log('Interactive Perfume Display Unit initialized');
console.log('- Single looping video with 4 perfume commercials');
console.log('- Pickup a perfume to seek to its commercial in the video');
console.log('- Put down last perfume -> lights return to default (white)');
console.log('- 8-second timeout returns to default state (white)');
console.log('- Video plays continuously in loop');
console.log('=== Starting Retail Store Podium Simulation ===');


