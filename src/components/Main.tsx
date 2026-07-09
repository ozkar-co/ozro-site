import { useEffect, useState, useRef } from 'react';
import Header from './Header';
import InfoCard from './InfoCard';
import News from './News';
import Footer from './Footer';
import ServerStatus from './ServerStatus';
import '../styles/Main.css';
import Cookies from 'js-cookie';

const TOTAL_CITIES = 8;
const TOTAL_CHARS = 7;
const TOTAL_MOBS = 11;

function getRandomNumbers(amount: number) {
  let numbers = Array.from({ length: TOTAL_MOBS }, (_, i) => i + 1);
  let result = [];
  for (let i = 0; i < amount; i++) {
      let randomIndex = Math.floor(Math.random() * numbers.length);
      result.push(numbers[randomIndex]);
      numbers.splice(randomIndex, 1);
  }
  return result;
}

const Main = () => {
  const [randomCity, setRandomCity] = useState(Cookies.get('randomCity') || '1');
  const [randomChar, setRandomChar] = useState(Cookies.get('randomChar') || '1');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [randomMobs] = useState(() => getRandomNumbers(4));
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let newCity;
    do {
      newCity = Math.floor(Math.random() * TOTAL_CITIES) + 1;
    } while (newCity.toString() === randomCity);
    setRandomCity(newCity.toString());
    Cookies.set('randomCity', newCity.toString());
  }, []);

  useEffect(() => {
    let newChar;
    do {
      newChar = Math.floor(Math.random() * TOTAL_CHARS) + 1;
    } while (newChar.toString() === randomChar);
    setRandomChar(newChar.toString());
    Cookies.set('randomChar', newChar.toString());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        let progress = 0;
        if (rect.top <= 0) {
          progress = Math.min(Math.abs(rect.top) / (viewportHeight * 0.5), 1);
        }
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLogoStyle = () => {
    const opacity = Math.max(0, 1 - scrollProgress * 1.5);
    return {
      opacity,
      transform: `translateY(${-100 * scrollProgress}px) scale(${1 - (0.2 * scrollProgress)})`,
      transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
    };
  };

  return (
    <div className="main">
      <Header />
      <div 
        ref={bannerRef}
        className="banner"
        style={{
          backgroundImage: `url(/cities/${randomCity}.jpg)`,
        }}
      >
        <div 
          className="banner-char"
          style={{
            backgroundImage: `url(/chars/${randomChar}.webp)`,
          }}
        ></div>
        <div 
          className="banner-content"
        >
          <div 
            className="banner-logo-container"
            style={getLogoStyle()}
          >
            <img 
              src="/logotipo.png" 
              alt="Logotipo" 
              className="banner-logo"
            />
          </div>
          <h1>¡Bienvenido!</h1>
          <p>Tu aventura comienza aquí</p>
        </div>
      </div>
      <div className="server-info-section">
        <div className="server-info-grid">
          <InfoCard
            iconUrl={`/mobs/${randomMobs[0]}.webp`}
            title="Un Servidor para Disfrutar sin Presión"
            description="Aquí no hay carreras ni competencia desmedida. Juega a tu propio ritmo, solo o con amigos, sin preocuparte por perder el progreso. Un lugar ideal para compartir en familia. Además, el servidor lo administramos nosotros, tenemos la garantia de que no se cerrará."
          />
          <InfoCard
            iconUrl={`/mobs/${randomMobs[1]}.webp`}
            title="Una Experiencia Balanceada y Renovada"
            description="Renewal ep. 14.3: 5x base/job EXP, 10x MVP EXP y 3x quest EXP. Drops 5x–15x en mobs normales (cards 100x); MVP en suelo 1x y recompensa directa 5x. HP de monstruos x2."
          />
          <InfoCard
            iconUrl={`/mobs/${randomMobs[2]}.webp`}
            title="Redescubre el Juego con un Nuevo Enfoque."
            description="Aquí el comercio y la economía no son el centro del juego. Con NPCs personalizados y misiones únicas, todo está diseñado para una experiencia autosuficiente, ideal para jugar solo o en pequeños grupos sin depender de un mercado masivo."
            fromRight
          />
          <InfoCard
            iconUrl={`/mobs/${randomMobs[3]}.webp`}
            title="Un Mundo en constante Evolución."
            description="Con ajustes y actualizaciones constantes, la experiencia siempre se mantiene fresca y equilibrada. Además, Tu voz es escuchada, este es un servidor en crecimiento donde las ideas y propuestas de los jugadores pueden dar forma al mundo en el que juegas."
            fromRight
          />
        </div>
      </div>
      <ServerStatus />
      <div className="server-info-section">
        <News />
      </div>
      <Footer />
    </div>
  );
};

export default Main;
