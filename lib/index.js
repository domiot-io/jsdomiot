/**
 * @fileoverview Wrapper around the jsdom Node.js library to integrate 
 * IoT elements, attributes and link them to physical devices.
 */
import { JSDOM } from 'jsdom';

// Used for type validation.
import { HTMLElementFactoryCollection } from 'iot-elements-node';

/**
 * DOMIoT provides a virtual DOM environment
 * with support for IoT elements.
 */
export class DOMIoT {

    /**
     * Creates a new DOMIoT instance.
     * @param {string} html - The HTML content to initialize the DOM with.
     * @param {HTMLElementFactoryCollection|HTMLElementFactoryCollection[]} elementFactoryCollection - Custom element factory collections.
     * Can be a single collection or an array of collections. It can contain HTML IoT elements and binding elements.
     */
    constructor(html, elementFactoryCollection) {

        this._validateConstructorParams(html, elementFactoryCollection);

        this.dom = new JSDOM(html, {

            beforeParse: (window) => {
     
                if (elementFactoryCollection) {
                    this._addIoTElements(window, elementFactoryCollection);
                }

                // set the binding hooks before parse,
                // this way styles involving color, for example,
                // are applied when the IoT system is powered on.
                this._setBindingHooks(window);

            }
        });

        this.window = this.dom.window;
        this.document = this.window.document;

        
        const scope = this;

        // get all the bindings and list the elements
        // by index inside the binding
        // those who don't have an index are assigned one by order.
        let bindingEls = {};

        const elsWithBinding = this.document.querySelectorAll('[binding]');
        for (const el of elsWithBinding) {
            const binding = el.getAttribute('binding');
            if (!binding) {
                return;
            }
            const splittedBinding = binding.split(' ');
            splittedBinding.forEach((idAndIndex) => {
                const [bindingEl, index] = scope._getBindingAndIndex(idAndIndex);
                if (!bindingEl) {
                    return;
                }

                // if not already done,
                // add binding element for later use.
                if (bindingEl.id && !bindingEls[bindingEl.id]) {
                    bindingEls[bindingEl.id] = bindingEl;
                }

                // add element to the bindig element
                
                // elements have no index
                // if one element has no index, all elements
                // are indexed by their order of appearance.
                if (bindingEl.elementsWithoutIndex) {
                    bindingEl.lastIndex = bindingEl.lastIndex + 1;
                    bindingEl.elementsWithoutIndex.set(bindingEl.lastIndex, el);
                    if (!el.bindings) {
                        el.bindings = {};
                    }
                    el.bindings[bindingEl.id] = bindingEl.lastIndex;
                    return;
                }


                // so far, elements had an index.
                if (index != null) {
                    if (!bindingEl.tmpElements) {
                        bindingEl.tmpElements = new Map();
                        bindingEl.elementsIndexes = [];
                    }
                    bindingEl.elementsIndexes.push(index);
                    bindingEl.tmpElements.set(index, el);
                    if (!el.bindings) {
                        el.bindings = {};
                    }
                    el.bindings[bindingEl.id] = index;
                } else {
                    // if one index is non existant the rest
                    // of the indexes for the binding do not count
                    // elements are indexed by order of appearance
                    bindingEl.elementsWithoutIndex = new Map(); 

                    // reindex elements
                    bindingEl.lastIndex = -1;
                    if (bindingEl.tmpElements){
                        for (const [_index, _el] of bindingEl.tmpElements) {
                            bindingEl.lastIndex = bindingEl.lastIndex + 1;
                            bindingEl.elementsWithoutIndex.set(bindingEl.lastIndex, _el);
                            if (!_el.bindings) {
                                _el.bindings = {};
                            }
                            _el.bindings[bindingEl.id] = bindingEl.lastIndex;
                        }
                        delete bindingEl.elementsIndexes;
                        delete bindingEl.tmpElements;
                    }

                    bindingEl.lastIndex = bindingEl.lastIndex + 1;
                    bindingEl.elementsWithoutIndex.set(bindingEl.lastIndex, el);
                    if (!el.bindings) {
                        el.bindings = {};
                    }
                    el.bindings[bindingEl.id] = bindingEl.lastIndex;
                }

            });
        }

        // order elements by index or b
        // dispatch load event on all bindings.
        for (const id in bindingEls) {
            const bindingEl = bindingEls[id];

            // order elements
            // if tmp elements exist, order them using elementIndexes.
            if (bindingEl.elementsWithoutIndex) {
                bindingEl.elements = bindingEl.elementsWithoutIndex;
                delete bindingEl.elementsWithoutIndex;
            } else {
                if (!bindingEl.elements) {
                    bindingEl.elements = new Map();
                }

                bindingEl.elementsIndexes.sort((a, b) => a - b);
                bindingEl.elementsIndexes.forEach(elementIndex => {
                    bindingEl.elements.set(elementIndex, bindingEl.tmpElements.get(elementIndex));
                });
                delete bindingEl.elementsIndexes;
                delete bindingEl.tmpElements;
            }

            bindingEl.dispatchEvent(new this.window.Event('load'));
        }


        const elsWithStyle = this.document.querySelectorAll('[style]');
        for (const el of elsWithStyle) {
            const style = el.style;
            this._elementStyleAttributeSet(el, style);
        }

    }

