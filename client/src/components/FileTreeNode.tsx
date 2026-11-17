import { type JSX, useState } from 'react';
import type { FileNode } from '../../../shared/api';
import { formatBytes } from '../lib/format';

interface FileTreeNodeProps {
  node: FileNode;
  selected: ReadonlySet<string>;
  onToggle: (node: FileNode) => void;
  depth?: number;
}

export function FileTreeNode({
  node,
  selected,
  onToggle,
  depth = 0,
}: FileTreeNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selected.has(node.path);
  const isDirectory = node.type === 'directory';

  return (
    <li>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded ${isSelected ? 'bg-blue-50' : ''}`}
        style={{ paddingLeft: `${0.5 + depth}rem` }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(): void => onToggle(node)}
          aria-label={`Select ${node.name}`}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
        />
        <div
          className={`flex items-center gap-2 flex-1 min-w-0 ${isDirectory ? 'cursor-pointer' : ''}`}
          onClick={(): void => {
            if (isDirectory) setExpanded((value) => !value);
          }}
        >
          {isDirectory && <span className="text-sm">{expanded ? '📂' : '📁'}</span>}
          <span className="text-sm text-gray-900 flex-1 truncate">{node.name}</span>
          {node.size !== undefined && (
            <span className="text-xs text-gray-500">{formatBytes(node.size)}</span>
          )}
        </div>
      </div>
      {isDirectory && expanded && node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
