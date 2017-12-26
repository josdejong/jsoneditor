import React from 'react';
import ReactDOM from 'react-dom';
import Demo from './Demo';



test('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Demo />, div);
});