    /**
     * Validates constructor parameters for type correctness.
     * @param {string} html - The HTML content parameter.
     * @param {HTMLElementFactoryCollection|HTMLElementFactoryCollection[]} elementFactoryCollection - The optional element factory collection parameter.
     * @private
     */
    _validateConstructorParams(html, elementFactoryCollection) {
        if (typeof html !== 'string') {
            throw new Error('DOMIoT first constructor argument `html` must be of type string.');
        }

        if (elementFactoryCollection) {
            if (elementFactoryCollection instanceof HTMLElementFactoryCollection) {
                elementFactoryCollection = [elementFactoryCollection];
            } else {

                // check if collection is an Array of collections.
                let isTypeCorrect = true;

                if (!Array.isArray(elementFactoryCollection)){
                    isTypeCorrect = false;
                } else {
                    // check if the Array is an Array of HTMLElementFactoryCollection
                    for (let i = 0; i < elementFactoryCollection.length; i++) {
                        const collection = elementFactoryCollection[i];
                        if (!(collection instanceof HTMLElementFactoryCollection)) {
                            isTypeCorrect = false;
                            break;
                        }
                    }
                }

                if (!isTypeCorrect) {
                    throw new Error('DOMIoT second constructor argument `elementFactoryCollection` must be of type HTMLElementFactoryCollection or Array of HTMLElementFactoryCollection.');
                }
            }
        }
    }


    /**
     * Registers user-defined custom IoT elements.
     * @param {Window} window - The jsdom window object.
     * @param {HTMLElementFactoryCollection|HTMLElementFactoryCollection[]} elementFactoryCollections - Array of collections of custom element factories.
     * @private
     */
    _addIoTElements(window, elementFactoryCollections) {
        elementFactoryCollections.forEach(elementFactoryCollection => {
            for (const [tagName, createHTMLElement] of elementFactoryCollection) {
                try {
                    window.customElements.define(tagName, createHTMLElement(window));
                } catch(e) {
                    console.warn(e);
                }
            }
        });
    }

    /**
     * Parses binding ID and index from a binding attribute value.
     * index corresponds to the index of the element in the binding.
     * @param {string} idAndIndex - String in format "bindingId" or "bindingId:index".
     * @returns {Array} Array containing [bindingElement, index] where index is null if not specified.
     * @param {Element} el - The element to get the binding and index for.
     * @private
     */
    _getBindingAndIndex(idAndIndex, el) {

        if (!idAndIndex) {
            return [null,null];
        }
        
        let id = null;
        let index = null;

        const match = idAndIndex.match(/^(.*):(\d+)$/);

        if (match) {
            id = match[1];
            if (el && el.bindings && typeof el.bindings[id] !== 'undefined') {
                index = el.bindings[id];
            }else{
                index = parseInt(match[2], 10);
            }
        } else {
            id = idAndIndex;
            if (el && el.bindings && typeof el.bindings[id] !== 'undefined') {
                index = el.bindings[id];
            }else{
                index = null;
            }
        }

        const bindingEl = this.document.getElementById(id);

        return [bindingEl, index];
    }

