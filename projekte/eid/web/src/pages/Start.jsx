import { useState } from 'react';
import Hero3D from '../sections/Hero3D.jsx';
import DayStory from '../sections/DayStory.jsx';
import ZweiSeiten from '../sections/ZweiSeiten.jsx';
import Bereiche from '../sections/Bereiche.jsx';
import Fristen from '../sections/Fristen.jsx';
import Warteliste from '../sections/Warteliste.jsx';
import { INTERESTS } from '../lib/catalog.js';

export default function Start() {
  const [interest, setInterest] = useState('');
  const want = value => () => setInterest(value);

  return (
    <>
      <Hero3D />
      <div id="story">
        <DayStory />
      </div>
      <ZweiSeiten onWant={want} />
      <Bereiche />
      <Fristen />
      <Warteliste options={Object.keys(INTERESTS)} interest={interest} setInterest={setInterest} source="start" />
    </>
  );
}
