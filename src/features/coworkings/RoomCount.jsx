export default function RoomCount({ value, capacity, className }) {
  return (
    <span className={className}>
      <span className="room-count__value" key={value}>
        {value}
      </span>
      /{capacity}
    </span>
  )
}
