/**
 * Ô mã QR chuyển khoản như thiết kế WebDnVi (21 × 21 ô). Chưa tích hợp ngân hàng (VietQR) nên đây là hình minh họa,
 * người dùng chuyển khoản theo số tiền và nội dung ghi bên cạnh.
 */
const ROWS = [
  '..........#..........',
  '........#............',
  '........#............',
  '........###..........',
  '........#..##........',
  '.........###.........',
  '........###.#........',
  '.........#.#.........',
  '..##..#.###...#..##.#',
  '#.#..##..##....#..###',
  '....##.....####.####.',
  '#.#####....#.###.#.##',
  '##..###..##.#########',
  '........#.#.#...###..',
  '........#.#.#..#...#.',
  '.........#.#.###...##',
  '........###.#######..',
  '........#.##.##..##..',
  '..........#.......#..',
  '...........####.#..##',
  '........##...##..###.',
];
const FINDERS: [number, number][] = [
  [0, 0],
  [14, 0],
  [0, 14],
];

export function TransferQr() {
  return (
    <svg
      viewBox="0 0 21 21"
      width="84"
      height="84"
      role="img"
      aria-label="Mã QR chuyển khoản (minh họa)"
      className="block flex-none bg-white p-1 [shape-rendering:crispEdges]"
    >
      {FINDERS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" className="fill-ink" />
          <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-white" />
          <rect x={x + 2} y={y + 2} width="3" height="3" className="fill-ink" />
        </g>
      ))}
      {ROWS.flatMap((row, y) =>
        [...row].map((c, x) => (c === '#' ? <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" className="fill-ink" /> : null)),
      )}
    </svg>
  );
}
