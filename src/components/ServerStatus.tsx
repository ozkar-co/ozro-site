import { useEffect, useRef, useState } from 'react';
import '../styles/ServerStatus.css';
import { apiClient } from '../api/client';

interface StatusItemProps {
  title: string;
  icon: string;
  value: string;
  type?: 'status' | 'number';
}

interface ServerStatusData {
  uptime: string;
  server: string;
  'event-name': string;
  'event-date': string;
  players: number;
  ping: number;
}

const StatusItem = ({ title, icon, value, type = 'status' }: StatusItemProps) => (
  <div className="status-item">
    <div className="status-icon">
      <img src={icon} alt={title} />
    </div>
    <div className="status-info">
      <h4>{title}</h4>
      <p className={`status-value ${type === 'status' ? value.toLowerCase() : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

const ServerStatus = () => {
  const [isVisible, setIsVisible] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [statusData, setStatusData] = useState<ServerStatusData>({
    uptime: '---',
    server: 'Offline',
    'event-name': 'Por definir',
    'event-date': 'Por definir',
    players: 0,
    ping: -1
  });

  useEffect(() => {
    const fetchUptimeStatus = async () => {
      try {
        const uptimeData = await apiClient.uptime();
        const formatted = uptimeData.uptime.formatted;
        // Tomar solo valores que no sean cero, máximo 2
        const parts = formatted.split(' ');
        const nonZero = parts.filter(part => !part.startsWith('0')).slice(0, 2);
        const uptimeFormatted = nonZero.length > 0 ? nonZero.join(' ') : formatted;
        
        setStatusData(prev => ({ 
          ...prev, 
          uptime: uptimeFormatted
        }));
      } catch (error) {
        console.error('Error al obtener uptime:', error);
        setStatusData(prev => ({
          ...prev,
          uptime: '---'
        }));
      }
    };

    fetchUptimeStatus();

    const interval = setInterval(fetchUptimeStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const startTime = performance.now();
        const [playersData, statusData] = await Promise.all([
          apiClient.players(),
          apiClient.status()
        ]);
        const endTime = performance.now();
        const ping = Math.round(endTime - startTime);

        // Determinar estado general del servidor
        const allServices = Object.values(statusData.services);
        const onlineServices = allServices.filter(s => s.status === 'online').length;
        const totalServices = allServices.length;

        let serverStatus = 'Offline';
        if (onlineServices === totalServices) {
          serverStatus = 'Online';
        } else if (onlineServices > 0) {
          serverStatus = 'Partial';
        }

        setStatusData(prev => ({
          ...prev,
          players: playersData.online,
          server: serverStatus,
          ping: ping
        }));
      } catch (error) {
        console.error('Error al conectar con la API:', error);
        setStatusData(prev => ({
          ...prev,
          server: 'Offline',
          ping: -1
        }));
      }
    };

    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-50px 0px',
      }
    );

    if (statusRef.current) {
      observer.observe(statusRef.current);
    }

    return () => {
      if (statusRef.current) {
        observer.unobserve(statusRef.current);
      }
    };
  }, []);

  return (
    <div ref={statusRef} className={`server-status ${isVisible ? 'visible' : ''}`}>
      <div className="status-grid">
        {/* Columna izquierda - Estados */}
        <div className="status-column">
          <StatusItem 
            title="Uptime"
            icon="/icons/vpn.gif"
            value={statusData.uptime}
            type="number"
          />
          <StatusItem 
            title="Server"
            icon="/icons/server.gif"
            value={statusData.server}
          />
        </div>

        {/* Columna central - Evento */}
        <div className="status-center">
          <div className="event-card">
            <div className="event-icon">
              <img src="/icons/event.gif" alt="Evento" />
            </div>
            <div className="event-info">
              <div className="event-header">
                <span className="event-label">Próximo Evento</span>
                <span className="event-time">{statusData['event-date']}</span>
              </div>
              <h4 className="event-title">{statusData['event-name']}</h4>
            </div>
          </div>
        </div>

        {/* Columna derecha - Estadísticas */}
        <div className="status-column">
          <StatusItem 
            title="Online"
            icon="/icons/players.gif"
            value={statusData.players.toString()}
            type="number"
          />
          <StatusItem 
            title="Ping"
            icon="/icons/ping.gif"
            value={statusData.ping === -1 ? '---' : `${statusData.ping} ms`}
            type="number"
          />
        </div>
      </div>
    </div>
  );
};

export default ServerStatus; 
