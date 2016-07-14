/**
 * Compares all current props and state with previous props and state,
 * returns true if there are differences. Does do a flat comparison.
 *
 * Usage: add this function as property of a React.Component class in the constructor:
 *
 *     import shouldComponentUpdate from './shouldComponentUpdate'
 * 
 *     export default class MyComponent extends React.Component {
 *       constructor (props) {
 *         super(props)
 *
 *         // update only when props or state are changed
 *         this.shouldComponentUpdate = shouldComponentUpdate
 *       }
 *
 *       render () { ...}
 *     }
 *
 * @param nextProps
 * @param nextState
 * @return {boolean}
 */
export default function shouldComponentUpdate (nextProps, nextState) {
  return Object.keys(nextProps).some(prop => this.props[prop] !== nextProps[prop]) ||
      (this.state && Object.keys(nextState).some(prop => this.state[prop] !== nextState[prop]))
}
