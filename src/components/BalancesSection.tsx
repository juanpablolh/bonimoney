import { Tile, Tag } from '@carbon/react';
import { Balance, Member } from '../types';
import { formatCurrency, capitalizeName } from '../utils/calculations';
import { getMemberAvatarColor } from '../utils/avatarColors';

interface BalancesSectionProps {
  balances: Balance[];
  members: Member[];
}

// Helper function to find member by name or ID
function findMember(members: Member[], identifier: string): Member | undefined {
  return members.find(m => m.id === identifier || m.name === identifier);
}

// Helper function to map hex color to Carbon Tag type
function getTagTypeFromColor(bgColor: string): 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' | 'cool-gray' | 'warm-gray' {
  const colorMap: Record<string, 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' | 'cool-gray' | 'warm-gray'> = {
    '#002d9c': 'blue',
    '#da1e28': 'red',
    '#198038': 'green',
    '#8d3f9b': 'purple',
    '#0072c3': 'cyan',
    '#007d79': 'teal',
    '#a2191f': 'magenta',
    '#004144': 'teal',
    '#0043ce': 'blue',
    '#00539a': 'blue',
    '#6f2c3d': 'red',
    '#0e6027': 'green',
    '#5b21d0': 'purple',
    '#005d5d': 'teal',
  };
  
  // Normalize color (remove spaces, convert to lowercase)
  const normalizedColor = bgColor.toLowerCase().trim();
  return colorMap[normalizedColor] || 'gray';
}

export default function BalancesSection({
  balances,
  members,
}: BalancesSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '40px' }}>
      {/* Individual Balances */}
      <Tile>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Balance por Persona</h3>
        {balances.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--cds-text-secondary)', padding: '2rem' }}>
            No hay integrantes registrados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {balances.map((balance) => {
              const balanceColor = balance.balance > 0.01
                ? 'var(--cds-text-primary)'
                : balance.balance < -0.01
                ? 'var(--cds-support-error)'
                : 'var(--cds-text-secondary)';
              
              const member = findMember(members, balance.memberId);
              const avatarColors = getMemberAvatarColor(
                member || { name: balance.memberName }
              );

              return (
                <div
                  key={balance.memberId}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--cds-layer-01)',
                    borderRadius: '4px',
                    border: '1px solid var(--cds-border-subtle-01)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: avatarColors.bg,
                        color: avatarColors.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 500,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {balance.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Tag type={getTagTypeFromColor(avatarColors.bg)} size="sm">
                          {capitalizeName(balance.memberName)}
                        </Tag>
                        <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
                          Pagó: {formatCurrency(balance.totalPaid)} • Debe: {formatCurrency(balance.totalOwed)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 500, color: balanceColor }}>
                      {balance.balance > 0.01
                        ? `+${formatCurrency(balance.balance)}`
                        : balance.balance < -0.01
                        ? formatCurrency(balance.balance)
                        : formatCurrency(0)}
                    </div>
                  </div>
                  <div>
                    {balance.balance > 0.01 && (
                      <Tag type="blue" size="sm">Le deben dinero</Tag>
                    )}
                    {balance.balance < -0.01 && (
                      <Tag type="red" size="sm">Debe dinero</Tag>
                    )}
                    {Math.abs(balance.balance) < 0.01 && (
                      <Tag type="gray" size="sm">Balance saldado</Tag>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Tile>
    </div>
  );
}
