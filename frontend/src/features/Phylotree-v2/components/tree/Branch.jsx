
const Branch = ({ link, xScale, yScale, settings, searchTerm, onClick, onContextMenu }) => {
  const { source, target } = link;

  // Calculate coordinates
  const x1 = xScale(source.x);
  const y1 = yScale(source.y);
  const x2 = xScale(target.x);
  const y2 = yScale(target.y);

  // Generate Path Data
  let d = '';
  // Default to simple line if no specific type
  // Check if we want curved or straight
  
  // Standard Rectangular Step
  d = `M ${x1} ${y1} V ${y2} H ${x2}`;


  const stroke = '#ccc';
  const strokeWidth = 2; // Fixed for now, can be dynamic
  
  // Highlighting logic can go here if needed

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
};

export default Branch;