    /**
     * Notifies IoT binding elements about a modified attribute.
     * @param {Element} el - The element whose attribute was modified.
     * @param {string} attributeName - The name of the modified attribute.
     * @param {string} attributeValue - The new value of the attribute.
     * @private
     */
    _notifyAttributeModificationToBinding(el, attributeName, attributeValue) {
        const scope = this;
        const binding = el.getAttribute('binding');
        if (!binding) {
            return;
        }
        const splittedBinding = binding.split(' ');
        splittedBinding.forEach((idAndIndex) => {
            const [bindingEl, index] = scope._getBindingAndIndex(idAndIndex, el);
            if (!bindingEl) {
                return;
            }
            if (!bindingEl.elementAttributeModified || typeof bindingEl.elementAttributeModified !== 'function') {
                return;
            }
            bindingEl.elementAttributeModified(index, el, attributeName, attributeValue);
        });
    }

    /**
     * Notifies IoT binding elements about a namespaced attribute modification.
     * @param {Element} el - The element whose attribute was modified.
     * @param {string} namespace - The namespace URI of the attribute.
     * @param {string} attributeName - The local name of the modified attribute.
     * @param {string} attributeValue - The new value of the attribute.
     * @private
     */
    _notifyAttributeNSModificationToBinding(el, namespace, attributeName, attributeValue) {
        const scope = this;
        const binding = el.getAttribute('binding');
        if (!binding) {
            return;
        }
        const splittedBinding = binding.split(' ');
        splittedBinding.forEach((idAndIndex) => {
            const [bindingEl, index] = scope._getBindingAndIndex(idAndIndex, el);
            if (!bindingEl) {
                return;
            }
            if (!bindingEl.elementAttributeNSModified || typeof bindingEl.elementAttributeNSModified !== 'function') {
                return;
            }
            bindingEl.elementAttributeNSModified(index, el, namespace, attributeName, attributeValue);
        });
    }

    /**
     * Notifies IoT binding elements about a style property modification.
     * @param {Element} el - The element whose style was modified.
     * @param {string} propertyName - The name of the CSS property that was modified.
     * @param {string} propertyValue - The new value of the CSS property.
     * @private
     */
    _notifyStyleModificationToBinding(el, propertyName, propertyValue) {
        const scope = this;
        const binding = el.getAttribute('binding');
        if (!binding) {
            return;
        }
        const splittedBinding = binding.split(' ');
        splittedBinding.forEach((idAndIndex) => {
            const [bindingEl, index] = scope._getBindingAndIndex(idAndIndex, el);
            if (!bindingEl) {
                return;
            }
            if (!bindingEl.elementStyleModified || typeof bindingEl.elementStyleModified !== 'function') {
                return;
            }
            bindingEl.elementStyleModified(index, el, propertyName, propertyValue);
        });

    }

    /**
     * Processes all style properties on an element and notifies bindings.
     * @param {Element} el - The element whose style attribute was set.
     * @param {CSSStyleDeclaration} style - The style object to process.
     * @private
     */
    _elementStyleAttributeSet(el, style) {
        for (let i = 0; i < style.length; i++) {
            const propertyName = style[i];
            const propertyValue = style.getPropertyValue(propertyName);
            this._notifyStyleModificationToBinding(el, propertyName, propertyValue);
        }
    }

