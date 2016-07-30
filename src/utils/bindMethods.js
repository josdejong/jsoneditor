/**
 * Helper function to bind all methods of a class instance to the instance
 *
 * Usage:
 *
 *     import bindMethods from './bindMethods'
 *
 *     class MyClass {
 *       constructor () {
 *         bindMethods(this)
 *       }
 *
 *       myMethod () {
 *         // ...
 *       }
 *     }
 *
 * @param {Object} instance    Instance of an ES6 class or prototype
 */
export default function bindMethods (instance) {
  const prototype = Object.getPrototypeOf(instance)

  Object.getOwnPropertyNames(prototype).forEach(name => {
    if (typeof instance[name] === 'function') {
      instance[name] = instance[name].bind(instance);
    }
  })
}
