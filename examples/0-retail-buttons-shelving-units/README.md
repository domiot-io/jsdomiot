# Retail Buttons & Shelving Units Example

![aisle](https://raw.githubusercontent.com/domiot-io/documents/refs/heads/main/images/aisle.jpg)

This simple yet illustrative example demonstrates how to create an interactive supermarket using jsDOMIoT where customers can press buttons to highlight corresponding shelving units with colored lights.

## What This Example Does

- **6 physical buttons** connected to product shelving units.
- **6 shelving units** with controllable LED lights.
- When a button is **pressed**, its corresponding shelving unit lights up in **blue**.
- When a button is **released**, the shelving unit returns to **white** light.

## Quick setup

For a quick setup script for DOMIoT (Document Object Model for IoT) on Linux systems use the (jsdomiot kickstart)[https://github.com/domiot-io/jsdomiot-kickstart]. Simply run a script, and the entire setup will be installed for you.

## Step-by-Step Tutorial

### 1. Install and Load Drivers for testing

```
git clone git@github.com:domiot-io/drivers.git
```

**ihubx24-sim**: Input Hub x24 digital input channels. Linux module that simulates 24 digital inputs with high (1) and low (0) states every 10 seconds.

**ohubx24-sim**: Output Hub x24 digital output channels. The driver exposes 24 output lines (channels), each controllable via a bit. When sequences of binary digits (0/1) up to 24 digits are written to the devices they are timestamped and logged to output files `/tmp/ohubx24-output0`.

#### Building and loading the Modules

```
cd linux/ihubx24-sim
make clean
make
make load
```

and
```
cd linux/ohubx24-sim
make clean
make
make load
```

Creates /dev/ihubx24-sim0 and /dev/ihubx24-sim0.

At this point you can read from /dev/ihubx24-sim0:
```
cat /dev/ihubx24-sim0
```

and write to /dev/ohubx24-sim0
```
echo 010111 > /dev/0hubx24-sim0
cat /tmp/ohubx24-output0
```

If you need more information or want to load multiple devices, please refer to the modules' README files:
[ihubx24](https://github.com/domiot-io/drivers/tree/main/linux/ihubx24-sim) and [ohubx24](https://github.com/domiot-io/drivers/tree/main/linux/ohubx24-sim)


To unload the module and clean up all devices:
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

// collection of factories for domain-specific IoT elements.
import { retailElementFactoryCollection } from 'iot-elements-node';

// collection of factories for binding elements.
import { linuxBindingFactoryCollection } from 'iot-bindings-node';

// description of the supermarket using HTML.
const html = `
<html>
    <iot-aisle id="aisle6" name="Coffee, Hot Beverages, Cookies & Chocolate">

        <iot-ihubx24-button-binding id="a6ButtonBinding" location="/dev/ihubx24-sim0">
        <iot-ohubx24-color-binding id="a6ColorBinding" channels-per-element="2" colors-channel="white;blue" location="/dev/ohubx24-sim0">

        <iot-button id="a6Product1Button" shelving-unit-id="a6L1" binding="a6ButtonBinding:0">
        <iot-button id="a6Product2Button" shelving-unit-id="a6L2" binding="a6ButtonBinding:1">
        <iot-button id="a6Product3Button" shelving-unit-id="a6L3" binding="a6ButtonBinding:2">
        <iot-button id="a6Product4Button" shelving-unit-id="a6R1" binding="a6ButtonBinding">
        <iot-button id="a6Product5Button" shelving-unit-id="a6R2" binding="a6ButtonBinding:4">
        <iot-button id="a6Product6Button" shelving-unit-id="a6R3" binding="a6ButtonBinding:5">

        <iot-shelving-unit id="a6L1" name="Ground Coffee" style="color:white;" binding="a6ColorBinding:0">
        <iot-shelving-unit id="a6L2" name="Coffee Pods & K-Cups" style="color:white;" binding="a6ColorBinding:1">
        <iot-shelving-unit id="a6L3" name="Cookies and Biscuits" style="color:white;" binding="a6ColorBinding:2">

        <iot-shelving-unit id="a6R1" name="Premium Chocolate & Candy" style="color:white;" binding="a6ColorBinding:3">
        <iot-shelving-unit id="a6R2" name="Tea Selection" style="color:white;" binding="a6ColorBinding:4">
        <iot-shelving-unit id="a6R3" name="Snack Cakes, Muffins, Mini Pastries" style="color:white;" binding="a6ColorBinding:5">

    </iot-aisle>
</html>`;

const domiot = new DOMIoT(html, [retailElementFactoryCollection, linuxBindingFactoryCollection]);
const document = domiot.window.document;

// retrieve all the buttons of the aisle number 6 in order
const buttons = document.querySelectorAll('#aisle6 iot-button');

// make each shelving unit to light up in blue
// when its button is pressed,
// and in white when its button is released.
for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];

    // light up in blue the corresponding shelving unit when a button is pressed.
    button.addEventListener('press', (ev) => {
        const shelvingUnitId = ev.target.getAttribute('shelving-unit-id');
        if (!shelvingUnitId) return;

        const shelvingUnit = document.getElementById(shelvingUnitId);
        if (!shelvingUnit) return;

        console.log(`Button ${ev.target.id} pressed, change color of the ${shelvingUnit.id} shelving unit to blue`);

        // change the color of the shelving unit to blue,
        // this changes the light color.
        shelvingUnit.style.setProperty('color','blue');

    });


    // light up in white (normal ligths) the corresponding shelving
    // unit when a button is released.
    button.addEventListener('release', (ev) => {
        const shelvingUnitId = ev.target.getAttribute('shelving-unit-id');
        if (!shelvingUnitId) return;

        const shelvingUnit = document.getElementById(shelvingUnitId);
        if (!shelvingUnit) return;

        console.log(`Button ${ev.target.id} released, change color of the ${shelvingUnit.id} shelving unit to white`);

        // change the color of the shelving unit to white,
        // this changes the light color.
        shelvingUnit.style.setProperty('color','white');

    });
}
```

Run the code:
```
node main.mjs
```

Then you can see how the simulated buttons' inputs trigger `press` and `realease` events, how the color of the shelving-units is updated accordingly (logs) and how these color changes translate into outputs:
```
watch -n 1 cat /tmp/ohubx24-output0
```

## Website

[domiot.org](https://domiot.org)

## License

MIT.