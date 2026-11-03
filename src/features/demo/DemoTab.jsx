export default function DemoTab({ hidden }) {
  return (
    <section
      id="panel-demo"
      className="tab-panel tab-panel--demo"
      aria-labelledby="tab-demo"
      hidden={hidden}
    />
  )
}
