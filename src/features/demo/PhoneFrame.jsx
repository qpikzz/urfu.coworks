export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__screen">{children}</div>
    </div>
  )
}
