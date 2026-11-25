import { Link } from 'react-router-dom';
import { mapDetailHref } from '../../api/databaseMappers';
import { repeatableQuests } from '../../data/repeatables';
import '../../styles/Information.css';
import '../../styles/Encyclopedia.css';

const formatExp = (value: number) => value.toLocaleString('es-AR');

const CustomQuests = () => (
  <div className="info-content custom-quests">
    <h2>Quests repetibles</h2>
    <p className="custom-section-intro">
      Contenido de progresión creado para OzRo. Cada NPC pide cazar 50 monstruos y
      entrega EXP al completar el encargo. El ciclo continúa en cadenas de 100 y 150
      kills con la misma recompensa por tramo.
    </p>

    <section className="custom-quest-block">
      <div className="custom-table-wrap">
        <table className="bounty-table custom-repeatable-table">
          <thead>
            <tr>
              <th>NPC</th>
              <th>Monstruo</th>
              <th>Nivel</th>
              <th>Base EXP</th>
              <th>Job EXP</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {repeatableQuests.map((quest) => (
              <tr key={`${quest.npc}-${quest.monster}`}>
                <td>{quest.npc}</td>
                <td>{quest.monster}</td>
                <td>
                  {quest.minLevel}–{quest.maxLevel}
                </td>
                <td>{formatExp(quest.baseExp)}</td>
                <td>{formatExp(quest.jobExp)}</td>
                <td className="custom-repeatable-map-cell">
                  <Link
                    className="custom-repeatable-map-link"
                    to={mapDetailHref(quest.map, null, quest.npcId)}
                  >
                    Ver en el mapa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bounty-note">
        Total: {repeatableQuests.length} quests repetibles activas en el servidor.
        Los niveles indicados son el rango efectivo del script.
      </p>
    </section>
  </div>
);

export default CustomQuests;
