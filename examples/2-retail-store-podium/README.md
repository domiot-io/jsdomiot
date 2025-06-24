# Retail Store Podium Example

This example demonstrates how to create an interactive perfume display podium using jsDOMIoT with synchronized video commercials, lighting control, and perfume bottles pickup/putdown detection.

The display-unit contains:
- A screen that plays looping commercials with dynamic seeking.
- A podium with 4 perfume bottles placed on 4 individual display tiles.
- Columns beneath each tile, each containing 3 cubbies for additional storage or product display.

## What This Example Does

- Simulate detection when perfume bottles are picked up or placed back down.
- Controls lighting effects based on item interactions.
- When a perfume is picked up, the video automatically seeks to the corresponding timestamp, otherwise, it plays a default looping sequence

## Quick setup

For a quick setup script for DOMIoT (Document Object Model for IoT) on Linux systems use the [jsdomiot kickstart](https://github.com/domiot-io/jsdomiot-kickstart). Simply run a script, and the entire setup will be installed for you.

Once installed go to the example: jsdomiot/examples/2-retail-store-podium/ and do `node main.mjs`.

Open another terminal and simulate the pickup/put down products using iohubx24-sim0 device file:

```
# pick up the second perfume bottle:
echo 0100 > /dev/iohubx24-sim0

# put down the second perfume bottle:
echo 0000 > /dev/iohubx24-sim0
```

You will observe changes on the terminal running main.mjs .

To monitor what is happening with the video player do:
```
cat /dev/video-sim0
```

To verify the lights' drivers are receiving the correct message do:

```
## for the tile lights
watch -n 0.2 /tmp/cat/ohubx24-output0

# and for the cubbies lights:
watch -n 0.2 /tmp/cat/ohubx24-output1
```

## Step-by-Step Tutorial

### 1. Install and Load Drivers for testing

```
git clone git@github.com:domiot-io/drivers.git
```

**iohubx24-sim**: Input/Output Hub x24 combined digital I/O channels. Linux module that simulates item pickup/putdown detection.

**ohubx24-sim**: Output Hub x24 digital output channels. The driver exposes 24 output lines for controlling tile and column lighting.

**video-sim**: Video Simulation Driver. Simulates video playback control with commands for play, pause, seek, and loop functionality.

#### Building and loading the Modules

```
cd linux/iohubx24-sim
make clean
make
make load
```

and
```
cd linux/ohubx24-sim
make clean
make
make load NUM_DEVICES=2
```

and
```
cd linux/video-sim
make clean
make
make load
```

Creates /dev/iohubx24-sim0, /dev/ohubx24-sim0, /dev/ohubx24-sim1 and /dev/video-sim0.

If you need more information or want to load multiple devices, please refer to the modules' README files:
[iohubx24](https://github.com/domiot-io/drivers/tree/main/linux/iohubx24-sim), [ohubx24](https://github.com/domiot-io/drivers/tree/main/linux/ohubx24-sim), and [video-sim](https://github.com/domiot-io/drivers/tree/main/linux/video-sim)

To unload the modules and clean up all devices:
```
make unload
```

### 2. DOMIoT Installation

```
npm install jsdomiot iot-bindings-node
```

*Note: `iot-elements-node` is automatically installed as a dependency of `jsdomiot`.*

### 3. Example code

```
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
let lightTimeout = null; // Track the 8-second timeout

// Get references to elements
const commercialScreen = document.getElementById('commercialScreen');
const tiles = document.querySelectorAll('#perfumeDisplayUnit iot-tile');
const columns = document.querySelectorAll('#perfumeDisplayUnit iot-column');
const perfumes = document.querySelectorAll('#perfumeDisplayUnit iot-item');

// Helper function to return to default state
function returnToDefaultState() {
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.setProperty('color', 'white');
        columns[i].style.setProperty('color', 'white');
    }
    lastPickedUp = null;
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
        } else {
            tile.style.setProperty('color', 'black');
            column.style.setProperty('color', 'black');
        }
    }
}

// Handle pickup events
perfumes.forEach((perfume, index) => {
    perfume.addEventListener('pickup', (event) => {
        const brand = perfume.getAttribute('brand');
        console.log(`Perfume ${index + 1} (${brand}) picked up`);
        
        // Set as the last picked up item
        lastPickedUp = perfume;
        
        // Selectively illuminate only this perfume's tile and column
        illuminateForPerfume(index);
        
        // Seek to the commercial start time for this perfume
        const commercialStartTime = parseFloat(perfume.getAttribute('commercial-start-time'));
        commercialScreen.currentTime = commercialStartTime;
        
        // Start 8-second timeout
        if (lightTimeout) clearTimeout(lightTimeout);
        lightTimeout = setTimeout(() => {
            if (lastPickedUp) {
                console.log('8 seconds elapsed since last pickup - returning to default state');
                returnToDefaultState();
            }
        }, 8000);
        
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
            // Clear timeout and return to default state
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
```

Run the code:
```
node main.mjs
```

At this point you can simulate the item pickup and putdown detection:
```
echo 0100 > /dev/iohubx24-sim0
cat /dev/iohubx24-sim0
echo 0000 > /dev/iohubx24-sim0
cat /dev/iohubx24-sim0
```

monitor video playback:
```
echo "SET SRC=/commercials/all-perfumes.mp4" > /dev/video-sim0
echo "PLAY" > /dev/video-sim0
echo "SET CURRENT_TIME=5" > /dev/video-sim0  # Seek to 5 seconds
```

and monitor lighting outputs:
```
echo 1111 > /dev/ohubx24-sim0  # Turn on first 4 tile lights
echo 0000 > /dev/ohubx24-sim0  # Turn off first 4 tile lights
watch -n 1 cat /tmp/ohubx24-output0
```


## Website

[domiot.org](https://domiot.org)

## License

MIT. 