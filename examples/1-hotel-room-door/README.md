# Hotel Room Door Example

This example demonstrates how to create an interactive hotel room door system using jsDOMIoT with electronic lock control and LCD message display.

Simulates lock/unlock every 5 seconds with both normal operations and redundant operations, displaying door state changes and LCD messages.

## Quick setup

For a quick setup script for DOMIoT (Document Object Model for IoT) on Linux systems use the [jsdomiot kickstart](https://github.com/domiot-io/jsdomiot-kickstart). Simply run a script, and the entire setup will be installed for you.

## Step-by-Step Tutorial

### 1. Install and Load Drivers for testing

```
git clone git@github.com:domiot-io/drivers.git
```

**iohubx24-sim**: Input/Output Hub x24 combined digital I/O channels. Linux module that simulates digital lock control interface.

**lcd-sim**: LCD Message Display Simulator. The driver simulates an LCD display that can show text messages.

#### Building and loading the Modules

```
cd linux/iohubx24-sim
make clean
make
make load
```

and
```
cd linux/lcd-sim
make clean
make
make load
```

Creates /dev/iohubx24-sim0 and /dev/lcd-sim0.

At this point you can control the lock via /dev/iohubx24-sim0:
```
echo 1 > /dev/iohubx24-sim0  # Lock the door
echo 0 > /dev/iohubx24-sim0  # Unlock the door
```

and display messages on the LCD:
```
echo "Welcome Guest!" > /dev/lcd-sim0
```

To read the messages use:
```
cat /tmp/lcd-output0
```

If you need more information or want to load multiple devices, please refer to the modules' README files:
[iohubx24](https://github.com/domiot-io/drivers/tree/main/linux/iohubx24-sim) and [lcd-sim](https://github.com/domiot-io/drivers/tree/main/linux/lcd-sim)

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

// collection of factories for hospitality IoT elements
import { hospitalityElementFactoryCollection } from 'iot-elements-node';

// collection of factories for binding elements
import { linuxBindingFactoryCollection } from 'iot-bindings-node';

// description of the hotel room door system using HTML
const html = `
<html>
    <iot-room id="room101" name="Hotel Room 101">

        <!-- Bindings for hardware control -->
        <iot-iobits-lock-binding id="lockBinding" location="/dev/iohubx24-sim0">
        <iot-otext-message-binding id="lcdBinding" location="/dev/lcd-sim0">

        <!-- Hotel room door with electronic lock and LCD display -->
        <iot-door id="hotelDoor" 
                    test="Hello"
                  locked 
                  message="Welcome to Hotel Paradise!" 
                  binding="lockBinding lcdBinding">

    </iot-room>
</html>`;

const domiot = new DOMIoT(html, [hospitalityElementFactoryCollection, linuxBindingFactoryCollection]);
const document = domiot.window.document;

// Get the hotel door element
const hotelDoor = document.getElementById('hotelDoor');

// Simulate remote commands from hotel management system
console.log('Hotel Room Door IoT System Started');
console.log('=====================================');

// Display initial status
console.log(`Door Status: ${hotelDoor.locked ? 'LOCKED' : 'UNLOCKED'}`);
console.log(`LCD Message: "${hotelDoor.getAttribute('message')}"`);

// Listen for door lock state changes
hotelDoor.addEventListener('change', (ev) => {
    const door = ev.target;
    const status = door.locked ? 'LOCKED' : 'UNLOCKED';
    console.log(`Door state changed: ${status}`);
    
    // Update LCD message based on lock state
    if (door.locked) {
        door.setAttribute('message', 'Locked');
    } else {
        door.setAttribute('message', 'Unlocked');
    }
});

// Simulate door lock/unlock operations every 5 seconds
console.log('\nStarting door lock/unlock simulation...');
setInterval(() => {
    const isCurrentlyLocked = hotelDoor.locked;
    const shouldDoRedundantOperation = Math.random() < 0.3; // 30% chance
    
    let targetState;
    let operationDescription;
    
    if (shouldDoRedundantOperation) {
        // 30% of the time: try same operation (redundant)
        targetState = isCurrentlyLocked;
        operationDescription = isCurrentlyLocked ? 
            'Attempting to lock already locked door' : 
            'Attempting to unlock already unlocked door';
    } else {
        // 70% of the time: toggle the state
        targetState = !isCurrentlyLocked;
        operationDescription = targetState ? 
            'Locking door' : 
            'Unlocking door';
    }
    
    console.log(`\n${operationDescription}`);
    
    // Set the door lock state
    hotelDoor.locked = targetState;

    console.log(`hotelDoor.locked: ${hotelDoor.locked}\n`);
    
}, 5000);

```

Run the code:
```
node main.mjs
```

Then you can observe how the hotel door system operates:
- Door lock state changes every 5 seconds (verify using `cat /dev/iohubx24-sim0`).
- LCD messages update based on lock status (`watch -n 1 cat /tmp/lcd-output0`).
- 30% of operations are redundant (lock when already locked or unlock when already unlocked).


## Website

[domiot.org](https://domiot.org)

## License

MIT.
