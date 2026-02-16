/**
 * WorldMap - Interactive world map showing US and China as the two rival states
 * Uses react-simple-maps for geographic visualization
 */

import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { useActors, useHistory, useEquilibrium } from '../../store/gameStore';
import { StateInfoPanel } from './StateInfoPanel';

// Natural Earth TopoJSON URL (110m resolution for performance)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country ISO codes
const USA_ISO = '840';
const CHINA_ISO = '156';

// Color configuration
const COLORS = {
  usa: {
    default: '#3b82f6', // blue-500
    hover: '#60a5fa',   // blue-400
    selected: '#2563eb', // blue-600
  },
  china: {
    default: '#f97316', // orange-500
    hover: '#fb923c',   // orange-400
    selected: '#ea580c', // orange-600
  },
  other: {
    default: '#374151', // gray-700
    hover: '#4b5563',   // gray-600
  },
  border: '#1f2937',    // gray-800
  ocean: '#030712',     // gray-950
};

export function WorldMap() {
  const actors = useActors();
  const history = useHistory();
  const equilibrium = useEquilibrium();
  const [selectedCountry, setSelectedCountry] = useState<'usa' | 'china' | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const latestOutcome = history.length > 0 ? history[history.length - 1] : undefined;

  const getCountryColor = (geoId: string, isHovered: boolean) => {
    if (geoId === USA_ISO) {
      if (selectedCountry === 'usa') return COLORS.usa.selected;
      if (isHovered) return COLORS.usa.hover;
      return COLORS.usa.default;
    }
    if (geoId === CHINA_ISO) {
      if (selectedCountry === 'china') return COLORS.china.selected;
      if (isHovered) return COLORS.china.hover;
      return COLORS.china.default;
    }
    if (isHovered) return COLORS.other.hover;
    return COLORS.other.default;
  };

  const handleCountryClick = (geoId: string) => {
    if (geoId === USA_ISO) {
      setSelectedCountry(selectedCountry === 'usa' ? null : 'usa');
    } else if (geoId === CHINA_ISO) {
      setSelectedCountry(selectedCountry === 'china' ? null : 'china');
    }
  };

  const getSelectedActor = () => {
    if (selectedCountry === 'usa') return actors[0];
    if (selectedCountry === 'china') return actors[1];
    return null;
  };

  const getSelectedPayoff = () => {
    if (!latestOutcome) return undefined;
    if (selectedCountry === 'usa') return latestOutcome.payoffs[0];
    if (selectedCountry === 'china') return latestOutcome.payoffs[1];
    return undefined;
  };

  // Outcome styling config
  const getOutcomeStyle = (outcomeType: string) => {
    const styles: Record<string, { icon: string; label: string; color: string }> = {
      peace: { icon: '✓', label: 'Peace', color: 'text-green-400' },
      dsa_victory_1: { icon: '⚔', label: 'US Victory (DSA)', color: 'text-blue-400' },
      dsa_victory_2: { icon: '⚔', label: 'China Victory (DSA)', color: 'text-orange-400' },
      catastrophe: { icon: '💥', label: 'Catastrophe', color: 'text-red-400' },
    };
    return styles[outcomeType] || styles.peace;
  };

  return (
    <div className="relative flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden" style={{ height: 650 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900/80 z-10">
        <h2 className="text-lg font-semibold text-white">Strategic Landscape</h2>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.usa.default }} />
            <span>United States</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.china.default }} />
            <span>China</span>
          </div>
        </div>
      </div>

      {/* Map Container - outer wrapper centers the fixed-size map */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center" style={{ backgroundColor: COLORS.ocean }}>
        {/* Fixed-size wrapper prevents repositioning on container resize */}
        <div className="relative" style={{ width: 800, height: 500 }}>
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{
              scale: 160,
              center: [20, 20],
            }}
            width={800}
            height={500}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const geoId = geo.id;
                    const isUSA = geoId === USA_ISO;
                    const isChina = geoId === CHINA_ISO;
                    const isHovered = hoveredCountry === geoId;
                    const isClickable = isUSA || isChina;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(geoId, isHovered)}
                        stroke={COLORS.border}
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: 'none',
                            transition: 'fill 0.2s ease',
                          },
                          hover: {
                            outline: 'none',
                            cursor: isClickable ? 'pointer' : 'default',
                          },
                          pressed: {
                            outline: 'none',
                          },
                        }}
                        onMouseEnter={() => setHoveredCountry(geoId)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => handleCountryClick(geoId)}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* State Info Panel */}
          {selectedCountry && (
            <StateInfoPanel
              actor={getSelectedActor()!}
              equilibriumSignalingCutoff={equilibrium.signalingCutoff}
              latestPayoff={getSelectedPayoff()}
              isState1={selectedCountry === 'usa'}
              onClose={() => setSelectedCountry(null)}
            />
          )}

        </div>
      </div>

      {/* Footer: Outcome + Capability comparison */}
      {latestOutcome && (
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/80">
          {/* Outcome row */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={`font-semibold ${getOutcomeStyle(latestOutcome.outcome).color}`}>
              {getOutcomeStyle(latestOutcome.outcome).icon} {getOutcomeStyle(latestOutcome.outcome).label}
            </span>
            <span className="text-xs text-gray-500">Round {latestOutcome.round}</span>
            {latestOutcome.minorConflictOccurred && (
              <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-400">
                Signaling
              </span>
            )}
            <span className="text-xs">
              <span className={latestOutcome.payoffs[0] >= 0 ? 'text-green-400' : 'text-red-400'}>
                US: {latestOutcome.payoffs[0] >= 0 ? '+' : ''}{latestOutcome.payoffs[0].toFixed(1)}
              </span>
              {' / '}
              <span className={latestOutcome.payoffs[1] >= 0 ? 'text-green-400' : 'text-red-400'}>
                CN: {latestOutcome.payoffs[1] >= 0 ? '+' : ''}{latestOutcome.payoffs[1].toFixed(1)}
              </span>
            </span>
          </div>
          {/* Capability comparison row */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-blue-400 font-mono">
                K_US = {latestOutcome.capabilityDraws[0].toFixed(2)}
              </div>
            </div>
            <div className="text-gray-500">
              {latestOutcome.capabilityDraws[0] > latestOutcome.capabilityDraws[1] ? '>' :
               latestOutcome.capabilityDraws[0] < latestOutcome.capabilityDraws[1] ? '<' : '='}
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-mono">
                K_CN = {latestOutcome.capabilityDraws[1].toFixed(2)}
              </div>
            </div>
            <div className="text-gray-500 text-xs">
              (Gap: {Math.abs(latestOutcome.capabilityDraws[0] - latestOutcome.capabilityDraws[1]).toFixed(2)},
              DSA threshold T = {equilibrium.attackCutoffNoSignal > 0 ? '2.00' : '-'})
            </div>
          </div>
        </div>
      )}

      {/* Click hint when no outcome */}
      {!latestOutcome && !selectedCountry && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm">
          Click on US or China to view state details
        </div>
      )}
    </div>
  );
}
