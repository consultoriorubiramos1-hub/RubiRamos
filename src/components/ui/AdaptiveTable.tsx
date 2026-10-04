'use client';

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type ElementProps = {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  onClick?: () => void;
};

function textContent(node: ReactNode): string {
  return Children.toArray(node).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    return isValidElement<ElementProps>(child) ? textContent(child.props.children) : '';
  }).join(' ').replace(/\s+/g, ' ').trim();
}

/** Keeps the original records and handlers; only their presentation changes. */
export default function AdaptiveTable({ children, mobile = 'records', label = 'Tabla de registros' }: {
  children: ReactElement<ElementProps>;
  mobile?: 'records' | 'scroll';
  label?: string;
}) {
  const headers: ReactElement<ElementProps>[] = [];
  function findHeaders(node: ReactNode) {
    Children.forEach(node, child => {
      if (!isValidElement<ElementProps>(child)) return;
      if (child.type === 'th') headers.push(child);
      else findHeaders(child.props.children);
    });
  }
  findHeaders(children);
  // Grouped clinical headings cannot be flattened into one label per cell.
  const presentation = headers.some(header => (header.props.colSpan || 1) > 1 || (header.props.rowSpan || 1) > 1) ? 'scroll' : mobile;
  const labels = headers.map(header => textContent(header.props.children));

  function decorate(node: ReactNode): ReactNode {
    return Children.map(node, child => {
      if (!isValidElement<ElementProps>(child)) return child;
      if (child.type === 'tr') {
        let column = 0;
        return cloneElement(child, {}, Children.map(child.props.children, cell => {
          if (!isValidElement<ElementProps>(cell) || cell.type !== 'td') return decorate(cell);
          const label = labels[column++] || 'Detalle';
          if (cell.props.colSpan) return cell;
          return cloneElement(cell, { 'data-label': label } as Partial<ElementProps>,
            <div className="record-value">{cell.props.children}</div>);
        }));
      }
      if (child.type === 'th') {
        return cloneElement(child, {
          scope: (child.props.colSpan || 1) > 1 ? 'colgroup' : 'col',
          ...(child.props.onClick ? {
            tabIndex: 0,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                child.props.onClick?.();
              }
            },
          } : {}),
        } as Partial<ElementProps>);
      }
      return cloneElement(child, {}, decorate(child.props.children));
    });
  }

  return (
    <div className={`adaptive-table adaptive-table--${presentation}`}>
      {presentation === 'records' && headers.some(header => header.props.onClick) && (
        <div className="record-sort" aria-label="Ordenar registros">
          <span>Ordenar por:</span>
          {headers.filter(header => header.props.onClick).map((header, index) => (
            <button type="button" key={index} onClick={header.props.onClick}>{header.props.children}</button>
          ))}
        </div>
      )}
      {presentation === 'scroll' && <p className="table-scroll-hint">Desliza horizontalmente para consultar todas las columnas ↔</p>}
      <div className="table-viewport" role="region" aria-label={label} tabIndex={presentation === 'scroll' ? 0 : undefined}>
        {presentation === 'records' ? decorate(children) : children}
      </div>
    </div>
  );
}
