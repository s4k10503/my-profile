import React from 'react';
import './App.css';
import SphereComponent from './SphereComponent.js';

function App() {
  console.log('App Component Rendered');
  const profile = {
    name: 'OyO',
    bio: 'I am interested in AI, XR.',
    github: 'https://github.com/s4k10503',
    zenn: 'https://zenn.dev/s4k1',
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{profile.name}</h1>
        <p>{profile.bio}</p>
        <div className="Links">
          <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={profile.zenn} target="_blank" rel="noreferrer">Zenn</a>
        </div>
        <SphereComponent />{}
      </header>
    </div>
  );
}

export default App;