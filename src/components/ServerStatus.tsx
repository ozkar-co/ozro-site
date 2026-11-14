import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/ServerStatus.css';
import { apiClient } from '../api/client';

interface StatusItemProps {
  title: string;
  icon: string;
  value: string;
  type?: 'status' | 'number';
  statusClass?: string;
}

interface ServerStatusData {
  uptime: string;
  server: string;
  serverStatusClass: string;
  players: number;
  ping: number;
  eventName: string;
  eventDate: string;
}

const SERVER_STATUS_LABELS: Record<string, string> = {
  Online: 'En línea',
  Partial: 'Parcial',
  Offline: 'Desconectado'
};

interface ServiceStatus {
  login: string;
  char: string;
  map: string;
}

function formatUptime(formatted: string): string {
  const parts = formatted.split(' ');
  const nonZero = parts.filter((part) => !part.startsWith('0')).slice(0, 2);
  return nonZero.length > 0 ? nonZero.join(' ') : formatted;
}

function resolveServerStatus(services: ServiceStatus): { label: string; className: string } {
  const values = Object.values(services);
  const onlineCount = values.filter((s) => s === 'online').length;

  if (onlineCount === values.length) {
    return { label: SERVER_STATUS_LABELS.Online, className: 'online' };
  }
  if (onlineCount > 0) {
    return { label: SERVER_STATUS_LABELS.Partial, className: 'partial' };
  }
  return { label: SERVER_STATUS_LABELS.Offline, className: 'offline' };
}

const StatusItem = ({ title, icon, value, type = 'status', statusClass }: StatusItemProps) => (
  <div className="status-item">
    <div className="status-icon">
      <img src={icon} alt={title} />
    </div>
    <div className="status-info">
      <h4>{title}</h4>
      <p className={`status-value ${type === 'status' ? (statusClass || value.toLowerCase()) : ''}`}>
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
    server: SERVER_STATUS_LABELS.Offline,
    serverStatusClass: 'offline',
    players: 0,
    ping: -1,
    eventName: 'Por definir',
    eventDate: 'Por definir'
  });

  const fetchStatus = useCallback(async () => {
    const startTime = performance.now();

    try {
      const [uptimeRes, playersRes, statusRes] = await Promise.all([
        apiClient.uptime(),
        apiClient.players(),
        apiClient.status()
      ]);

      const ping = Math.round(performance.now() - startTime);
      const services: ServiceStatus = {
        login: statusRes.services.login.status,
        char: statusRes.services.char.status,
        map: statusRes.services.map.status
      };
      const { label, className } = resolveServerStatus(services);

      setStatusData((prev) => ({
        ...prev,
        uptime: formatUptime(uptimeRes.uptime.formatted),
        server: label,
        serverStatusClass: className,
        players: playersRes.online,
        ping
      }));
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      setStatusData((prev) => ({
        ...prev,
        server: SERVER_STATUS_LABELS.Offline,
        serverStatusClass: 'offline',
        ping: -1
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsVisible(entry.isIntersecting));
      },
      { threshold: 0.2, rootMargin: '-50px 0px' }
    );

    const node = statusRef.current;
    if (node) observer.observe(node);
    return () => { if (node) observer.unobserve(node); };
  }, []);

  return (
    <div ref={statusRef} className={`server-status ${isVisible ? 'visible' : ''}`}>
      <div className="status-grid">
        <div className="status-column">
          <StatusItem
            title="Uptime"
            icon="/icons/vpn.gif"
            value={statusData.uptime}
            type="number"
          />
          <StatusItem
            title="Servidor"
            icon="/icons/server.gif"
            value={statusData.server}
            type="status"
            statusClass={statusData.serverStatusClass}
          />
        </div>

        <div className="status-center">
          <div className="event-card">
            <div className="event-icon">
              <img src="/icons/event.gif" alt="Evento" />
            </div>
            <div className="event-info">
              <div className="event-header">
                <span className="event-label">Próximo Evento</span>
                <span className="event-time">{statusData.eventDate}</span>
              </div>
              <h4 className="event-title">{statusData.eventName}</h4>
            </div>
          </div>
        </div>

        <div className="status-column">
          <StatusItem
            title="Jugadores"
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
