import React from 'react';
import type { DamageRecord } from '../services/tramadoData';

type Props = {
  damages: DamageRecord[];
  onToggle: (zone: string) => void;
};

const zones = [
  { id: 'Frente', x: 153, y: 16, w: 94, h: 48, label: 'Frente' },
  { id: 'Parabrisas', x: 139, y: 79, w: 122, h: 48, label: 'Parabrisas' },
  { id: 'Techo', x: 143, y: 137, w: 114, h: 118, label: 'Techo' },
  { id: 'Parte trasera', x: 153, y: 326, w: 94, h: 48, label: 'Trasera' },
  { id: 'Lado izquierdo', x: 57, y: 92, w: 68, h: 205, label: 'Izquierdo' },
  { id: 'Lado derecho', x: 275, y: 92, w: 68, h: 205, label: 'Derecho' },
  { id: 'Vidrios', x: 138, y: 266, w: 124, h: 48, label: 'Vidrios' },
];

const VehicleDamageDiagram: React.FC<Props> = ({ damages, onToggle }) => {
  const selected = new Set(damages.map(item => item.zone));
  const wheelsSelected = selected.has('Aros / llantas');
  const interiorSelected = selected.has('Interior');

  return (
    <div className="cc-vehicle-diagram-wrap">
      <svg className="cc-vehicle-diagram-svg" viewBox="0 0 400 400" role="img" aria-label="Diagrama superior del vehículo para marcar daños">
        <rect x="118" y="10" width="164" height="380" rx="70" className="cc-car-body" />
        <path d="M145 72 Q200 38 255 72 L272 316 Q200 352 128 316 Z" className="cc-car-cabin" />
        <path d="M148 84 Q200 60 252 84 L258 126 L142 126 Z" className="cc-car-glass" />
        <path d="M142 264 L258 264 L252 306 Q200 329 148 306 Z" className="cc-car-glass" />

        {zones.map(zone => {
          const active = selected.has(zone.id);
          return (
            <g key={zone.id} onClick={() => onToggle(zone.id)} className={`cc-diagram-zone${active ? ' selected' : ''}`}>
              <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="14" />
              <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 4}>{zone.label}</text>
            </g>
          );
        })}

        <g onClick={() => onToggle('Aros / llantas')} className={`cc-diagram-zone cc-wheel-zone${wheelsSelected ? ' selected' : ''}`}>
          <rect x="92" y="82" width="30" height="74" rx="13" />
          <rect x="278" y="82" width="30" height="74" rx="13" />
          <rect x="92" y="245" width="30" height="74" rx="13" />
          <rect x="278" y="245" width="30" height="74" rx="13" />
          <text x="200" y="387">Aros / llantas</text>
        </g>

        <g onClick={() => onToggle('Interior')} className={`cc-diagram-zone cc-interior-zone${interiorSelected ? ' selected' : ''}`}>
          <rect x="159" y="157" width="82" height="82" rx="22" />
          <text x="200" y="202">Interior</text>
        </g>
      </svg>
      <div className="cc-diagram-help">Toca una zona para marcar o quitar un daño.</div>
    </div>
  );
};

export default VehicleDamageDiagram;
