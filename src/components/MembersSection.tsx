import { useState } from 'react';
import { TextInput, Button, Tile, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Tag } from '@carbon/react';
import { TrashCan, Edit, CheckmarkFilled, Close, Share } from '@carbon/icons-react';
import { Member } from '../types';
import { getMemberAvatarColor } from '../utils/avatarColors';
import { capitalizeName } from '../utils/calculations';

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

interface MembersSectionProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onEditMember: (id: string, newName: string) => void;
  onDeleteMember: (id: string) => void;
  onShareGroup: () => void;
}

export default function MembersSection({ members, onAddMember, onEditMember, onDeleteMember, onShareGroup }: MembersSectionProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(newMemberName);
      setNewMemberName('');
    }
  };

  const headers = [
    { key: 'name', header: 'Nombre' },
    { key: 'actions', header: '' },
  ];

  const handleStartEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setEditingName(member.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onEditMember(id, editingName.trim());
      setEditingMemberId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditingName('');
  };

  const rows = members.map((member) => {
    const avatarColors = getMemberAvatarColor(member);
    const isEditing = editingMemberId === member.id;
    
    return {
      id: member.id,
      name: (
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
            {member.name.charAt(0).toUpperCase()}
          </div>
          {isEditing ? (
            <TextInput
              id={`edit-member-${member.id}`}
              labelText=""
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit(member.id);
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              autoFocus
              style={{ flex: 1, minWidth: '150px' }}
            />
          ) : (
            <Tag type={getTagTypeFromColor(avatarColors.bg)} size="sm">
              {capitalizeName(member.name)}
            </Tag>
          )}
        </div>
      ),
    actions: (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
        {isEditing ? (
          <>
            <Button
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Guardar"
              onClick={() => handleSaveEdit(member.id)}
              renderIcon={CheckmarkFilled}
            />
            <Button
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Cancelar"
              onClick={handleCancelEdit}
              renderIcon={Close}
            />
          </>
        ) : (
          <>
            <Button
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Editar"
              onClick={() => handleStartEdit(member)}
              renderIcon={Edit}
            />
            <Button
              kind="danger--tertiary"
              size="sm"
              hasIconOnly
              iconDescription="Eliminar"
              onClick={() => onDeleteMember(member.id)}
              renderIcon={TrashCan}
            />
          </>
        )}
      </div>
    ),
  };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Add Member Form */}
      <Tile>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          marginBottom: '1rem',
          backgroundColor: 'rgba(141, 141, 141, 0.20)',
          padding: '0.75rem 1rem',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginTop: '-1rem',
          borderLeft: '3px solid var(--cds-button-primary, #0f62fe)'
        }}>Agregar Integrante</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextInput
              id="member-name"
              labelText=""
              placeholder="Nombre del integrante"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                width: 'auto',
                minWidth: 'auto',
                padding: '0.75rem 1.5rem'
              }}
            >
              <span style={{ 
                display: 'inline-block',
                textAlign: 'center',
                width: '100%'
              }}>
                Agregar
              </span>
            </Button>
          </div>
        </form>
      </Tile>

      {/* Members List */}
      <Tile>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader key={header.key}>{header.header}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length} style={{ textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                    No hay integrantes registrados. Agrega el primero arriba.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell style={{ paddingTop: 'calc(1rem + 4px)', paddingBottom: 'calc(1rem + 4px)' }}>{row.name}</TableCell>
                    <TableCell style={{ paddingTop: 'calc(1rem + 4px)', paddingBottom: 'calc(1rem + 4px)', textAlign: 'right' }}>{row.actions}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Tile>

      {/* Share Group */}
      {members.length > 0 && (
        <Tile>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 500, 
            marginBottom: '1rem',
            backgroundColor: 'rgba(141, 141, 141, 0.20)',
            padding: '0.75rem 1rem',
            marginLeft: '-1rem',
            marginRight: '-1rem',
            marginTop: '-1rem',
            borderLeft: '3px solid var(--cds-button-primary, #0f62fe)'
          }}>Compartir Grupo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              Comparte este grupo con otros integrantes para que puedan ver los gastos en sus dispositivos.
            </p>
            <Button
              kind="primary"
              onClick={onShareGroup}
              renderIcon={Share}
            >
              Generar Link de Compartir
            </Button>
          </div>
        </Tile>
      )}
    </div>
  );
}
