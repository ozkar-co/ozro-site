import { ReactNode } from 'react';
import '../styles/Information.css';
import Stats from './Stats';

interface InfoContentProps {
  selectedSection: string;
}

const contentMap: Record<string, ReactNode> = {
  'stats': <Stats />,
  'features': (
    <div className="info-content">
      <h2>Especificaciones</h2>
      <div className="content-section">
        <p>
          Servidor Renewal privado, balanceado para un grupo pequeño (~3 jugadores).
          Acceso por VPN con invitación; pincode desactivado.
        </p>
        <ul>
          <li><strong>Episodio:</strong> 14.3</li>
          <li><strong>Modo:</strong> Renewal</li>
          <li><strong>Nivel máximo:</strong> 175 / 60 (tablas EXP renewal)</li>
          <li><strong>Acceso:</strong> VPN privada, solo invitación</li>
          <li><strong>Comunidad:</strong> familiar, sin economía masiva</li>
        </ul>
        <p>
          Filosofía: progresión fluida sin carrera competitiva, NPCs y quests custom,
          y mecánicas orientadas a jugar solo o en party pequeña.
        </p>
      </div>
    </div>
  ),
  'exp-rates': (
    <div className="info-content">
      <h2>Tasas de Experiencia</h2>
      <div className="content-section">
        <ul>
          <li><strong>Base EXP:</strong> 5x</li>
          <li><strong>Job EXP:</strong> 5x</li>
          <li><strong>MVP EXP:</strong> 10x</li>
          <li><strong>Quest EXP (NPCs):</strong> 3x</li>
        </ul>
        <h3>Bonificaciones y party</h3>
        <ul>
          <li>Multi level-up habilitado</li>
          <li>+25% base EXP por cada atacante extra (tope 12 atacantes)</li>
          <li>Party even share bonus: sin bonus extra por tamaño de party</li>
          <li>Rango de nivel para share en party: 15 niveles</li>
          <li>Merchant Shop EXP: 1% del zeny recibido × nivel de skill (Discount/Overcharge)</li>
          <li>EXP en mapas PvP: sí</li>
        </ul>
        <h3>Feedback en juego</h3>
        <ul>
          <li>Muestra EXP ganada: sí</li>
          <li>Muestra zeny ganado: sí</li>
        </ul>
        <h3>Al morir</h3>
        <ul>
          <li>Pérdida de 1% de base EXP y 1% de job EXP del nivel actual</li>
          <li>En max level no se pierde EXP</li>
          <li>Penalización de zeny al morir: 1%</li>
        </ul>
      </div>
    </div>
  ),
  'drop-rates': (
    <div className="info-content">
      <h2>Tasas de Drop</h2>
      <div className="content-section">
        <h3>Mobs normales</h3>
        <ul>
          <li>Common (etc): 5x</li>
          <li>Healing: 10x</li>
          <li>Usable: 10x</li>
          <li>Equipment: 15x</li>
          <li>Card: 100x</li>
        </ul>
        <h3>Boss (no MVP)</h3>
        <p>Mismos multiplicadores que mobs normales para common, heal, usable, equip y card.</p>
        <h3>MVP</h3>
        <ul>
          <li>Drops en suelo (common, heal, usable, equip, card): <strong>1x</strong> (default, sin override)</li>
          <li>Recompensa MVP directa al inventario: 5x</li>
        </ul>
        <h3>Otros</h3>
        <ul>
          <li>Tesoros WoE: 5x</li>
          <li>Tope efectivo de drop: 90%</li>
          <li>Drops logaritmicos: no (lineales)</li>
          <li>Anuncio de drops raros: ≤ 1%</li>
          <li>Autoloot mercenario y homúnculo: sí</li>
          <li>Items van al suelo (no auto-get)</li>
          <li>Duración de item en suelo: 60 s</li>
          <li>Bonus de prioridad de loot (first attack): +30%</li>
          <li>Los summons de Alchemist: si dropean loot</li>
        </ul>
      </div>
    </div>
  ),
  'download': (
    <div className="info-content">
      <h2>Descargas</h2>
      <div className="content-section">
        <p>
          Instala el cliente base, aplica el patch de OzRo y conectate con ZeroTier.
          Las cuentas nuevas debes solicitarlas a los administradores.
        </p>
        <h3>Cliente base</h3>
        <ul>
          <li>
            <a href="https://drive.usercontent.google.com/download?id=1VTzGUOz4OpP__ZTZ4UkKQndinIJNkcHS&export=download" target="_blank" rel="noopener noreferrer">
              Cliente Renewal (Google Drive)
            </a>
          </li>
        </ul>
        <h3>Patch OzRo (requerido)</h3>
        <p>
          Extrae sobre la carpeta del cliente despues de instalarlo. Este archivo se actualiza
          con frecuencia; el enlace permanece fijo.
        </p>
        <ul>
          <li>
            <a href="https://drive.google.com/file/d/1i9QjmnQFGhWL3amj-7_R7fViPIfaR-zH/view?usp=drive_link" target="_blank" rel="noopener noreferrer">
              Patch OzRo (Google Drive)
            </a>
          </li>
        </ul>
        <h3>Herramientas recomendadas</h3>
        <ul>
          <li>
            <a href="https://drive.google.com/file/d/1A8aX1A_tEFMzZr9Jsxdq6aSLzCh-i3UE/view?usp=drive_link" target="_blank" rel="noopener noreferrer">
              Vodoo
            </a>
            {' '}— Herramienta QOL para mejor rendimiento y compatibilidad con el cliente.
          </li>
        </ul>
        <h3>Opcional</h3>
        <ul>
          <li>
            <a href="https://drive.google.com/file/d/1-Pp3tq1J_TRLVc5UvqpQ5SM0niKsZkRw/view?usp=drive_link" target="_blank" rel="noopener noreferrer">
              OzRO_DLLs.zip
            </a>
            {' '}— DLLs de compatibilidad si el cliente falla al iniciar o tiene errores graficos.
          </li>
        </ul>
        <h3>VPN (ZeroTier)</h3>
        <p>
          Para conectarte al servidor necesitas ZeroTier. El identificador de red debes solicitarlo a los administradores.
        </p>
        <ul>
          <li>
            <a href="https://download.zerotier.com/dist/ZeroTier%20One.msi" target="_blank" rel="noopener noreferrer">
              Descargar ZeroTier
            </a>
          </li>
        </ul>
        <p>
          Si tienes alguna duda, no dudes en contactar con los administradores.
        </p>
      </div>
    </div>
  ),
  'unique-features': (
    <div className="info-content">  
      <h2>Mecanicas Únicas</h2>
      <div className="content-section">
        <h3>Combate y monstruos</h3>
        <ul>
          <li>HP de mobs y MVPs: ×2</li>
          <li>Zeny por kill de mob: sí (cantidad pequeña)</li>
          <li>Barra de HP de mobs oculta</li>
          <li>MVP tomb: activo</li>
          <li>Los mobs <strong>no</strong> hacen golpes críticos</li>
          <li>Flee penalty en mobs: sí</li>
          <li>Falcon y Warg simultaneos: permitido</li>
          <li>Boss: Heal/Full Heal sobre mobs cura solo 1 HP</li>
        </ul>
        <h3>Economía y sistemas activos</h3>
        <ul>
          <li>Bounty Boards en 14 ciudades</li>
          <li>Quests repetibles de EXP (17 misiones)</li>
          <li>Garrett el Recolector: oferta diaria de dos items de chatarra con precio elevado</li>
          <li>Merchant gana Job EXP al vender (Shop EXP)</li>
          <li>Autoloot mercenario y homúnculo</li>
          <li>Vending sin tax; barter activo; banco activo</li>
          <li>Reconexion a instancias: sí</li>
        </ul>
        <h3>Mascotas</h3>
        <ul>
          <li>No requieren equip de pet para funcionar</li>
          <li>Pueden atacar y dar EXP de ataque al master</li>
          <li>Velocidad de level pet: 50%</li>
        </ul>
      </div>
    </div>
  ),
  'cash-shop': (
    <div className="info-content">
      <h2>Cash Shop</h2>
      <div className="content-section">
        <p>
          La Cash Shop ofrece una variedad de productos para mejorar la experiencia de juego sin desequilibarlo.
          Aquí encontrarás mejoras de conveniencia, potenciadores temporales y objetos difíciles de obtener.
        </p>
        <h3>Materiales de Mejora</h3>
        <p>
          Para Refinamiento Avanzados y mejores probabilidades:
        </p>
        <ul>
            <li><strong>Metales de Forja:</strong> HD Elunium, Enriched Elunium, HD Oridecon, Enriched Oridecon.</li>
            <li><strong>Metales Avanzados:</strong> Bradium, HD Bradium, Cardium, HD Cardium.</li>
        </ul>
        <h3>Mejoras de Conveniencia</h3>
        <p>
          Acceso unico a mejoras o facilidades exclusivas en el juego:
        </p>
        <ul>
            <li><strong>Gym Pass:</strong> Aumenta la capacidad de carga de peso</li>
            <li><strong>Kafra Storage Card:</strong> Accede a tu almacenamiento desde cualquier lugar</li>
        </ul>
        <h3>Buffs y Reforzamientos Temporales</h3>
        <p>
          Para aquellos que buscan una ventaja estratégica:
        </p>
        <ul>
            <li><strong>Abrasive:</strong> Incremento de Critical Rate</li>
            <li><strong>Scrolls de Buffs de High Priest:</strong> Blessing, Increase Agi, Aspersio, Assumptio, Lex Aeterna.</li>
            <li><strong>Elemental Converter Scrolls:</strong> Fire, Earth, Water, Wind.</li>
        </ul>
        <h3>Bonificaciones de Experiencia</h3>
        <p>
          Anillos de alquiler que otorgan un +15% de EXP contra enemigos de un tipo específico durante una semana:
        </p>
        <ul>
            <li><strong>Beholder Ring:</strong> Neutral</li>
            <li><strong>Bloody Ring:</strong> Demihuman</li>
            <li><strong>Chemical Ring:</strong> Plant</li>
            <li><strong>Clamorous Ring:</strong> Brute</li>
            <li><strong>Decussate Ring:</strong> Demon</li>
            <li><strong>Fisher Ring:</strong> Fish</li>
            <li><strong>Hallow Ring:</strong> Undead</li>
            <li><strong>Insecticide Ring:</strong> Insect</li>
            <li><strong>Satanic Ring:</strong> Angel</li>
        </ul>
        <h3>Cajas de Objetos Aleatorios</h3>
        <p>
          Sorpresas para los jugadores que disfrutan de la emoción de lo inesperado:
        </p>
        <ul>
            <li><strong>Jewelery Box:</strong> Accesorios aleatorios</li>
            <li><strong>Wrapped Mask:</strong> Máscaras aleatorias</li>
            <li><strong>Old Red Box:</strong> Equipo aleatorio</li>
            <li><strong>Poring Box:</strong> Invoca un Poring aleatorio, incluyendo Angeling, Deviling y Ghostring</li>
        </ul>
        <h3>Consumibles Útiles</h3>
        <p>
          Para esos momentos críticos en el combate:
        </p>
        <ul>
            <li><strong>Cursed Water:</strong> Encanta el arma con propiedad Shadow</li>
            <li><strong>Blue Potion:</strong> Recuperación rápida de SP</li>
            <li><strong>Acid Bomb:</strong> Para Alchemist y Creator</li>
            <li><strong>Yggdrasil Leaf:</strong> Revive a un aliado caído</li>
            <li><strong>Token of Siegfried:</strong> Revive instantáneamente en combate</li>
        </ul>
        <h3>Conjuntos de Cartas</h3>
        <p>
          Perfectos para aquellos que buscan fortalecer a sus personajes con builds específicas:
        </p>
        <ul>
            <li><strong>First Class Sets:</strong> Archer, Acolyte, Swordman, Magician, Thief, Merchant.</li>
            <li><strong>Second Class Sets:</strong> Crusader, Alchemist, Bard, Rogue, Sage, Monk.</li>
            <li><strong>Other Sets:</strong> Owl, Clock Tower, Ghost, Geffenia, Nightmare.</li>
        </ul>
      </div>
    </div>
  ),

  'restrictions': (
    <div className="info-content">
      <h2>Restricciones y penalizaciones</h2>
      <div className="content-section">
        <h3>Jugador</h3>
        <ul>
          <li>ASPD máximo (normal): 190</li>
          <li>ASPD máximo (3rd / extended): 193</li>
          <li>HP máximo nivel 175: 1.100.000</li>
          <li>Respawn con 50% HP y 50% SP</li>
          <li>Sin límite de skill points por nivel</li>
        </ul>
        <h3>Party</h3>
        <ul>
          <li>Rango de nivel para share: 15</li>
          <li>Misma cuenta en party: bloqueado</li>
        </ul>
        <h3>Features desactivados</h3>
        <ul>
          <li>Achievements, attendance, equip switch, private airship, roulette</li>
          <li>Barter extended</li>
        </ul>
        <h3>Penalización al morir</h3>
        <ul>
          <li>1% base EXP y 1% job EXP del nivel actual</li>
          <li>1% zeny en PvP</li>
          <li>Sin pérdida de EXP en max level</li>
        </ul>
      </div>
    </div>
  ),

  'trade-npcs': (
    <div className="info-content">
      <h2>Comercio e Intercambio</h2>
      <div className="content-section">
        <p>NPCs activos en el servidor:</p>
        <ul>
          <li><strong>Sophie</strong> — Cambio puntos cash ↔ zeny (<code>points2zeny.txt</code>)</li>
          <li><strong>Garrett el Recolector</strong> — Compra dos tipos de chatarra al dia a buen precio (x10 valor de venta, minimo 500 zeny/unidad); limite de gasto diario. Geffen</li>
          <li><strong>Monke</strong> — Intercambia bananas por frutas aleatorias</li>
          <li><strong>Card Collector</strong> — Archivo de cartas por cuenta y progreso de colección</li>
          <li><strong>Card Remover</strong> — Quita cartas de equipamiento</li>
        </ul>
      </div>
    </div>
  ),

  'buff-npcs': (
    <div className="info-content">
      <h2>Buffs y Soporte</h2>
      <div className="content-section">
        <p>NPCs activos en el servidor:</p>
        <ul>
          <li><strong>Healer</strong> — Cura y buffs temporales (curación y buffs por separado)</li>
          <li><strong>Stylist</strong> — Cambio de apariencia</li>
          <li><strong>Canalizadora Mística</strong> — Reset de stats/skills (birthstone + zeny)</li>
          <li><strong>Sabio de los Elementos</strong> — Imbuye propiedad elemental al arma (Fuego, Viento, Hielo, Tierra) por zeny y piedra elemental; efecto ~30 min. Izlude, Prontera, Morocc, Geffen</li>
          <li><strong>Kessinger, Vinculador de Almas</strong> — Soul Link de pago (20.000 zeny, ~20 min); jobs 2-1/2-2 y renewal compatibles. Yuno, Prontera, Morocc, Comodo, Geffen</li>
        </ul>
      </div>
    </div>
  ),

  'other-npcs': (
    <div className="info-content">
      <h2>Otros NPCs</h2>
      <div className="content-section">
        <p>NPCs activos en el servidor:</p>
        <ul>
          <li><strong>Kaz el Cronista</strong> — Lore del reino y registro de aventureros; conteo de jugadores online. Geffen</li>
          <li><strong>Ludovico el Sepulturero</strong> — Estadisticas de muertes del personaje y ecos de muerte en todo el reino. Prontera</li>
          <li><strong>Bounty Boards</strong> — Misiones de caza por ciudad (14 mapas)</li>
          <li><strong>Quests repetibles</strong> — EXP repetible por monstruo (17 quests)</li>
        </ul>
      </div>
    </div>
  ),

  'bounty-missions': (
    <div className="info-content">
      <h2>Bounty Missions</h2>
      <div className="content-section">
        <p>
          Tablones de caza activos en 14 ciudades (<code>npc/custom/ozro/bounty/</code>).
          Misiones de caza por mapa para obtener recompensas recurrentes.
        </p>
      </div>
    </div>
  ),

  'hunting-missions': (
    <div className="info-content">
      <h2>Hunting Missions</h2>
      <div className="content-section">
        <p>
          Script presente en repo (<code>hunting_missions.txt</code>) pero <strong>desactivado</strong> en
          <code>scripts_custom.conf</code>. Candidato a daily loop futuro.
        </p>
      </div>
    </div>
  ),

  'crimson-weapons': (
    <div className="info-content">
      <h2>Crimson Weapons</h2>
      <div className="content-section">
        <p>
          Quest en reformulación. En Renewal de rAthena ya es posible obtener las armas Crimson;
          el encantador Marcus y la quest custom están pendientes de alinear con el diseño actual.
        </p>
      </div>
    </div>
  ),

};

const InfoContent = ({ selectedSection }: InfoContentProps) => {
  return (
    <div className="info-content-container">
      <div className="scrollable-content">
        {contentMap[selectedSection] || (
          <div className="info-content">
            <h2>Sección en Construcción</h2>
            <div className="content-section"> 
              <p>Esta sección está siendo actualizada...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoContent; 