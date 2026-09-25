// Geometry of the session flow: where each page sits, and how an edge is drawn
// between two of them.
//
// Pure functions, kept out of the component: a component renders, it does not
// compute — and the component had grown past the 450-line limit holding this.

export const NODE_W = 190
export const NODE_H = 72
const CELL_W = 260
const CELL_H = 170
const COLUMNS = 4

// A label wider than the box is cut rather than allowed to overflow it.
const clamp = (text: string) => {
  const value = String(text)
  return value.length > 20 ? `${value.slice(0, 19)}…` : value
}

// The way in, the way out, and what lies between.
const kickerOf = (node: any, index: number, total: number) => {
  if (index === 0) return 'Entrée'
  if (index === total - 1 && total > 1) return 'Sortie'
  return node.visits > 1 ? 'Carrefour' : 'Page'
}

/**
 * Places the pages in the order they were first seen, in a serpentine: two
 * pages that follow one another stay neighbours, and the path never jumps back
 * to the other side of the screen.
 */
export const layOutNodes = (nodes: any[]) => {
  const columns = Math.min(COLUMNS, Math.max(nodes.length, 1))

  return nodes.map((node, index) => {
    const row = Math.floor(index / columns)
    const inRow = index % columns
    const column = row % 2 === 0 ? inRow : columns - 1 - inRow
    return {
      ...node,
      x: column * CELL_W + CELL_W / 2,
      y: row * CELL_H + CELL_H / 2,
      kicker: kickerOf(node, index, nodes.length),
      short: clamp(node.label || node.id),
    }
  })
}

export const boardSize = (count: number) => {
  const total = Math.max(count, 1)
  const columns = Math.min(COLUMNS, total)
  return { width: columns * CELL_W, height: Math.ceil(total / columns) * CELL_H }
}

// Where an edge meets the border of a page, so it does not start from the
// centre and run underneath the box.
const border = (from: any, to: any, offset: number) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const scale = Math.min(
    Math.abs(dx) > 1 ? (NODE_W / 2 + 10) / Math.abs(dx) : Infinity,
    Math.abs(dy) > 1 ? (NODE_H / 2 + 10) / Math.abs(dy) : Infinity,
  )
  // Perpendicular offset: a move there and a move back between the same two
  // pages must stay two distinct lines.
  const nx = (-dy / length) * offset
  const ny = (dx / length) * offset
  return { x: from.x + dx * scale + nx, y: from.y + dy * scale + ny }
}

/**
 * Turns the edges of the flow into paths and arrow heads.
 *
 * @param nodeAt resolves a node identifier to its placed node.
 * @param isTravelled whether the visitor has already been through that edge.
 */
export const layOutEdges = (
  edges: any[],
  nodeAt: (id: string) => any,
  isTravelled: (key: string) => boolean,
) =>
  edges
    .map((edge) => {
      const from = nodeAt(edge.from)
      const to = nodeAt(edge.to)
      if (!from || !to) return null

      const twoWay = edges.some((other) => other.from === edge.to && other.to === edge.from)
      const offset = twoWay ? (edge.from < edge.to ? -14 : 14) : 0
      const start = border(from, to, offset)
      const end = border(to, from, -offset)
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const head = 13

      return {
        key: `${edge.from}->${edge.to}`,
        from: edge.from,
        to: edge.to,
        d: `M${start.x} ${start.y} L${end.x} ${end.y}`,
        head:
          `M${end.x} ${end.y} ` +
          `L${end.x - head * Math.cos(angle - 0.5)} ${end.y - head * Math.sin(angle - 0.5)} ` +
          `L${end.x - head * Math.cos(angle + 0.5)} ${end.y - head * Math.sin(angle + 0.5)}Z`,
        travelled: isTravelled(`${edge.from}->${edge.to}`),
      }
    })
    .filter(Boolean) as any[]
