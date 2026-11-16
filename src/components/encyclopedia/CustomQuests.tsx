import BountyBoards from '../BountyBoards';
import { repeatableQuests } from '../../data/repeatables';
import '../../styles/Information.css';
import '../../styles/Encyclopedia.css';

const formatExp = (value: number) => value.toLocaleString('es-AR');

const CustomQuests = () => (
  <div className="info-content custom-quests">
    <h2>Quests personalizadas</h2>
    <p className="custom-section-intro">
      Contenido de caza y progresión creado para OzRo. Los bounty boards rotan por
      ciudad y las quests repetibles permiten subir personajes nuevos con ayuda de
      los más fuertes.
    </p>

    <section className="custom-quest-block">
      <BountyBoards embedded />
    </section>

    <section className="custom-quest-block">
      <h3>Quests repetibles</h3>
      <p>
        Cada NPC pide cazar 50 monstruos y entrega EXP al completar el encargo. El
        ciclo continúa en cadenas de 100 y 150 kills con la misma recompensa por
        tramo. Los niveles indicados son el rango efectivo del script.
      </p>
      <div className="custom-table-wrap">
        <table className="bounty-table custom-repeatable-table">
          <thead>
            <tr>
              <th>NPC</th>
              <th>Monstruo</th>
              <th>Mapa</th>
              <th>Nivel</th>
              <th>Base EXP</th>
              <th>Job EXP</th>
            </tr>
          </thead>
          <tbody>
            {repeatableQuests.map((quest) => (
              <tr key={`${quest.npc}-${quest.monster}`}>
                <td>{quest.npc}</td>
                <td>{quest.monster}</td>
                <td>{quest.map}</td>
                <td>
                  {quest.minLevel}–{quest.maxLevel}
                </td>
                <td>{formatExp(quest.baseExp)}</td>
                <td>{formatExp(quest.jobExp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bounty-note">
        Total: {repeatableQuests.length} quests repetibles activas en el servidor.
      </p>
    </section>

    <section className="custom-note-card">
      <h3>Crimson Weapons</h3>
      <p>
        Las Crimson ya no son una quest custom: en rAthena se consiguen por vías
        oficiales. La historia de Marcus y la cadena de Crimson quedan como
        referencia de diseño para futuras fabricaciones con lore y partes
        especiales.
      </p>
    </section>
  </div>
);

export default CustomQuests;
