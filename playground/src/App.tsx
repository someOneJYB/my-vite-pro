import { useState } from "react";
import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { testHmr } from './testHmr';

console.log(testHmr, '0')

function App() {
  const [count, setCount] = useState(0);


  return (
    <div className="App">
      <header className="App-header">
        <img className="App-logo" src={logo} alt="" />
        <p>Hello Vite~</p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {" | "}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
