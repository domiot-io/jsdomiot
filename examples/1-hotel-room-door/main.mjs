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