    /**
     * Overrides attribute setters and style manipulators
     * to notify binding elements on changes.
     * @param {Window} window - The jsdom window object.
     * @private
     */
    _setBindingHooks(window) {
        const scope = this;

        const originalSetAttribute = window.Element.prototype.setAttribute;
        window.Element.prototype.setAttribute = function(attributeName, attributeValue) {
            originalSetAttribute.call(this, attributeName, attributeValue);
            scope._notifyAttributeModificationToBinding(this, attributeName);
        };

        const originalRemoveAttribute = window.Element.prototype.removeAttribute;
        window.Element.prototype.removeAttribute = function(attributeName) {
            originalRemoveAttribute.call(this, attributeName);
            scope._notifyAttributeModificationToBinding(this, attributeName);
        };

        const originalToggleAttributes = window.Element.prototype.toggleAttribute;
        window.Element.prototype.toggleAttribute = function(attributeName) {
            const res = originalToggleAttributes.call(qualifiedName);
            scope._notifyAttributeModificationToBinding(this, attributeName);
            return res;
        };

        const originalSetAttributeNode = window.Element.prototype.setAttributeNode;
        window.Element.prototype.setAttributeNode = function(attr) {
            const res = originalSetAttributeNode.call(attr);
            scope._notifyAttributeModificationToBinding(this, attr.nodeName);
            return res;
        }

        const originalRemoveAttributeNode = window.Element.prototype.removeAttributeNode;
        window.Element.prototype.removeAttributeNode = function(attr) {
            const attributeName = attr.nodeName;
            const res = originalRemoveAttributeNode.call(attr);
            scope._notifyAttributeModificationToBinding(this, attributeName);
            return res;
        }

        const originalSetAttributeNS = window.Element.prototype.setAttributeNS;
        window.Element.prototype.setAttributeNS = function(namespace, attributeName, attributeValue) {
            originalSetAttributeNS.call(this, namespace, attributeName, attributeValue);
            scope._notifyAttributeNSModificationToBinding(this, namespace, attributeName);
        };

        const originalRemoveAttributeNS = window.Element.prototype.removeAttributeNS;
        window.Element.prototype.removeAttributeNS = function(namespace, attributeName) {
            originalRemoveAttributeNS.call(this, namespace, attributeName);
            scope._notifyAttributeNSModificationToBinding(this, namespace, attributeName);
        };

        const originalSetAttributeNodeNS = window.Element.prototype.setAttributeNodeNS;
        window.Element.prototype.setAttributeNodeNS = function(attr) {
            const res = originalSetAttributeNodeNS.call(attr);
            scope._notifyAttributeNSModificationToBinding(this, attr.namespaceURI, attr.localName);
            return res;
        };


        // override the 'style' getter to return a proxy
        const proto = window.HTMLElement.prototype;
        // save original style getter
        const originalStyleDescriptor = Object.getOwnPropertyDescriptor(proto, "style");


        Object.defineProperty(proto, "style", {
            get() {
                const realStyle = originalStyleDescriptor.get.call(this);

                if (!this._proxiedStyle) {

                    
                    realStyle._ownerElement = this;

                    // override setProperty directly on the style object
                    const originalSetProperty = realStyle.setProperty;
                    realStyle.setProperty = function (propertyName, propertyValue, priority) {
                        const result = originalSetProperty.call(this, propertyName, propertyValue, priority);
                        scope._notifyStyleModificationToBinding(this._ownerElement, propertyName, propertyValue);
                        return result;
                    };

                    const proxied = new Proxy(realStyle, {
                        set(target, prop, value) {
                            const res = Reflect.set(target, prop, value);
                            scope._notifyStyleModificationToBinding(target._ownerElement, prop, value);
                            return res;
                        },
                        get(target, prop, receiver) {
                            const val = Reflect.get(target, prop, receiver);
                            return typeof val === "function" ? val.bind(target) : val;
                        }
                    });

                    this._proxiedStyle = proxied;
                }

                return this._proxiedStyle;
            },
            configurable: true,
            enumerable: true
        });
    }
}
