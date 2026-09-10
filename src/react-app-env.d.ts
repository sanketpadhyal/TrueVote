/// <reference types="react-scripts" />

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export var FC: any;
  var React: any;
  export default React;
}
