import { DOMIoT } from 'jsdomiot';

// collection of factories for domain-specific IoT elements.
import { retailElementFactoryCollection } from 'iot-elements-node';

// collection of factories for binding elements.
import { linuxBindingFactoryCollection } from 'iot-bindings-node';

// description of the supermarket using HTML.
const html = `
<html>
    <iot-aisle id="aisle6" name="Coffee, Hot Beverages, Cookies & Chocolate">

        <iot-ibits-button-binding id="a6ButtonBinding" location="/dev/ihubx24-sim0">
        <iot-obits-color-binding id="a6ColorBinding" channels-per-element="2" colors-channel="white;blue" location="/dev/ohubx24-sim0">

        <iot-button id="a6Product1Button" shelving-unit-id="a6L1" binding="a6ButtonBinding">
        <iot-button id="a6Product2Button" shelving-unit-id="a6L2" binding="a6ButtonBinding">
        <iot-button id="a6Product3Button" shelving-unit-id="a6L3" binding="a6ButtonBinding">
        <iot-button id="a6Product4Button" shelving-unit-id="a6R1" binding="a6ButtonBinding">
        <iot-button id="a6Product5Button" shelving-unit-id="a6R2" binding="a6ButtonBinding">
        <iot-button id="a6Product6Button" shelving-unit-id="a6R3" binding="a6ButtonBinding">

        <iot-shelving-unit id="a6L1" name="Ground Coffee" style="color:white;" binding="a6ColorBinding">
        <iot-shelving-unit id="a6L2" name="Coffee Pods & K-Cups" style="color:white;" binding="a6ColorBinding">
        <iot-shelving-unit id="a6L3" name="Cookies and Biscuits" style="color:white;" binding="a6ColorBinding">

        <iot-shelving-unit id="a6R1" name="Premium Chocolate & Candy" style="color:white;" binding="a6ColorBinding">
        <iot-shelving-unit id="a6R2" name="Tea Selection" style="color:white;" binding="a6ColorBinding">
        <iot-shelving-unit id="a6R3" name="Snack Cakes, Muffins, Mini Pastries" style="color:white;" binding="a6ColorBinding">

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
